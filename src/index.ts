import parse from './parse'
import stringify from './stringify'

const syntaxTree = parse(`
head title 'Hello World'

body {
  h1 'Hello World!'
  p 'This is a paragraph'
}
`)

console.log(stringify(syntaxTree))

export default {
  parse,
  stringify
}
