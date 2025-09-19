module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'no-console': 'off' // Allow console for server logging
  }
};