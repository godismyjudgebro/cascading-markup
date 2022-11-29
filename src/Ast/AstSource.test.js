const AstSource = require('./AstSource').default

// eslint-disable-next-line max-statements
test('new AstSource', () => {
  const sourceCode = 'foo bar \n baz \n qux'
  const startIndex = 12
  const endIndex = sourceCode.length
  const source = new AstSource(null, startIndex, endIndex, sourceCode)

  expect(source.code).toBe(sourceCode)
  expect(source.codeSection).toBe('z \n qux')
  expect(source.position.end.column).toBe(5)
  expect(source.position.end.index).toBe(endIndex)
  expect(source.position.end.line).toBe(3)
  expect(source.position.length).toBe(endIndex - startIndex)
  expect(source.position.start.column).toBe(4)
  expect(source.position.start.index).toBe(startIndex)
  expect(source.position.start.line).toBe(2)
  expect(source.indexFromLineNumber(2)).toBe(9)
})
