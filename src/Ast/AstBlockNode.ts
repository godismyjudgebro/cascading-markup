import AstGenericNode from './AstGenericNode'

/** A block node is a scope/container for other nodes. */
export default class AstBlockNode extends AstGenericNode {
  public override readonly attributes = []
  /** For a block, this is always `'Block'`. */
  public override readonly name = 'Block'
  public override readonly scope = this
  public readonly type = 'Block'

  /**
   * The HTML representation of the children of this node.
   *
   * @alias outerHtml
   */
  public override get innerHtml(): string {
    return this.children.map(child => child.outerHtml).join('')
  }

  /**
   * The HTML representation of the children of this node.
   *
   * @alias innerHtml
   */
  public override get outerHtml(): string {
    return this.innerHtml
  }

  /**
   * Create a new block node.
   *
   * @param parentNode - The parent of this node.
   */
  public constructor(parentNode: AstGenericNode | null) {
    super('block', parentNode, 'this')
  }
}
