const AstFileNode = require('./AstFileNode').default
const AstTextNode = require('./AstTextNode').default

/**
 * Check that the text node is correct.
 *
 * @param {AstTextNode} node - The node to check.
 */
function isCorrect(node) {
  expect(node.innerHtml).toBe(node.outerHtml)
  expect(node.name).toBe('foo bar \\n <baz> qux')
  expect(node.outerHtml).toBe('foo bar <br> &lt;baz&gt; qux')
  expect(node.type).toBe('Text')
}

test('new AstTextNode', () => {
  const node = new AstTextNode('foo bar \\n <baz> qux', null, null)

  isCorrect(node)
})

test('AstTextNode.parse', () => {
  const file = new AstFileNode('"foo bar \\n <baz> qux"')
  const node = AstTextNode.parse(file, file, 0)

  isCorrect(node)
})
