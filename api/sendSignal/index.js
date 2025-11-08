module.exports = async function (context, req) {
  const { roomId, signal, type } = req.body;

  // Validate input
  if (!roomId || !signal || !type) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: roomId, signal, type' }
    };
    return;
  }

  // Send message to SignalR group
  context.bindings.signalRMessages = [{
    target: 'signal',
    arguments: [{ type, signal }],
    groupName: roomId
  }];

  context.res = {
    status: 200,
    body: { success: true }
  };
};
