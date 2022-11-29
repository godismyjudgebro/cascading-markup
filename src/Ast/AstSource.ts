import type AstGenericNode from './AstGenericNode'

/** The position of a node in source code. */
interface SourcePosition {
  /** The position of the end of the node in source code. */
  end: {
    /** The column number of the end of the node in source code. */
    column: number
    /** The index of the end of the node in source code. */
    index: number
    /** The line number of the end of the node in source code. */
    line: number
  }
  /** The length of the node in source code. */
  length: number
  /** The position of the start of the node in source code. */
  start: {
    /** The column number of the start of the node in source code. */
    column: number
    /** The index of the start of the node in source code. */
    index: number
    /** The line number of the start of the node in source code. */
    line: number
  }
}

/** A representation of the source of a node. */
export default class AstSource {
  private _position: SourcePosition = {
    end: { column: NaN, index: NaN, line: NaN },
    length: NaN,
    start: { column: NaN, index: NaN, line: NaN }
  }

  /** The full source code of the file. */
  public readonly code: string
  /** The node that this source belongs to. */
  public node: AstGenericNode

  /** The portion of the source code that covers the node. */
  public get codeSection(): string {
    return this.getCodeSection(
      this.position.start.index,
      this.position.end.index
    )
  }

  /** The position of the node in the source code. */
  public get position(): SourcePosition {
    return this._position
  }

  /**
   * Creates a new instance of `AstSource`.
   *
   * @param node - The node that this source belongs to.
   * @param startIndex - The index of the first character of the node in the source code.
   * @param endIndex - The index after the last character of the node in the source code.
   * @param code - The full source code of the file. If not provided, the code will be taken from the node's parent.
   */
  public constructor(
    node: AstGenericNode,
    startIndex = NaN,
    endIndex = NaN,
    code?: string
  ) {
    this.code = code ?? node.parent?.source.code ?? ''
    this.node = node

    this.updatePosition(startIndex, endIndex)
  }

  /**
   * Get a portion of the source code.
   *
   * @param startIndex - The index of the first character of the node in the source code.
   * @param endIndex - The index after the last character of the node in the source code.
   * @returns The requested portion of the source code.
   */
  public getCodeSection(startIndex: number, endIndex: number): string {
    return this.code.slice(startIndex, endIndex)
  }

  /**
   * Calculate the index of a line number in the source code.
   *
   * @param line - The line number.
   * @returns The index of the line number in the source code.
   */
  public indexFromLineNumber(line: number): number {
    return (
      this.code.match(new RegExp(`(?:[\\s\\S]*?\\n){${line - 1}}`, 'gu'))?.[0]
        ?.length ?? this.code.length + 1
    )
  }

  /**
   * Updates the position of the node in the source code.
   *
   * @param startIndex - The index of the first character of the node in the source code.
   * @param endIndex - The index after the last character of the node in the source code.
   * @returns The updated position of the node in the source code.
   * @throws If `startIndex` is greater than `endIndex`.
   * @throws If `startIndex` is less than zero.
   * @throws If `endIndex` is greater than the code length.
   */
  public updatePosition(startIndex: number, endIndex: number): this {
    if (startIndex > endIndex) {
      throw new Error('endIndex must be greater or equal to than startIndex.')
    } else if (startIndex < 0) {
      throw new Error('startIndex must be greater than or equal to zero.')
    } else if (endIndex > this.code.length) {
      throw new Error('endIndex must be less than or equal to the code length.')
    }

    this._position = {
      end: {
        column:
          this.code.slice(startIndex, endIndex).split(/\r?\n/u).pop()!.length +
          1,
        index: endIndex,
        line: this.code.slice(0, endIndex).split(/\r?\n/u).length
      },
      length: endIndex - startIndex,
      start: {
        column:
          this.code.slice(0, startIndex).split(/\r?\n/u).pop()!.length + 1,
        index: startIndex,
        line: this.code.slice(0, startIndex).split(/\r?\n/u).length
      }
    }

    return this
  }
}
