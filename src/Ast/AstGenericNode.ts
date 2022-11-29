import type AstAttribute from './AstAttribute'
import AstSource from './AstSource'

/**
 * The base class for all nodes.
 */
export default abstract class AstGenericNode {
  /** The attributes of the node. */
  public attributes: AstAttribute[] = []
  /** The children of the node. */
  public children: AstGenericNode[] = []
  /** The tag name -- or the value of the node if it is a text or comment. */
  public name: string
  /** The parent of this node. */
  public parent: AstGenericNode | null
  /** The file node of this node. */
  public root: AstGenericNode | null
  /** The scope of this node. */
  public scope: AstGenericNode
  /** The source code and position (including line/column) of the node. */
  public readonly source: AstSource

  /** The type of the node. */
  public abstract type: 'Comment' | 'Element' | 'File' | 'Text'

  /** The HTML representation of this node's content/children. */
  public abstract get innerHtml(): string
  /** The HTML representation of this entire node together with its children. */
  public abstract get outerHtml(): string

  /**
   * Creates a new node.
   *
   * @param nodeName - The tag name -- or the value if it is a text or comment.
   * @param parentNode - The parent of this node.
   * @param scope - The scope of this node.
   * @param source - The source of this node.
   */
  public constructor(
    nodeName: string,
    parentNode: AstGenericNode | null,
    scope: AstGenericNode | 'this',
    source?: AstSource
  ) {
    this.name = nodeName
    this.parent = parentNode
    this.root = parentNode
    this.scope = typeof scope === 'string' ? this : scope
    this.source = source ?? new AstSource(this, NaN, NaN)
  }

  // eslint-disable-next-line jsdoc/require-returns-check, jsdoc/require-throws
  /**
   * Parse a portion of the source code and return a node.
   *
   * @param parentNode - The parent of the node.
   * @param scope - The scope of the node.
   * @param startIndex - The index of the first character of the node.
   * @returns The node, or `null` if no node was found at the given index.
   */
  public static parse(
    parentNode: AstGenericNode,
    scope: AstGenericNode,
    startIndex: number
  ): AstGenericNode | null {
    // Subclasses must override this method with its own implementation.
    throw new Error('Not implemented')
  }

  /**
   * Add the given nodes as children of this node.
   *
   * @param nodes - The nodes to add.
   * @returns This node.
   */
  public addChild(...nodes: AstGenericNode[]): this {
    for (const node of nodes) {
      node.parent = this
      node.root = this.root
      this.children.push(node)
    }

    return this
  }
}
