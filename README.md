<a href="https://npmjs.com/package/@vituum/vite-plugin-pug"><img src="https://img.shields.io/npm/v/@vituum/vite-plugin-pug.svg" alt="npm package"></a>
<a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/@vituum/vite-plugin-pug.svg" alt="node compatility"></a>

# ⚡️🐕 VitePug

```js
import pug from '@vituum/vite-plugin-pug'

export default {
  plugins: [
    pug({
      reload: true,
      root: null,
      filters: {},
      data: '*.json',
      globals: {
          template: 'path/to/template.pug'
      },
      filetypes: {
          html: /.(json.html|pug.json.html|pug.html)$/,
          json: /.(json.pug.html)$/
      },
      pug: {}
    })
  ]
}
```

Read the [docs](https://vituum.dev/config/integrations-options.html#vituum-pug) to learn more about the plugin options.

## Basic usage

```html
<!-- index.html -->
<script type="application/json" data-format="pug">
  {
    "template": "path/to/template.pug",
    "title": "Hello world"
  }
</script>
```
or
```html
<!-- index.pug.html -->
include /path/to/template.pug
```
or
```html
<!-- index.json.html or index.pug.json.html  -->
{
  "template": "path/to/template.pug",
  "title": "Hello world"
}
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [Vite](https://vitejs.dev/) or [Vituum](https://vituum.dev/)
