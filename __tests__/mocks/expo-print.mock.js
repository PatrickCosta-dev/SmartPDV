module.exports = {
  printToFileAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-pdf-uri.pdf'
  }),
  printAsync: jest.fn().mockResolvedValue({}),
  selectPrinterAsync: jest.fn().mockResolvedValue({}),
  printToFileAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-pdf-uri.pdf'
  })
}; 