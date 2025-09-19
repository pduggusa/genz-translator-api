module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        // Customize rules as needed
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off', // Allow console.log for server logging
        'camelcase': 'off', // Allow snake_case for database fields
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }]
    },
    globals: {
        // Define global variables if needed
        'process': 'readonly'
    }
};