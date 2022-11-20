interface AttributePair {
  name: string
  value: string
}

interface SourceLocation {
  readonly end: {
    readonly column: number
    readonly index: number
    readonly line: number
  }
  readonly length: number
  readonly start: {
    readonly column: number
    readonly index: number
    readonly line: number
  }
}

export type AstNode = AstElementNode | AstTextNode

interface AstTextNode {
  location: SourceLocation
  readonly name: 'text'
  parent: AstElementNode
  type: 'text'
  value: string
}

interface AstElementNode {
  attributes: AttributePair[]
  children: AstNode[]
  location: SourceLocation
  readonly name: string
  parent?: AstElementNode
  type: 'element'
}

/**
 * Matches the opening and closing brackets of a block, and returns its content.
 *
 * @param code - The code to parse the element from.
 * @param sliceIndex - The index to start parsing from.
 * @returns The index of the closing bracket.
 * @throws If the block is not closed.
 */
function matchBlock(code: string, sliceIndex: number): number {
  const brackets = code
    .slice(sliceIndex)
    .matchAll(/(?<blockOpen>\{)|(?<blockClose>\})/gu)
  let openBlocks = 0
  let index = sliceIndex

  for (const bracket of brackets) {
    if (typeof bracket.groups?.['blockOpen'] !== 'undefined') openBlocks++
    else if (typeof bracket.groups?.['blockClose'] !== 'undefined') openBlocks--

    index += bracket.index ?? 0

    if (openBlocks === 0) {
      return index
    }
  }

  throw new Error('Missing closing bracket')
}

/**
 * Calculate the beginning and end column/line of a substring.
 *
 * @internal
 * @param code - The code to calculate the location in.
 * @param start - The index of the start of the substring.
 * @param snippetLength - The length of the substring.
 * @returns The location of the substring.
 */
function calculateLocation(
  code: string,
  start: number,
  snippetLength: number
): SourceLocation {
  return {
    end: {
      column:
        (code
          .slice(0, start + snippetLength)
          .split(/[\r\n]/gu)
          .pop()?.length ?? 0) + 1,
      index: start + snippetLength,
      line: code.slice(0, start + snippetLength).split(/[\r\n]/gu).length
    },
    length: snippetLength,
    start: {
      column:
        (code
          .slice(0, start)
          .split(/[\r\n]/gu)
          .pop()?.length ?? 0) + 1,
      index: start,
      line: code.slice(0, start).split(/[\r\n]/gu).length
    }
  }
}

/**
 * Parse a text element and add it to the parent element.
 *
 * @internal
 * @param code - The code to parse the text from.
 * @param sliceIndex - The index to start parsing from.
 * @param parentElement - The parent element to add the resulting elements to.
 * @returns The last resulting text node.
 * @throws (todo: document or remove error).
 */
