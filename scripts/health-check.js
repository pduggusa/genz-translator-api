#!/usr/bin/env node
const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/health',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Health check response:', data);
        process.exit(res.statusCode === 200 ? 0 : 1);
    });
});

req.on('error', (error) => {
    console.error('Health check failed:', error.message);
    process.exit(1);
});

req.end();
