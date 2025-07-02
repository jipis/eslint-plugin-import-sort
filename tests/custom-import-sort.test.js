// File: tests/custom-import-sort.test.js
const rule = require('../rules/custom-import-sort');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester();

const options = [{ srcDir: 'welkjsdoidj' }];

ruleTester.run('custom-import-sort', rule, {
  valid: [
    {
      options,
      code: `
import { useState } from 'react';
import lodash from 'lodash';

import { doThing } from 'utils/helper';
import xyz from 'components/Button';

import { FooType } from 'types/Foo';

import './index.css';
      `.trim(),
    },
    {
      options,
      code: [
        "import { A, B, a, b } from 'ab';",
        "import * as Foo from 'foo';",
        "import * as bar from 'bar';",
        "import fs from 'fs';",
        "import path from 'path';",
        '',
        "import { something } from 'internal/utils';",
        '',
        "import { MyType } from 'types/models';",
        '',
        "import './styles.css';",
      ].join('\n'),
    },
    {
      options,
      code: [
        "import fs from 'fs';",
        '',
        "import { a, z } from 'internal/foo';",
        '',
        "import './app.css';",
      ].join('\n'),
    },
    {
      options,
      code: [
        "import { ABC } from 'a';",
        "import { B, aaa } from 'b';",
        '',
        "import { C } from './c';",
      ].join('\n'),
    },
  ],
  invalid: [
    {
      options,
      code: `
import './index.css';
import { FooType } from 'types/Foo';
import lodash from 'lodash';
import { doThing } from 'utils/helper';
import { useState } from 'react';
import { UseZcomp } from 'zcomp';
import xyz from 'components/Button';
      `.trim(),
      errors: [{ message: 'Imports are not sorted correctly.' }],
      output: `
import { UseZcomp } from 'zcomp';
import { useState } from 'react';
import lodash from 'lodash';

import { doThing } from 'utils/helper';
import xyz from 'components/Button';

import { FooType } from 'types/Foo';

import './index.css';
      `.trim(),
    },
    {
      options,
      code: [
        "import { B, A } from 'pkg';",
        '',
        "import { something } from 'internal/utils';",
      ].join('\n'),
      output: [
        "import { A, B } from 'pkg';",
        '',
        "import { something } from 'internal/utils';",
      ].join('\n'),
      errors: [{ message: 'Imports are not sorted correctly.' }],
    },
    {
      options,
      code: [
        "import { a } from './othera';",
        "import { B } from './b';",
        "import { A } from './a';",
      ].join('\n'),
      output: [
        "import { A } from './a';",
        "import { B } from './b';",
        "import { a } from './othera';",
      ].join('\n'),
      errors: [{ message: 'Imports are not sorted correctly.' }],
    },
    {
      options,
      code: [
        "import { useContext, UseComponent, createContext } from 'react';",
      ].join('\n'),
      output: [
        "import { UseComponent, createContext, useContext } from 'react';",
      ].join('\n'),
      errors: [{ message: 'Imports are not sorted correctly.' }],
    },
  ],
});