// eslint-disable-next-line max-statements
function parseText(
  code: string,
  sliceIndex: number,
  parentElement: AstElementNode
): AstTextNode {
  const remainingCode = code.slice(sliceIndex)

  const { content, string } =
    remainingCode.match(
      /^(?<string>(?<quotationMark>"|')(?<content>.*?)(?<![^\\]\\(?:\\\\)*)\2)/u
    )?.groups ?? {}

  if (typeof string === 'undefined' || typeof content === 'undefined') {
    throw new Error('`content` is undefined')
  }

  let partIndex = sliceIndex + 1
  let arrayLength = 0
  for (const part of content.split(/(?<newline>\\n)/gu)) {
    switch (part) {
      case '\\n':
        arrayLength = parentElement.children.push({
          attributes: [],
          children: [],
          location: calculateLocation(code, partIndex, part.length),
          name: 'br',
          parent: parentElement,
          type: 'element'
        })
        break
      case '': // Ignore empty strings
        break
      default:
        arrayLength = parentElement.children.push({
          location: calculateLocation(code, partIndex, string.length),
          name: 'text',
          parent: parentElement,
          type: 'text',
          value: part.replace(/\\(?<escapedCharacter>.)/gu, '$1')
        })
    }

    partIndex += part.length
  }

  return parentElement.children[arrayLength - 1] as AstTextNode
}

/**
 * Return key/value pairs of attributes.
 *
 * @internal
 * @param attributeSelector - The content of the attribute selector (content in
 * between the square brackets).
 * @param classNames - The class names, if any, to add to the attributes.
 * @param id - The id, if any, to add to the attributes.
 * @returns An array of the key/value pairs of attributes.
 * @example
 * parseAttributes('foo="bar" baz="qux"')
 * // => [{ name: 'foo', value: 'bar' }, { name: 'baz', value: 'qux' }]
 */
function parseAttributes(
  attributeSelector: string,
  classNames: string | undefined,
  id: string | undefined
): AttributePair[] {
  const matches = attributeSelector.matchAll(
    /\s*(?<attributeName>(?:(?!=)\S)+)(?:\s*=\s*(?<attributeValue>(?:(?<quotationMark>"|')(?<stringContent>.*?)(?<![^\\]\\(?:\\\\)*)\3)|\S+))?/gu
  )
  const attributes: AttributePair[] = []
  for (const match of matches) {
    const { attributeName, attributeValue, stringContent } = match.groups ?? {}

    attributes.push({
      // Non-null assertion operator is safe because `attributeName` should be
      // defined. If it is not, then the regex is wrong -- which is a bug.
      name: attributeName!,
      value: stringContent ?? attributeValue ?? ''
    })
  }

  if (typeof classNames === 'string') {
    attributes.push({
      name: 'class',
      value: classNames.split('.').slice(1).sort().join(' ')
    })
  }

  if (typeof id === 'string') {
    attributes.push({ name: 'id', value: id.slice(1) })
  }

  return attributes.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Parse a selector and add it to the parent element.
 *
 * @internal
 * @param code - The code to parse the selector from.
 * @param sliceIndex - The index to start parsing from.
 * @param parentElement - The parent element to add the resulting element to.
 * @returns The resulting element.
 * @throws If the selector is invalid. This would be a bug, either in the regex
 * or the function called incorrectly (such as with an inaccurate `sliceIndex`).
 * @see https://html.spec.whatwg.org/#valid-custom-element-name
 */
function parseSelector(
  code: string,
  sliceIndex: number,
  parentElement: AstElementNode
): AstNode {
  const matchGroups = code
    .slice(sliceIndex)
    .match(
      /^(?<selector>(?<tagName>(?:(?![#.[{])\S)*)(?<id>#(?:(?![#.[{])\S)+)?(?<classNames>(?:\.(?:(?![#.[{])\S)+)*)?(?<attributeSelector>(?:\[(?:(?<string>(?<quotationMark>"|').*?(?<![^\\]\\(?:\\\\)*)\7)|.)*?\]))?)/u
    )?.groups

  if (typeof matchGroups === 'undefined') {
    throw new Error(
      'Unexpected error: `matchGroups` is undefined. Please open an issue on GitHub.'
    )
  }

  const { selector, tagName, id, classNames, attributeSelector } = matchGroups

  const element: AstNode = {
    attributes: parseAttributes(
      attributeSelector?.slice(1, -1) ?? '',
      classNames,
      id
    ),
    children: [],
    location: calculateLocation(code, sliceIndex, selector?.length ?? 1),
    name: tagName ?? 'div',
    parent: parentElement,
    type: 'element'
  }

  parentElement.children.push(element)

  return element
}

/**
 * Parse a selector and add it to the parent element, including any children.
 *
 * @internal
 * @param code - The code to parse the selector from.
 * @param sliceIndex - The index to start parsing from.
 * @param parentElement - The parent element to add the resulting element to.
 * @returns The last resulting element.
 */
// eslint-disable-next-line max-statements
function parseElement(
  code: string,
  sliceIndex: number,
  parentElement: AstElementNode
): AstNode {
  const element = parseSelector(code, sliceIndex, parentElement)

  // @ts-expect-error because we are making sure that `element` is an element
  if (typeof element.children !== 'undefined') {
    const nextCharIndex =
      element.location.end.index +
      (code.slice(element.location.end.index).match(/(?:(?!\n)\s)*/u)?.[0]
        ?.length ?? 1)
    const nextChar = code.charAt(nextCharIndex)

    if (nextChar.match(/[[a-z#.]/u)) {
      return parseElement(code, nextCharIndex, element as AstElementNode)
    } else if (nextChar.match(/["']/u)) {
      return parseText(code, nextCharIndex, element as AstElementNode)
    } else if (nextChar === '{') {
      const start = element.location.start.index
      const end = matchBlock(code, nextCharIndex) + 1
      element.location = calculateLocation(code, start, end - start)

      return parse(
        code.slice(0, end - 1),
        nextCharIndex + 1,
        element as AstElementNode
      )
    }

    // Else, the element is complete (no children -- the next character may be,
    // for example, a newline or a semi-colon).
  }

  return element
}

/**
 * Parse a string of CML code into an AST.
 *
 * @param code - The code to parse.
 * @param sliceIndex - The index to start parsing from.
 * @param parentElement - The parent element to add the resulting element to.
 * @returns The AST.
 * @throws If the code is invalid.
 */
export default function parse(
  code: string,
  sliceIndex = 0,
  parentElement: AstElementNode = {
    attributes: [],
    children: [],
    location: calculateLocation(
      code,
      code.match(/^\s*/u)?.[0]?.length ?? 0,
      code.trim().length
    ),
    name: 'root',
    type: 'element'
  }
): AstElementNode {
  for (
    let i =
      (code.slice(sliceIndex).match(/^\s*/u)?.[0]?.length ?? 0) + sliceIndex;
    i < code.trimEnd().length;

  ) {
    // Non-null assertion operator is safe because `i` is less than `code.length`.
    const char = code[i]!

    // Is it a string?
    if (['"', "'"].includes(char)) {
      i = parseText(code, i, parentElement).location.end.index
    }
    // Is it an element?
    else if (char.match(/[a-z]/iu)) {
      i = parseElement(code, i, parentElement).location.end.index
    } else if (char.match(/[\s;}]/u)) {
      i++
      continue
    } else {
      const { line, column } = calculateLocation(code, i, i + 1).start
      throw new Error(`Unexpected character '${char}' at ${line}:${column}`)
    }
  }

  return parentElement
}
