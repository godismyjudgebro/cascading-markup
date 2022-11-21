import type { AstElementNode, AstNode, AttributePair } from './parse'

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

/**
 * Add a meta tag to a head node.
 *
 * @param head - The head node to add the meta tag to.
 * @param attributes - The attributes to add to the meta tag.
 */
function addMetaTag(head: AstElementNode, attributes: AttributePair[]): void {
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

/**
 * Ensure the existence of a "well-made" head node, and add it to a html node.
 *
 * @param html - The html node to contain the head node.
 */
function validateHeadNode(html: AstElementNode): void {
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

  if (!foundHead) {
    html.children.unshift(head)
  }
}

/**
 * Ensure the existence of a "well-made" body node, and add it to a html node.
 *
 * @param root - The root AST node.
 * @param html - The html node to contain the body node.
 */
function validateBodyNode(root: AstElementNode, html: AstElementNode): void {
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

  if (!foundBody) {
    html.children.push(body)
  }
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
export default function validateHtmlNode(root: AstElementNode): AstElementNode {
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

  validateBodyNode(root, html)
  validateHeadNode(root)

  return html
}
