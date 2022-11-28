/* eslint-disable no-unreachable */
import AstGenericNode from './AstGenericNode'
import encode from './encode'

/** A text node, such as the *text content* of a hyperlink.  */
export default class AstTextNode extends AstGenericNode {
  /** Text nodes never have any attributes. */
  public override attributes = []
  /** Text nodes never have any children. */
  public override children = []
  /** The text. */
  public declare name

  public type = 'Text' as const

  /**
   * The HTML representation of this node's content.
   *
   * @alias outerHtml
   */
  public get innerHtml(): string {
    let text = ''

    this.name.split(/(?<characterEscape>\\(?:\\\\)*n)/u).forEach(part => {
      if (part === '\\n') {
        text += '<br>'
      } else if (part.startsWith('\\')) {
        text += encode(part.slice(1))
      } else {
        text += encode(part)
      }
    })

    return text
  }

  /**
   * The HTML representation of this node's content.
   *
   * @alias innerHtml
   */
  public get outerHtml(): string {
    return this.innerHtml
  }

  /**
   * Create a new text node.
   *
   * @param textContent - The text content.
   * @param parentNode - The parent of this node.
   * @param scope - The scope of this node.
   */
  public constructor(
    textContent: string,
    parentNode: AstGenericNode | null,
    scope: AstGenericNode
  ) {
    super(textContent, parentNode, scope)
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public static override parse(
    parentNode: AstGenericNode,
    scope: AstGenericNode,
    startIndex: number
  ): AstTextNode | null {
    // Find the text node starting at the given index.
    const { wholeMatch, stringContent } =
      parentNode.source.code
        .slice(startIndex)
        .match(
          /^(?<wholeMatch>(?<quotationMark>"|')(?<stringContent>.*?)(?<![^\\]\\(?:\\\\)*)\2)/u
        )?.groups ?? {}

    // Was a match found?
    if (
      typeof wholeMatch === 'undefined' ||
      typeof stringContent === 'undefined'
    ) {
      return null
    }

    // Interpret the node from the match groups.
    const text = new AstTextNode(stringContent, parentNode, scope)

    // Accurately set the node's start and end indices in the source.
    text.source.updatePosition(startIndex, startIndex + wholeMatch.length)

    return text
  }

  /**
   * Text nodes cannot have any children. This method will always throw.
   *
   * @throws This method always throws an error.
   */
  // eslint-disable-next-line class-methods-use-this
  public override addChild(): this {
    throw new Error('Text nodes cannot have children.')
  }
}
