export const mockConnection = {
  query: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
};

export const getConnection = jest.fn().mockResolvedValue(mockConnection);

// Mock the query function directly
export const query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });

export default { getConnection, mockConnection, query };
