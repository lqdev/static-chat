// Global state
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let signalRConnection = null;
let roomId = null;
let isMuted = false;
let isVideoOff = false;

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Initialize the application
async function init() {
  try {
    // Get or generate room ID from URL hash
    roomId = window.location.hash.substring(1);

    if (!roomId) {
      roomId = generateRoomId();
      window.location.hash = roomId;
      showShareLink();
    }

    // Request media permissions and get local stream
    await getLocalMedia();

    // Setup SignalR connection
    await setupSignalR();

    showStatus('Connected to room', 'success');
  } catch (error) {
    console.error('Initialization error:', error);
    showStatus('Failed to initialize: ' + error.message, 'error');
  }
}

// Generate a random room ID
function generateRoomId() {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(36))
    .join('')
    .substring(0, 12);
}

// Get local media (camera and microphone)
async function getLocalMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    document.getElementById('localVideo').srcObject = localStream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    showStatus('Error: ' + error.message + '. Please allow camera and microphone access.', 'error');
    throw error;
  }
}

// Setup SignalR connection
async function setupSignalR() {
  try {
    // Create SignalR connection
    signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl('/api')
      .withAutomaticReconnect()
      .build();

    // Handle incoming signals
    signalRConnection.on('signal', async (data) => {
      console.log('Received signal:', data.type);

      try {
        if (data.type === 'offer') {
          await handleOffer(data.signal);
        } else if (data.type === 'answer') {
          await handleAnswer(data.signal);
        } else if (data.type === 'ice-candidate') {
          await handleIceCandidate(data.signal);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        showStatus('Error handling signal: ' + error.message, 'error');
      }
    });

    // Handle user joined
    signalRConnection.on('userJoined', () => {
      console.log('User joined the room');
      hideShareLink();
      createPeerConnection();
      createOffer();
    });

    // Start connection
    await signalRConnection.start();
    console.log('SignalR connected');

    // Join room
    await fetch('/api/joinRoom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomId,
        connectionId: signalRConnection.connectionId
      })
    });

    console.log('Joined room:', roomId);
  } catch (error) {
    console.error('SignalR setup error:', error);
    showStatus('Failed to connect to signaling server', 'error');
    throw error;
  }
}

// Create peer connection
function createPeerConnection() {
  if (peerConnection) {
    return;
  }

  peerConnection = new RTCPeerConnection(rtcConfig);

  // Add local tracks to peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle incoming tracks
  peerConnection.ontrack = (event) => {
    console.log('Received remote track');
    const remoteVideo = document.getElementById('remoteVideo');
    if (!remoteVideo.srcObject) {
      remoteStream = new MediaStream();
      remoteVideo.srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
    hideShareLink();
    showStatus('Connected!', 'success');
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Sending ICE candidate');
      sendSignal('ice-candidate', event.candidate);
    }
  };

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    if (peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed') {
      showStatus('Connection lost', 'error');
    }
  };
}

// Create and send offer
async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    sendSignal('offer', offer);
    console.log('Offer sent');
  } catch (error) {
    console.error('Error creating offer:', error);
    showStatus('Error creating offer: ' + error.message, 'error');
  }
}

// Handle incoming offer
async function handleOffer(offer) {
  createPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendSignal('answer', answer);
  console.log('Answer sent');
}

// Handle incoming answer
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  console.log('Answer received');
}

// Handle incoming ICE candidate
async function handleIceCandidate(candidate) {
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('ICE candidate added');
  }
}

// Send signal through SignalR
async function sendSignal(type, signal) {
  try {
    await fetch('/api/sendSignal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomId,
        type: type,
        signal: signal,
        connectionId: signalRConnection.connectionId
      })
    });
  } catch (error) {
    console.error('Error sending signal:', error);
    showStatus('Error sending signal', 'error');
  }
}

// Show share link interface
function showShareLink() {
  const shareSection = document.getElementById('shareLink');
  const linkInput = document.getElementById('linkInput');
  shareSection.style.display = 'block';
  linkInput.value = window.location.href;
}

// Hide share link interface
function hideShareLink() {
  const shareSection = document.getElementById('shareLink');
  shareSection.style.display = 'none';
}

// Copy link to clipboard
document.getElementById('copyBtn').addEventListener('click', async () => {
  const linkInput = document.getElementById('linkInput');
  try {
    await navigator.clipboard.writeText(linkInput.value);
    showStatus('Link copied to clipboard!', 'success');
  } catch (error) {
    // Fallback for older browsers
    linkInput.select();
    document.execCommand('copy');
    showStatus('Link copied to clipboard!', 'success');
  }
});

// Toggle mute
document.getElementById('muteBtn').addEventListener('click', () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isMuted = !isMuted;
      audioTrack.enabled = !isMuted;
      const btn = document.getElementById('muteBtn');
      const label = btn.querySelector('.label');
      if (isMuted) {
        btn.classList.add('active');
        label.textContent = 'Unmute';
      } else {
        btn.classList.remove('active');
        label.textContent = 'Mute';
      }
    }
  }
});

// Toggle video
document.getElementById('videoBtn').addEventListener('click', () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      isVideoOff = !isVideoOff;
      videoTrack.enabled = !isVideoOff;
      const btn = document.getElementById('videoBtn');
      const label = btn.querySelector('.label');
      if (isVideoOff) {
        btn.classList.add('active');
        label.textContent = 'Start Video';
      } else {
        btn.classList.remove('active');
        label.textContent = 'Stop Video';
      }
    }
  }
});

// Hang up
document.getElementById('hangupBtn').addEventListener('click', () => {
  // Stop all media tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Close SignalR connection
  if (signalRConnection) {
    signalRConnection.stop();
  }

  // Clear video elements
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('remoteVideo').srcObject = null;

  // Show status
  showStatus('Call ended', 'success');

  // Optionally redirect or reload
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
});

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = 'status-message ' + type;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}

// Initialize on page load
window.addEventListener('load', init);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden');
  } else {
    console.log('Page visible');
  }
});
