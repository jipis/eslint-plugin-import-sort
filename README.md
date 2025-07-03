# @jipis/eslint-plugin-import-sort

A highly-opinionated ESLint plugin to enforce a strict custom sorting order of `import` statements across four clearly defined sections.

## 🔧 Rule: `custom-import-sort`

## ✨ Features

- Groups imports into four distinct blocks:

  1. **External packages** ( from `node_modules`, e.g. `'react'`, `'lodash'`)
  2. **Internal modules** (from subdirectories of your project’s `src` directory, excluding `src/types`)
  3. **Internal types** (imports starting with `types/`)
  4. **Stylesheets** (`.css`, `.scss`, `.sass`)

- Enforces blank lines between groups
- Within each group:

  1. Named imports (e.g., `import { foo } from 'bar';`)
  2. Namespace imports (e.g., `import * as Foo from 'bar';`)
  3. Default imports (e.g., `import Foo from 'bar';`)

- Fixes incorrect import order automatically with `--fix`
- Supports both semicolon and no-semicolon code styles (though fix code will always be with semicolons -- TODO)

---

## 📦 Installation

```bash
npm install --save-dev @jipis/eslint-plugin-import-sort
```

---

## 🛠 Usage (ESLint Flat Config)

In your `eslint.config.js`:

```js
import importSort from '@jipis/eslint-plugin-import-sort';

export default [
  {
    files: ['**/*.js', '**/*.ts'],
    plugins: {
      importSort,
    },
    rules: {
      'importSort/custom-import-sort': ['error', { srcDir: 'src' }],
    },
  },
];
```

> 🔧 Replace `"src"` with the root path of your source tree if different. The plugin scans that directory for subdirectories to treat as internal paths. If `src` is the root of the source tree, the option can be omitted.

---

## ✅ Example

```ts
// Correct
import fs from 'fs';
import path from 'path';

import { Button } from 'components';
import utils from 'utils/helpers';

import { MyType } from 'types/models';

import './index.css';
```

```ts
// Incorrect
import { MyType } from 'types/models';
import './index.css';
import utils from 'utils/helpers';
import path from 'path';
import fs from 'fs';
import { Button } from 'components';
```

---

## 🧪 Behavior Summary

- All imports from external packages go first
- Internal code imports (excluding `types/`) go next
- Then internal `types/` imports
- Then stylesheets
- Within each section:
  - Specifier groups (named → namespace → default)
  - Strict character sort (e.g. `A < B < Z < a < b`)
- Blank line between each section
- Fix output always includes semicolons

---

## 📁 Project Structure Assumptions

Your internal imports are assumed to be anything that:

- Starts with a folder name under `src/` (or your configured `srcDir`)
- Starts with `'./'` or `'../'`

Types are grouped separately if they start with `types/`.

---

## 📝 TODO

- Add an option to enable or disable semicolons in the fixed code output
- Handle mixed imports (e.g., named and default) from a single module more robustly
- Ensure renamed imports (e.g., `import { foo as bar }`) are sorted and grouped correctly

---

## 💡 Suggestions or Issues?

Open a GitHub issue or pull request at [jipis/eslint-plugin-import-sort](https://github.com/jipis/eslint-plugin-import-sort).

---

## 📝 License

MIT
