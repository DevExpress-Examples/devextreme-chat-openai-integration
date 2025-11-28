module.exports = {
  root: true,
  extends: ['devextreme/spell-check'],
  overrides: [{
    files: ['*.ts', '*.vue', '*.js'],
    extends: [
      '@vue/eslint-config-typescript',
      'devextreme/vue'
    ],
    env: { es6: true },
    parserOptions: {
      sourceType: 'module',
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      'createDefaultProgram': true,
      'ecmaVersion': 2022,
    },
    globals: {
      System: false,
      AzureGateway: false,
      AzureFileSystem: false,
    },
  }]
};
