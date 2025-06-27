// File: @jipis/eslint-plugin-import-sort/rules/custom-import-sort.js
const fs = require("fs");
const path = require("path");

function getInternalDirs() {
  const srcDir = path.resolve(process.cwd(), "src");
  try {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch (err) {
    return []; // fallback if `src` doesn't exist
  }
}

function getImportType(source, internalDirs) {
  if (/\.css$|\.scss$|\.sass$/.test(source)) return "styles";
  if (internalDirs.some(dir => source.startsWith(dir)) || source.startsWith("./") || source.startsWith("../")) {
    return source.startsWith("types/") ? "internal-types" : "internal";
  }
  return "external";
}

function getImportGroupKey(node) {
  if (node.specifiers.length === 0) return "~"; // side-effect imports last
  const sortedSpecs = sortSpecifiers(node.specifiers);
  const firstSpecifier = sortedSpecs[0];
  if (firstSpecifier.type === "ImportSpecifier") return "1"; // named
  if (firstSpecifier.type === "ImportNamespaceSpecifier") return "2"; // namespace
  if (firstSpecifier.type === "ImportDefaultSpecifier") return "3"; // default
  return "4";
}

function getFirstName(node) {
  if (node.specifiers.length === 0) return "~";
  const sortedSpecs = sortSpecifiers(node.specifiers);
  return sortedSpecs[0].local.name;
}

function compareImports(a, b) {
  const groupA = getImportGroupKey(a);
  const groupB = getImportGroupKey(b);
  if (groupA !== groupB) return groupA.localeCompare(groupB);

  const nameA = getFirstName(a);
  const nameB = getFirstName(b);
  return nameA.localeCompare(nameB, undefined, { sensitivity: "variant" });
}

function sortSpecifiers(specs) {
  return [...specs].sort((a, b) => a.local.name.localeCompare(b.local.name, undefined, { sensitivity: "variant" }));
}

function generateImportText(node, sortedSpecs) {
  if (sortedSpecs.length === 0) {
    return `import '${node.source.value}';`;
  }

  let importClause;
  if (sortedSpecs.length === 1) {
    const spec = sortedSpecs[0];
    if (spec.type === "ImportSpecifier") {
      importClause = `{ ${spec.local.name} }`;
    } else if (spec.type === "ImportNamespaceSpecifier") {
      importClause = `* as ${spec.local.name}`;
    } else if (spec.type === "ImportDefaultSpecifier") {
      importClause = `${spec.local.name}`;
    }
  } else {
    const defaultSpec = sortedSpecs.find(s => s.type === "ImportDefaultSpecifier");
    const namespaceSpec = sortedSpecs.find(s => s.type === "ImportNamespaceSpecifier");
    const namedSpecs = sortSpecifiers(sortedSpecs.filter(s => s.type === "ImportSpecifier"))
      .map(s => s.local.name)
      .join(", ");

    const clauses = [];
    if (defaultSpec) clauses.push(defaultSpec.local.name);
    if (namespaceSpec) clauses.push(`* as ${namespaceSpec.local.name}`);
    if (namedSpecs) clauses.push(`{ ${namedSpecs} }`);

    importClause = clauses.join(", ");
  }

  return `import ${importClause} from '${node.source.value}';`;
}

module.exports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Strict import sorting grouped by type and format.",
    },
    schema: [],
  },
  create(context) {
    const internalDirs = getInternalDirs();

    return {
      ImportDeclaration(node) {
        const specifiers = node.specifiers;
        if (specifiers.length <= 1) return;

        const namedSpecs = specifiers.filter(s => s.type === "ImportSpecifier");
        const sortedNamed = sortSpecifiers(namedSpecs);

        const currentNamed = namedSpecs.map(s => s.local.name).join(",");
        const expectedNamed = sortedNamed.map(s => s.local.name).join(",");

        if (currentNamed !== expectedNamed) {
          context.report({
            node,
            message: "Named import specifiers are not sorted alphabetically.",
            fix(fixer) {
              const sorted = sortSpecifiers(specifiers);
              return fixer.replaceText(node, generateImportText(node, sorted));
            },
          });
        }
      },

      Program(programNode) {
        const importNodes = programNode.body.filter(n => n.type === "ImportDeclaration");

        const groups = {
          external: [],
          internal: [],
          "internal-types": [],
          styles: [],
        };

        for (const node of importNodes) {
          const group = getImportType(node.source.value, internalDirs);
          groups[group].push(node);
        }

        const sorted = [];

        for (const key of ["external", "internal", "internal-types"]) {
          const list = groups[key];

          const named = list.filter(n => n.specifiers[0]?.type === "ImportSpecifier");
          const namespace = list.filter(n => n.specifiers[0]?.type === "ImportNamespaceSpecifier");
          const defaults = list.filter(n => n.specifiers[0]?.type === "ImportDefaultSpecifier");

          for (const part of [named, namespace, defaults]) {
            part.sort(compareImports);
            sorted.push(...part);
          }

          if (key !== "internal-types" && (named.length || namespace.length || defaults.length)) {
            sorted.push("BLANK_LINE");
          }
        }

        const stylesSorted = groups.styles.sort((a, b) => a.source.value.localeCompare(b.source.value));
        if (stylesSorted.length) {
          sorted.push(...stylesSorted);
        }

        while (sorted.length && sorted[sorted.length - 1] === "BLANK_LINE") {
          sorted.pop();
        }

        const expected = sorted.map(node => node === "BLANK_LINE" ? "\n" : generateImportText(node, sortSpecifiers(node.specifiers)));
        const actual = importNodes.map(node => context.getSourceCode().getText(node));

        if (expected.join("\n") !== actual.join("\n")) {
          context.report({
            node: importNodes[0],
            message: "Imports are not sorted correctly.",
            fix(fixer) {
              return fixer.replaceTextRange(
                [importNodes[0].range[0], importNodes[importNodes.length - 1].range[1]],
                expected.join("\n").replace(/\n{2,}/g, "\n\n")
              );
            },
          });
        }
      },
    };
  },
};

