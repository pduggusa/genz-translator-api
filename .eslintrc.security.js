module.exports = {
  extends: [
    'standard',
    'plugin:security/recommended'
  ],
  plugins: [
    'security'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // Security-specific rules
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-bidi-characters': 'error',

    // Additional security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-proto': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-caller': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-wrappers': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-useless-return': 'error',
    'no-void': 'error',
    'no-warning-comments': 'warn',
    'no-with': 'error',

    // Strict mode and variable declarations
    'strict': ['error', 'global'],
    'no-undef': 'error',
    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false
    }],
    'no-use-before-define': ['error', {
      functions: false,
      classes: true,
      variables: true
    }],

    // Node.js specific security rules
    'n/no-deprecated-api': 'error',
    'n/no-exports-assign': 'error',
    'n/no-unpublished-require': 'off', // Allow test dependencies
    'n/prefer-global/buffer': 'error',
    'n/prefer-global/console': 'error',
    'n/prefer-global/process': 'error',
    'n/prefer-global/url-search-params': 'error',
    'n/prefer-global/url': 'error',

    // Import/require security
    'import/no-dynamic-require': 'error',
    'import/no-webpack-loader-syntax': 'error',

    // Promise security
    'promise/catch-or-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/always-return': 'error',
    'promise/no-native': 'off',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/avoid-new': 'warn',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'warn',
    'promise/valid-params': 'warn'
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true
      },
      rules: {
        // Relax some security rules for tests
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-child-process': 'off',
        'no-new': 'off' // Allow 'new' in tests for mocking
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        // Allow more flexibility in scripts
        'security/detect-child-process': 'off',
        'security/detect-non-literal-fs-filename': 'off'
      }
    }
  ],
  globals: {
    // Test globals
    'testUtils': 'readonly',
    'securityTestUtils': 'readonly',
    'securityConfig': 'readonly',
    'securityBaseline': 'readonly',
    'testServer': 'writable'
  }
};