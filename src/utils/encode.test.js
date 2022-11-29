const encode = require('./encode').default

test('encode()', () => {
  expect(encode('<foo> & "bar"')).toBe('&lt;foo&gt; &amp; &quot;bar&quot;')
})
