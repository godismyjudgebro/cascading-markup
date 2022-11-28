import AstElementNode from './AstElementNode'
import AstGenericNode from './AstGenericNode'
import AstSource from './AstSource'
import AstTextNode from './AstTextNode'

/** The root node of the AST. */
export default class AstFileNode extends AstGenericNode {
  public override readonly attributes = []
  /** Files are always the root node, so its parent is always `null`. */
  public override readonly parent = null
  /** File contents. */
  public override readonly source: AstSource
  public type = 'File' as const

  /** The HTML representation of the nodes in this file. */
  public get innerHtml(): string {
    return this.children.map(child => child.outerHtml).join('')
  }

  /** The HTML representation of this file. */
  public get outerHtml(): string {
    return (
      `<!-- Made with the Cascading Markup Language (CML):\n` +
      `https://github.com/godismyjudgebro/cascading-markup -->\n` +
      `<!DOCTYPE html>${this.innerHtml}`
    )
  }

  /**
   * Create a new file node.
   *
   * @param code - The file's contents.
   * @param fileName - The file's name.
   */
  public constructor(code: string, fileName = 'untitled') {
    super(fileName, null, 'this')

    this.source = new AstSource(this, 0, code.length, code)
  }

  /**
   * Parse a portion of the source code and return a node.
   *
   * @returns This file node.
   */
  // eslint-disable-next-line max-statements
  public parse(): this {
    this.children = []

    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    let currentNode: AstGenericNode = this
    let scope = currentNode.scope
    for (let i = 0; i < this.source.code.length; ) {
      i += this.source.code.slice(i).search(/\S|$/u)

      if (this.source.code[i] === ';') {
        scope = currentNode.scope
        currentNode = scope
        i++
        continue
      } else if (this.source.code[i] === '{') {
        scope = currentNode
        i++
        continue
      } else if (this.source.code[i] === '}') {
        // Todo(gimjb): Properly handle error.

        // This will error if the scope is the file scope.
        scope = currentNode.parent!.scope
        i++
        continue
      }

      const newNode =
        AstTextNode.parse(currentNode, scope, i) ??
        AstElementNode.parse(currentNode, scope, i)

      if (newNode !== null) {
        currentNode.addChild(newNode)
        i += newNode.source.position.length
        currentNode = newNode
        continue
      }

      // Unknown element.
      break
      // Todo(gimjb): Err, unexpected character.
    }

    return this
  }
}
