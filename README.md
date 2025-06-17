# @jipis/eslint-plugin-import-sort

A highly-opinionated ESLint plugin to enforce a strict custom sorting order of `import` statements across four clearly defined sections.

## 🔧 Rule: `custom-import-sort`

### 🧩 Import Sections

Imports are grouped into **four sections**, separated by blank lines:

1. **External packages** – from `node_modules`.
2. **Internal imports** – from any directory under `src/`, excluding `types`.
3. **Types-only internal imports** – only from the `src/types` directory.
4. **Stylesheets** – files ending in `.css`, `.scss`, or `.sass`.

### 📚 Within each section

Each section is sorted in the following order:

1. Named imports (e.g., `import { foo } from 'bar';`)
2. Namespace imports (e.g., `import * as Foo from 'bar';`)
3. Default imports (e.g., `import Foo from 'bar';`)

#### Within each category:
- Imports are sorted alphabetically by the first specifier name.
- Specifiers inside named imports are also alphabetized (A-Z, with capital letters sorted before lowercase).

### 🎨 Stylesheet Section
Sorted by the import path alphabetically.

### Example
```ts
import lodash from 'lodash';
import { useState } from 'react';

import { doThing } from 'utils/helper';
import abc from 'components/Button';

import { FooType } from 'types/Foo';

import './index.css';
```

## ✅ Usage

1. Install the plugin:
```bash
npm install --save-dev @jipis/eslint-plugin-import-sort
```

2. Add it to your ESLint flat config (`eslint.config.js`):
```js
import customImportSort from '@jipis/eslint-plugin-import-sort';

export default [
  {
    plugins: {
      importSort: customImportSort,
    },
    rules: {
      'importSort/custom-import-sort': 'error',
    },
  },
];
```

3. Ensure your internal imports are resolvable via `webpack.config.js` or `tsconfig.paths` (e.g., no need for relative `./` imports).

---

MIT © [jipis](https://github.com/jipis)
