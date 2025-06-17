// File: tests/custom-import-sort.test.js
const rule = require('../rules/custom-import-sort');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('custom-import-sort', rule, {
  valid: [
    {
      code: `
import { useState } from 'react';
import lodash from 'lodash';

import { doThing } from 'utils/helper';
import xyz from 'components/Button';

import { FooType } from 'types/Foo';

import './index.css';
      `.trim(),
    },
  ],
  invalid: [
    {
      code: `
import './index.css';
import { FooType } from 'types/Foo';
import lodash from 'lodash';
import { doThing } from 'utils/helper';
import { useState } from 'react';
import xyz from 'components/Button';
      `.trim(),
      errors: [{ message: 'Imports are not sorted correctly.' }],
      output: `
import lodash from 'lodash';
import { useState } from 'react';

import { doThing } from 'utils/helper';
import xyz from 'components/Button';

import { FooType } from 'types/Foo';

import './index.css';
      `.trim(),
    },
  ],
});