export const AlertEntityMock = {
  create: jest.fn(),
  findById: jest.fn(),
  findByOrgId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const UserEntityMock = {
  create: jest.fn(),
  findById: jest.fn(),
  findByOrgId: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
};

export const PushNotificationEntityMock = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  markAsRead: jest.fn(),
  markAsDelivered: jest.fn(),
  deleteOlderThan: jest.fn(),
};

export const DeviceTokenEntityMock = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  upsert: jest.fn(),
  deleteByToken: jest.fn(),
  deactivate: jest.fn(),
};

export default {
  AlertEntityMock,
  UserEntityMock,
  PushNotificationEntityMock,
  DeviceTokenEntityMock,
};
