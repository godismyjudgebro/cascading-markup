const AstFileNode = require('./AstFileNode').default

test('(new AstFileNode).parse', () => {
  const node = new AstFileNode(
    `
    html[lang=en] {
      head {
        meta[charset=utf-8];
        meta[http-equiv=X-UA-Compatible content="IE=edge"];
        meta[name=viewport content="width=device-width, initial-scale=1"];
        title "Hello World";
      }
      body {
        h1 "Hello World!";
        p "This is a test.";
      }
    }
    `,
    'hello-world.cml'
  ).parse()
  expect(node.name).toBe('hello-world.cml')
  expect(node.type).toBe('File')
  // prettier-ignore
  expect(node.innerHtml).toBe(
    '<html lang=en>' +
      '<head>' +
        '<meta charset=utf-8>' +
        '<meta content="IE=edge" http-equiv=X-UA-Compatible>' +
        '<meta content="width=device-width, initial-scale=1" name=viewport>' +
        '<title>Hello World</title>' +
      '</head>' +
      '<body>' +
        '<h1>Hello World!</h1>' +
        '<p>This is a test.</p>' +
      '</body>' +
    '</html>'
  )
  expect(node.outerHtml).toBe(
    `<!-- Made with the Cascading Markup Language (CML):\n` +
      `https://github.com/godismyjudgebro/cascading-markup -->\n` +
      `<!DOCTYPE html>${node.innerHtml}`
  )
})
