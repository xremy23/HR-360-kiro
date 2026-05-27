export const webSocketServerMock = {
  broadcastAlertCreated: jest.fn(),
  broadcastSOSCreated: jest.fn(),
  broadcastIncidentCreated: jest.fn(),
  broadcastNotificationToUser: jest.fn(),
  broadcastNotificationToUsers: jest.fn(),
  broadcastNotificationToOrganization: jest.fn(),
  broadcastLocationUpdate: jest.fn(),
  broadcastGeofenceTriggered: jest.fn(),
  isUserConnected: jest.fn(),
};

export const getWebSocketServer = jest.fn().mockReturnValue(webSocketServerMock);

export default {
  webSocketServerMock,
  getWebSocketServer,
};
