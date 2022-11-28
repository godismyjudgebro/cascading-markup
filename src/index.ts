import AstFileNode from './Ast/AstFileNode'

const file = new AstFileNode(
  `
  html[lang=en] {
    head title 'Hello World';
    body {
      h1 'Hello World!';
      p 'This is a paragraph';
    }
  }
  `,
  'hello-world.cml'
).parse()

console.log(file.outerHtml)
