const angularTemplate = require("@angular-eslint/eslint-plugin-template");
const angularTemplateParser = require("@angular-eslint/template-parser");

module.exports = [
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      "@angular-eslint/template": angularTemplate,
    },
    rules: {
      "@angular-eslint/template/alt-text": "error",
      "@angular-eslint/template/attributes-order": "warn",
      "@angular-eslint/template/banana-in-box": "error",
      "@angular-eslint/template/button-has-type": "warn",
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/conditional-complexity": ["warn", { "maxComplexity": 3 }],
      "@angular-eslint/template/cyclomatic-complexity": ["warn", { "maxComplexity": 5 }],
      "@angular-eslint/template/elements-content": "warn",
      "@angular-eslint/template/eqeqeq": "error",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/label-has-associated-control": "warn",
      "@angular-eslint/template/mouse-events-have-key-events": "warn",
      "@angular-eslint/template/no-any": "error",
      "@angular-eslint/template/no-autofocus": "error",
      "@angular-eslint/template/no-call-expression": "warn",
      "@angular-eslint/template/no-distracting-elements": "error",
      "@angular-eslint/template/no-duplicate-attributes": "error",
      "@angular-eslint/template/no-inline-styles": "warn",
      "@angular-eslint/template/no-positive-tabindex": "error",
      "@angular-eslint/template/prefer-self-closing-tags": "warn",
      "@angular-eslint/template/role-has-required-aria": "error",
      "@angular-eslint/template/valid-aria": "error",
      "@angular-eslint/template/use-track-by-function": "warn"
    },
  },
];
