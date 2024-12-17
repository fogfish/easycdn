const typeScriptEslintParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ["lib/**/*.ts"],
    languageOptions: {
      parser: typeScriptEslintParser,
      parserOptions: {
        ecmaVersion: '2018',
        sourceType: 'module',
      },
    },
    "rules": {
      "semi": "off",
      "@typescript-eslint/semi": ["off"],
    }
  }
]
