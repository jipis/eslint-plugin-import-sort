// File: @jipis/eslint-plugin-import-sort/rules/custom-import-sort.js
const fs = require('fs');
const path = require('path');

function getInternalDirs(srcDirSubpath) {
  const srcDir = path.resolve(process.cwd(), srcDirSubpath);

  try {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err) {
    return []; // fallback if `src` doesn't exist
  }
}

function getImportType(source, internalDirs) {
  if (/\.css$|\.scss$|\.sass$/.test(source)) return 'styles';
  if (source.startsWith('types/')) return 'internal-types';

  if (
    internalDirs.some((dir) => source.startsWith(dir)) ||
    source.startsWith('./') ||
    source.startsWith('../')
  ) {
    return 'internal';
  }
  return 'external';
}

function sortSpecifiers(specs) {
  return [...specs].sort((a, b) => {
    if (a.local.name < b.local.name) return -1;
    if (a.local.name > b.local.name) return 1;
    return 0;
  });
}

function getImportGroupKey(node) {
  if (node.specifiers.length === 0) return '~';
  const sorted = sortSpecifiers(node.specifiers);
  const first = sorted[0];
  if (first.type === 'ImportSpecifier') return '1';
  if (first.type === 'ImportNamespaceSpecifier') return '2';
  if (first.type === 'ImportDefaultSpecifier') return '3';
  return '4';
}

function getFirstName(node) {
  const sorted = sortSpecifiers(node.specifiers);
  return sorted[0]?.local.name ?? '~';
}

function compareImports(a, b) {
  const groupA = getImportGroupKey(a);
  const groupB = getImportGroupKey(b);
  if (groupA !== groupB) return groupA.localeCompare(groupB);

  const nameA = getFirstName(a);
  const nameB = getFirstName(b);
  return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
}

function generateImportText(node) {
  const sortedSpecs = sortSpecifiers(node.specifiers);

  if (sortedSpecs.length === 0)
    return `import '${node.source.value}';`;

  const defaultSpec = sortedSpecs.find(
    (s) => s.type === 'ImportDefaultSpecifier'
  );
  const namespaceSpec = sortedSpecs.find(
    (s) => s.type === 'ImportNamespaceSpecifier'
  );
  const namedSpecs = sortSpecifiers(
    sortedSpecs.filter((s) => s.type === 'ImportSpecifier')
  );

  const clauseParts = [];
  if (defaultSpec) clauseParts.push(defaultSpec.local.name);
  if (namespaceSpec)
    clauseParts.push(`* as ${namespaceSpec.local.name}`);
  if (namedSpecs.length > 0)
    clauseParts.push(
      `{ ${namedSpecs.map((s) => s.local.name).join(', ')} }`
    );

  return `import ${clauseParts.join(', ')} from '${
    node.source.value
  }';`;
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'))
);

module.exports = {
  meta: {
    name: pkg.name,
    version: pkg.version,
    namespace: 'import-sort',
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Strict import sorting grouped by type and format.',
    },
    defaultOptions: [{ srcDir: 'src' }],
    schema: [
      {
        type: 'object',
        properties: {
          srcDir: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const [{ srcDir }] = context.options;
    const internalDirs = getInternalDirs(srcDir);

    return {
      Program(programNode) {
        const importNodes = programNode.body.filter(
          (n) => n.type === 'ImportDeclaration'
        );

        const groups = {
          external: [],
          internal: [],
          'internal-types': [],
          styles: [],
        };

        for (const node of importNodes) {
          const group = getImportType(
            node.source.value,
            internalDirs
          );
          groups[group].push(node);
        }

        const sorted = [];
        for (const key of [
          'external',
          'internal',
          'internal-types',
        ]) {
          const list = groups[key];

          const named = list.filter(
            (n) => n.specifiers[0]?.type === 'ImportSpecifier'
          );
          const namespace = list.filter(
            (n) =>
              n.specifiers[0]?.type === 'ImportNamespaceSpecifier'
          );
          const defaults = list.filter(
            (n) => n.specifiers[0]?.type === 'ImportDefaultSpecifier'
          );

          for (const part of [named, namespace, defaults]) {
            part.sort(compareImports);
            sorted.push(...part);
          }

          if (
            (named.length || namespace.length || defaults.length) &&
            key !== 'styles'
          ) {
            sorted.push('BLANK_LINE');
          }
        }

        const stylesSorted = groups.styles.sort((a, b) =>
          a.source.value.localeCompare(b.source.value)
        );
        if (stylesSorted.length) sorted.push(...stylesSorted);

        while (
          sorted.length &&
          sorted[sorted.length - 1] === 'BLANK_LINE'
        ) {
          sorted.pop();
        }

        const expectedText = sorted
          .map((node) =>
            node === 'BLANK_LINE' ? '\n' : generateImportText(node)
          )
          .join('\n')
          .replace(/\n{2,}/g, '\n\n')
          .replace(/;(?=\n|$)/g, '') // Remove trailing semicolons
          .trim();

        const sourceCode = context.getSourceCode();
        const actualText = sourceCode
          .getText()
          .slice(
            importNodes[0].range[0],
            importNodes[importNodes.length - 1].range[1]
          )
          .replace(/;(?=\n|$)/g, '') // Remove trailing semicolons
          .trim();

        if (expectedText !== actualText) {
          context.report({
            node: importNodes[0],
            message: 'Imports are not sorted correctly.',
            fix(fixer) {
              const fixedText = sorted
                .map((node) =>
                  node === 'BLANK_LINE'
                    ? '\n'
                    : generateImportText(node)
                )
                .join('\n')
                .replace(/\n{2,}/g, '\n\n');

              return fixer.replaceTextRange(
                [
                  importNodes[0].range[0],
                  importNodes[importNodes.length - 1].range[1],
                ],
                fixedText
              );
            },
          });
        }
      },
    };
  },
};
