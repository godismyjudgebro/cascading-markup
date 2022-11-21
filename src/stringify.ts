import type { AstElementNode, AstNode } from './parse'
import validateHtmlNode from './validateHtml'

/**
 * Encode a string to be used in HTML.
 *
 * @param str - The string to encode.
 * @returns The encoded string.
 */
function encodeString(str: string): string {
  return str
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
}

/**
 * Stringify an array of AST nodes.
 *
 * @param nodes - The array of AST nodes to stringify.
 * @returns The stringified AST nodes.
 */
function stringifyArray(nodes: AstNode[]): string {
  return nodes.map(stringify).join('')
}

const selfClosingTags = ['meta', 'link', 'img', 'br', 'hr', 'input']

/**
 * Stringify an AST node.
 *
 * @param node - The AST node to stringify.
 * @returns The stringified node.
 */
function stringifyNode(node: AstNode): string {
  if (node.name === 'root') {
    return stringifyArray(node.children)
  }

  if (node.type === 'text') {
    return encodeString(node.value)
  }

  let result = `<${node.name} `

  node.attributes.forEach(attribute => {
    result += `${attribute.name}="${encodeString(attribute.value)}" `
  })

  if (node.children.length === 0 && selfClosingTags.includes(node.name)) {
    return `${result.trim()} />`
  }

  return `${result.trimEnd()}>${stringifyArray(node.children)}</${node.name}>`
}

/**
 * Stringify the AST root node.
 *
 * @param root - The AST root node to stringify.
 * @returns The stringified AST node.
 */
function stringifyRoot(root: AstElementNode): string {
  let content =
    '<!--\n' +
    '  Made with Cascading Markup Language (CML).\n' +
    '  https://github.com/godismyjudgebro/cascading-markup\n' +
    '-->\n<!DOCTYPE html>'

  const html: AstElementNode = validateHtmlNode(root)

  content += stringifyNode(html)

  return content
}

/**
 * Stringify an abstract syntax tree.
 *
 * @param value - The AST node/s to stringify.
 * @returns The stringified AST node/s.
 */
export default function stringify(value: AstNode | AstNode[]): string {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  } else if (value.type === 'text') {
    return encodeString(value.value)
  } else if (value.name === 'root' && typeof value.parent === 'undefined') {
    return stringifyRoot(value)
  }

  return stringifyNode(value)
}
