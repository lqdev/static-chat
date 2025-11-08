module.exports = async function (context, req) {
  const { roomId, connectionId } = req.body;

  // Validate input
  if (!roomId || !connectionId) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: roomId, connectionId' }
    };
    return;
  }

  // Add connection to SignalR group
  context.bindings.signalRGroupActions = [{
    groupName: roomId,
    action: 'add',
    connectionId: connectionId
  }];

  context.res = {
    status: 200,
    body: { success: true }
  };
};
