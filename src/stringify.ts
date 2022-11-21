import {
  AstElementNode,
  AstNode,
  AttributePair,
  calculateLocation
} from './parse'

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
 * Whether various nodes that provide metadata are present in an array of nodes.
 *
 * @param nodes - The array of nodes to check.
 * @returns An object containing whether the nodes are present.
 */
function hasMetaInfo(nodes: AstNode[]): {
  metaCharset: boolean
  metaViewport: boolean
  metaXuaCompatible: boolean
  title: boolean
} {
  let metaCharset = false
  let metaViewport = false
  let metaXuaCompatible = false
  let title = false

  for (const node of nodes) {
    if (node.name === 'title') {
      title = true
    } else if (node.name === 'meta') {
      for (const { name: key, value } of node.attributes) {
        if (key === 'charset') metaCharset = true
        else if (key === 'http-equiv' && value === 'http-equiv=X-UA-Compatible')
          metaXuaCompatible = true
        else if (key === 'name' && value === 'viewport') metaViewport = true
      }
    }
  }

  return {
    metaCharset,
    metaViewport,
    metaXuaCompatible,
    title
  }
}

function addMetaTag(head: AstElementNode, attributes: AttributePair[]) {
  head.children.unshift({
    attributes,
    children: [],
    location: head.location,
    name: 'meta',
    parent: head,
    type: 'element'
  })
}

/**
 * Ensure the existence of various meta data.
 *
 * @param head - The head node to contain the meta tags.
 */
function validateMeta(head: AstElementNode): void {
  const hasMeta = hasMetaInfo(head.children)

  if (!hasMeta.metaCharset) {
    addMetaTag(head, [{ name: 'charset', value: 'UTF-8' }])
  }

  if (!hasMeta.metaXuaCompatible) {
    addMetaTag(head, [
      { name: 'http-equiv', value: 'X-UA-Compatible' },
      { name: 'content', value: 'IE=edge' }
    ])
  }

  if (!hasMeta.metaViewport) {
    addMetaTag(head, [
      { name: 'name', value: 'viewport' },
      { name: 'content', value: 'width=device-width, initial-scale=1' }
    ])
  }

  if (!hasMeta.title) {
    const titleTag = {
      attributes: [],
      children: [] as AstNode[],
      location: head.location,
      name: 'title',
      parent: head,
      type: 'element' as const
    }

    titleTag.children.push({
      location: head.location,
      name: 'text',
      parent: titleTag,
      type: 'text',
      value: 'Untitled'
    })
  }
}

function validateHeadNode(html: AstElementNode): AstElementNode {
  const foundHead = html.children.find(child => child.name === 'head') as
    | AstElementNode
    | undefined

  const head: AstElementNode = foundHead ?? {
    attributes: [],
    children: [],
    location: html.location,
    name: 'head',
    type: 'element'
  }

  validateMeta(head)

  return head
}

function validateBodyNode(
  root: AstElementNode,
  html: AstElementNode
): AstElementNode {
  const foundBody = html.children.find(child => child.name === 'body') as
    | AstElementNode
    | undefined

  const body: AstElementNode = foundBody ?? {
    attributes: [],
    children: [],
    location: html.location,
    name: 'body',
    type: 'element'
  }

  for (const child of root.children) {
    switch (child.name) {
      case 'html':
      case 'head':
      case 'body':
        break
      default:
        body.children.push(child)
    }
  }

  return body
}

/**
 * Ensure the existence of a "well-made" HTML node, and return it.
 *
 * - If there is no `html` node, create one.
 * - If `head` already exists:
 *   - If a `charset` is not set, set it to UTF-8.
 *   - If a `x-ua-compatible` meta tag is not set, set it to `IE=edge`.
 *   - If a `viewport` is not set, set it.
 *   - If a `title` is not set, set it to `Untitled Document`.
 * - If there is no `head` node, create one.
 * - If there is no `body` node, create one.
 * - If a direct child of `root` is not a `head` or `body`, move it to `body`.
 *
 * @param root - The AST root node (with or without an HTML node).
 * @returns The HTML node.
 */
function validateHtmlNode(root: AstElementNode): AstElementNode {
  const foundHtmlNode = root.children.find(child => child.name === 'html') as
    | AstElementNode
    | undefined

  const html: AstElementNode = foundHtmlNode ?? {
    attributes: [],
    children: [] as AstNode[],
    location: root.location,
    name: 'html',
    type: 'element'
  }

  if (!foundHtmlNode) {
    for (const child of root.children) {
      if (['head', 'body'].includes(child.name)) {
        html.children.push(child)
      }
    }
  }

  validateHeadNode(root)
  validateBodyNode(root, html)

  return html
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
