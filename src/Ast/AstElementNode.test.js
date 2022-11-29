const AstElementNode = require('./AstElementNode').default
const AstFileNode = require('./AstFileNode').default

/**
 * Check that the element node is correct.
 *
 * @param {AstElementNode} node - The node to check.
 */
function isCorrect(node) {
  expect(node.attributes).toEqual([
    { key: 'class', value: 'bar foo' },
    { key: 'foo', value: 'bar baz qux' },
    { key: 'id', value: 'foo' }
  ])
  expect(node.outerHtml).toBe(
    '<div class="bar foo" foo="bar baz qux" id=foo></div>'
  )
  expect(node.name).toBe('div')
  expect(node.type).toBe('Element')
}

test('new AstElementNode', () => {
  const node = new AstElementNode('div', null, null, [
    { key: 'class', value: 'bar foo' },
    { key: 'id', value: 'foo' },
    { key: 'foo', value: 'bar baz qux' }
  ])

  isCorrect(node)
})

test('AstElementNode.parse (with explicit tag name)', () => {
  const file = new AstFileNode('div#foo.bar.foo[foo="bar baz qux"]')
  const node = AstElementNode.parse(file, file, 0)

  isCorrect(node)
})

test('AstElementNode.parse (with implicit tag name)', () => {
  const file = new AstFileNode('#foo.bar.foo[foo="bar baz qux"]')
  const node = AstElementNode.parse(file, file, 0)

  isCorrect(node)
})
