module.exports = {
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  toString: jest.fn().mockResolvedValue('mock-qr-code-string'),
  toCanvas: jest.fn().mockResolvedValue({}),
  toFile: jest.fn().mockResolvedValue({})
}; 