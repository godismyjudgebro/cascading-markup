import AstFileNode from './Ast/AstFileNode'

/**
 * Parse code and return an abstract syntax tree.
 *
 * @param code - The code to parse.
 * @param path - The path of the file. It is used for error messages.
 * @returns The abstract syntax tree.
 */
export default function parse(code: string, path = 'untitled'): AstFileNode {
  return new AstFileNode(code, path).parse()
}
