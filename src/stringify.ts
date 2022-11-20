import type { AstNode } from './parse'

const selfClosingTags = ['meta', 'link', 'img', 'br', 'hr', 'input']

/**
 * Stringify an AST node.
 *
 * @param node - The AST node to stringify.
 * @returns The stringified node.
 */
export default function stringify(node: AstNode): string {
  if (node.type === 'text') {
    return node.value
  }

  let result = `<${node.name} `

  node.attributes.forEach(attribute => {
    result += `${attribute.name}="${attribute.value.replaceAll('"', '\\"')}" `
  })

  const content = node.children.map(child => stringify(child)).join('')

  if (content === '' && selfClosingTags.includes(node.name)) {
    return `${result} />`
  }

  return `${result.trimEnd()}>${content}</${node.name}>`
}
