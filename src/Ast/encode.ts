/**
 * Replace characters that are problematic in HTML.
 *
 * @param text - The text to encode.
 * @returns The encoded text.
 */
export default function encode(text: string): string {
  return text
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
}
