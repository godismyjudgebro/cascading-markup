/**
 * Replace characters that are problematic in HTML.
 *
 * @param text - The text to encode.
 * @returns The encoded text.
 */
export default function encode(text: string): string {
  return text.replace(/[<>&"]/gu, match => {
    switch (match) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      default:
        return match
    }
  })
}
