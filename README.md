# Static Chat - WebRTC Video Chat

A self-hosted, browser-based video chat application for one-on-one video calls with family and friends. Built with WebRTC, Azure Functions, and Azure SignalR Service.

## Features

- **Zero Friction**: No downloads, installs, or account creation required
- **Browser-Based**: Works directly in modern web browsers
- **End-to-End Encrypted**: WebRTC connections use DTLS/SRTP encryption
- **Ephemeral Rooms**: No persistent storage or data retention
- **Simple Sharing**: Share a unique room URL to invite others
- **Self-Hosted**: Full control over implementation and infrastructure

## Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Azure Functions (Node.js)
- **Real-time**: Azure SignalR Service for WebRTC signaling
- **WebRTC**: Browser native APIs for peer-to-peer media
- **Hosting**: Azure Static Web Apps

## Project Structure

```
.
├── chat/                   # Video chat frontend
│   ├── index.html         # Main chat page
│   ├── style.css          # Styling
│   └── chat.js            # WebRTC and SignalR logic
├── api/                   # Azure Functions backend
│   ├── negotiate/         # SignalR connection endpoint
│   ├── sendSignal/        # WebRTC signaling relay
│   ├── joinRoom/          # Room group management
│   ├── host.json          # Azure Functions configuration
│   └── package.json       # Node.js dependencies
├── index.html             # Landing page
├── staticwebapp.config.json  # Azure Static Web Apps config
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Azure account with:
  - Azure Static Web Apps resource
  - Azure SignalR Service (Free tier is sufficient)
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

### Deployment

1. **Fork or clone this repository**

2. **Create Azure SignalR Service**:
   - Create a SignalR Service resource in Azure Portal
   - Choose Free tier (20 concurrent connections, 20k messages/day)
   - **IMPORTANT**: Set Service Mode to **"Serverless"** (Settings → Service Mode)
     - This application uses Azure Functions and requires Serverless mode
     - Default mode will cause connection errors
   - Copy the connection string

3. **Deploy to Azure Static Web Apps**:
   - Create a new Static Web App in Azure Portal
   - Connect to your repository
   - Set build configuration:
     - App location: `/`
     - Api location: `api`
     - Output location: `` (empty)
   - Add application setting:
     - Name: `AzureSignalRConnectionString`
     - Value: [Your SignalR connection string]

4. **Access the application**:
   - Navigate to your Static Web App URL
   - Click "Start a Video Chat" to create a new room
   - Share the room URL with someone to start chatting

### Local Development

1. **Install Azure Functions Core Tools**:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. **Create local settings** (`api/local.settings.json`):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureSignalRConnectionString": "[Your SignalR connection string]"
     }
   }
   ```
   
   **Note**: Ensure your Azure SignalR Service is in **Serverless** mode (see deployment instructions above).

3. **Start the local server**:
   ```bash
   # In the api directory
   cd api
   func start
   ```

4. **Serve the frontend** (in a separate terminal):
   ```bash
   # Use any static file server, for example:
   npx http-server -p 8080
   ```

5. **Access the application** at `http://localhost:8080`

## How It Works

1. **Room Creation**: When a user visits `/chat`, a unique room ID is generated and added to the URL hash
2. **Media Capture**: The browser requests camera and microphone permissions and displays local video
3. **SignalR Connection**: The client connects to Azure SignalR Service and joins a room group
4. **WebRTC Signaling**: When a second participant joins, WebRTC offer/answer/ICE candidates are exchanged through SignalR
5. **Peer Connection**: After signaling completes, video and audio flow directly between browsers (peer-to-peer)
6. **Ephemeral State**: When all participants disconnect, the room ceases to exist (no cleanup required)

## Security & Privacy

- **End-to-End Encryption**: All media streams are encrypted using WebRTC's built-in DTLS/SRTP
- **No Data Storage**: No video, audio, or chat data is stored on servers
- **Ephemeral Rooms**: Room state exists only in memory during active sessions
- **STUN Only**: Uses Google's public STUN servers for NAT traversal (no media relay through servers)

## Browser Support

- Chrome/Edge 28+
- Firefox 22+
- Safari 11+
- Opera 18+

## Limitations

- **One-on-One Only**: Designed for 1-on-1 calls (not group video conferencing)
- **No Recording**: No built-in recording functionality
- **NAT Traversal**: Some restrictive networks may require a TURN server (not included)
- **No Mobile Apps**: Browser-only (responsive design works on mobile browsers)

## Troubleshooting

### SignalR Handshake Error: "Server returned handshake error"

**Error Message**: 
```
Server returned handshake error: SignalR Service is now in 'Default' service mode. 
Current mode works as a proxy that routes client traffic to the connected app servers. 
However app servers are not connected.
```

**Solution**:
1. Go to Azure Portal → Your SignalR Service resource
2. Navigate to **Settings** → **Service Mode**
3. Change from **"Default"** to **"Serverless"**
4. Save the changes
5. Wait a few seconds and refresh your application

This error occurs when the SignalR Service is in Default mode, which expects a persistent server connection. Since this application uses Azure Functions (serverless architecture), the service must be in Serverless mode.

## Cost Considerations

- **Azure SignalR Service**: Free tier includes 20 concurrent connections and 20,000 messages per day
- **Azure Static Web Apps**: Free tier includes 100 GB bandwidth per month
- **Azure Functions**: Consumption plan includes 1 million free requests per month
- **Estimated Cost**: $0/month for typical personal use under free tier limits

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
