---
title: Hello
trademark: Trademark
---

import styles from './style.module.sass';

# Hello

<button className={styles.button}>SASS, CSS modules, JSX inside Markdown</button>

I am going to the movies today.

{/* Check out https://nextra.site/docs/guide/syntax-highlighting */}

```javascript filename="index.js" {1,4-5}
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```
