module.exports = async function (context, req) {
  const { roomId, signal, type, connectionId } = req.body;

  // Validate input
  if (!roomId || !signal || !type || !connectionId) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: roomId, signal, type, connectionId' }
    };
    return;
  }

  // Send message to SignalR group excluding the sender
  context.bindings.signalRMessages = [{
    target: 'signal',
    arguments: [{ type, signal }],
    groupName: roomId,
    userId: connectionId
  }];

  context.res = {
    status: 200,
    body: { success: true }
  };
};
