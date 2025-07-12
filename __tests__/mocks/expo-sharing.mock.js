module.exports = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue({}),
  share: jest.fn().mockResolvedValue({})
}; 