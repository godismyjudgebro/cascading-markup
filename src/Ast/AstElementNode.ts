import type AstAttribute from './AstAttribute'
import AstGenericNode from './AstGenericNode'
import encode from './encode'

const voidElements = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'keygen',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

/**
 * Extracts the attributes from an attribute specifier.
 *
 * @param id - The element ID attribute.
 * @param classNames - The element class attribute.
 * @param attributeSelector - The attribute specifier.
 * @returns The attributes.
 */
function parseAttributes(
  id: string | undefined,
  classNames: string | undefined,
  attributeSelector: string | undefined
): AstAttribute[] {
  const attributes: AstAttribute[] = []

  if (typeof id === 'string') attributes.push({ key: 'id', value: id })

  if (typeof classNames === 'string') {
    attributes.push({
      key: 'class',
      value: classNames.split('.').sort().join(' ').trim()
    })
  }

  if (typeof attributeSelector === 'string') {
    const matches = attributeSelector
      .slice(1, -1)
      .matchAll(
        /(?<key>[^=\s]+)(?:\s*=\s*(?:(?<quotationMark>"|')(?<quotedValue>.*?)(?<![^\\]\\(?:\\\\)*)\2|(?<unquotedValue>\S+)))?/gu
      )
    for (const match of matches) {
      attributes.push({
        key: match.groups?.['key'] ?? '',
        value:
          match.groups?.['quotedValue'] ?? match.groups?.['unquotedValue'] ?? ''
      })
    }
  }

  return attributes.sort((a, b) => a.key.localeCompare(b.key))
}

/** An element node, such as a `div` or `span`.  */
export default class AstElementNode extends AstGenericNode {
  /** The tag name. */
  public declare name
  public type = 'Element' as const

  /** The HTML representation of this node's children. */
  public get innerHtml(): string {
    return this.children.map(child => child.outerHtml).join('')
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public get outerHtml(): string {
    const attributes = this.attributes
      .map(({ key, value }) => {
        // If the value is empty or a case-insensitive match to the key, then
        // consider it a boolean attribute. In this case, we will represent the
        // attribute in its short-hand form (`key`) instead of `key="value"`.
        if (value === '' || value.toLowerCase() === key.toLowerCase()) {
          return key
        }

        const encodedValue = encode(value)

        // Are the quotation marks necessary?
        if (encodedValue.match(/[<>'"\s]/u)) {
          // Yes, so use double quotation marks.
          return `${key}="${encodedValue}"`
        }

        // The quotation marks are not necessary here.
        return `${key}=${encodedValue}`
      })
      .join(' ')

    const startTag = `<${`${this.name} ${attributes}`.trim()}>`

    // Is this a void element?
    if (this.children.length === 0 && voidElements.includes(this.name)) {
      // Void elements do not have an end tag.
      return startTag
    }

    // Non-void elements have an end tag.
    return `${startTag}${this.innerHtml}</${this.name}>`
  }

  /**
   * Create a new element node.
   *
   * @param tagName - The tag name.
   * @param parentNode - The parent of this node.
   * @param scope - The scope of this node.
   * @param attributes - The attributes of the node.
   */
  public constructor(
    tagName: string,
    parentNode: AstGenericNode | null,
    scope: AstGenericNode,
    attributes: AstAttribute[] = []
  ) {
    super(tagName, parentNode, scope)
    this.attributes = attributes
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public static override parse(
    parentNode: AstGenericNode,
    scope: AstGenericNode,
    startIndex: number
  ): AstElementNode | null {
    // Find the element node starting at the given index.
    const matchGroups = parentNode.source.code
      .slice(startIndex)
      .match(
        /^(?=[^\s{])(?<selector>(?<tagName>(?:(?![#.[\]{};])\S)+)?(?<id>#(?:(?![#.[\]{};])\S)+)?(?<classNames>(?:\.(?:(?![#.[\]{};])\S)+)+)?(?<attributeSelector>(?:\[(?:(?<string>(?<quotationMark>"|').*?(?<![^\\]\\(?:\\\\)*)\7)|.)*?\]))?)/u
      )?.groups

    // Was a match found?
    if (!matchGroups) {
      // No, so return null.
      return null
    }

    // Interpret the node from the match groups.
    const { selector, tagName, id, classNames, attributeSelector } = matchGroups
    const element = new AstElementNode(
      tagName ?? 'div',
      parentNode,
      scope,
      parseAttributes(id, classNames, attributeSelector)
    )

    // Accurately set the node's start and end indices in the source.
    element.source.updatePosition(
      startIndex,
      startIndex + (selector?.length ?? 1)
    )

    // Return the node.
    return element
  }

  /**
   * Add the given nodes as children of this node.
   *
   * @param nodes - The nodes to add.
   * @returns This node.
   */
  public override addChild(...nodes: AstGenericNode[]): this {
    for (const node of nodes) {
      node.parent = this

      this.children.push(node)
    }

    return this
  }
}
