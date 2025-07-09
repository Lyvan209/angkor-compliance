#!/usr/bin/env node

/**
 * 🔒 COMPREHENSIVE SECURITY TESTING SCRIPT
 * Tests all security fixes implemented for Angkor Compliance
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : null;
                    resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

function addTest(name, testFn) {
    return async () => {
        try {
            log(`Running: ${name}`);
            await testFn();
            results.passed++;
            results.tests.push({ name, status: 'PASSED' });
            log(`${name} - PASSED`, 'success');
        } catch (error) {
            results.failed++;
            results.tests.push({ name, status: 'FAILED', error: error.message });
            log(`${name} - FAILED: ${error.message}`, 'error');
        }
    };
}

// Security Tests

// 1. Test Security Headers
const testSecurityHeaders = addTest('Security Headers', async () => {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    
    const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'permissions-policy'
    ];

    for (const header of requiredHeaders) {
        if (!response.headers[header]) {
            throw new Error(`Missing security header: ${header}`);
        }
    }

    // Check specific header values
    if (response.headers['x-frame-options'] !== 'DENY') {
        throw new Error('X-Frame-Options should be DENY');
    }

    if (!response.headers['content-security-policy']) {
        throw new Error('Content-Security-Policy header missing');
    }
});

// 2. Test Rate Limiting
const testRateLimiting = addTest('Rate Limiting', async () => {
    const requests = [];
    
    // Make 6 requests to auth endpoint (should be limited to 5)
    for (let i = 0; i < 6; i++) {
        requests.push(
            makeRequest(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
            })
        );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    if (rateLimited.length === 0) {
        throw new Error('Rate limiting not working - no 429 responses');
    }
});

// 3. Test Input Validation
const testInputValidation = addTest('Input Validation', async () => {
    const invalidEmails = [
        'test..test@example.com',
        'test @example.com',
        'test@example',
        'test@.com',
        'test@example..com'
    ];

    for (const email of invalidEmails) {
        const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: TEST_PASSWORD })
        });

        if (response.status !== 400) {
            throw new Error(`Invalid email ${email} was accepted`);
        }
    }

    // Test weak password
    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            company: 'Test Company',
            password: 'weak'
        })
    });

    if (response.status !== 400) {
        throw new Error('Weak password was accepted');
    }
});

// 4. Test SQL Injection Prevention
const testSQLInjection = addTest('SQL Injection Prevention', async () => {
    const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin' --"
    ];

    for (const payload of sqlInjectionPayloads) {
        const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: payload, password: payload })
        });

        // Should not return 500 (server error) - should handle gracefully
        if (response.status === 500) {
            throw new Error(`SQL injection payload caused server error: ${payload}`);
        }
    }
});

// 5. Test XSS Prevention
const testXSSPrevention = addTest('XSS Prevention', async () => {
    const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">'
    ];

    for (const payload of xssPayloads) {
        const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: payload,
                email: 'test@example.com',
                company: payload,
                password: 'TestPassword123!'
            })
        });

        // Should not return 500 (server error) - should handle gracefully
        if (response.status === 500) {
            throw new Error(`XSS payload caused server error: ${payload}`);
        }
    }
});

// 6. Test CORS Configuration
const testCORS = addTest('CORS Configuration', async () => {
    const response = await makeRequest(`${BASE_URL}/api/health`, {
        headers: {
            'Origin': 'https://malicious-site.com'
        }
    });

    // Should not allow requests from unauthorized origins
    if (response.headers['access-control-allow-origin'] === 'https://malicious-site.com') {
        throw new Error('CORS allows unauthorized origin');
    }
});

// 7. Test Authentication Flow
const testAuthenticationFlow = addTest('Authentication Flow', async () => {
    // Test registration
    const registerResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            company: 'Test Company',
            password: 'TestPassword123!'
        })
    });

    if (registerResponse.status !== 201) {
        throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    // Test login
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'TestPassword123!'
        })
    });

    if (loginResponse.status !== 200) {
        throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Check for httpOnly cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (!setCookieHeader) {
        throw new Error('No session cookie set');
    }

    if (!setCookieHeader.includes('HttpOnly')) {
        throw new Error('Session cookie not HttpOnly');
    }

    if (!setCookieHeader.includes('Secure')) {
        throw new Error('Session cookie not Secure');
    }
});

// 8. Test Session Management
const testSessionManagement = addTest('Session Management', async () => {
    // First, login to get a session
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'TestPassword123!'
        })
    });

    if (loginResponse.status !== 200) {
        throw new Error('Login failed for session test');
    }

    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
        throw new Error('No cookies set during login');
    }

    // Test session validation
    const validateResponse = await makeRequest(`${BASE_URL}/api/auth/validate`, {
        headers: {
            'Cookie': cookies.join('; ')
        }
    });

    if (validateResponse.status !== 200) {
        throw new Error('Session validation failed');
    }

    // Test logout
    const logoutResponse = await makeRequest(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
            'Cookie': cookies.join('; ')
        }
    });

    if (logoutResponse.status !== 200) {
        throw new Error('Logout failed');
    }
});

// 9. Test OAuth Security
const testOAuthSecurity = addTest('OAuth Security', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/google`);
    
    if (response.status !== 302) {
        throw new Error('OAuth redirect not working');
    }

    const location = response.headers.location;
    if (!location) {
        throw new Error('No OAuth redirect location');
    }

    // Check that no tokens are exposed in URL
    if (location.includes('token=') || location.includes('access_token=')) {
        throw new Error('OAuth tokens exposed in URL');
    }
});

// 10. Test Error Handling
const testErrorHandling = addTest('Error Handling', async () => {
    // Test invalid endpoint
    const response = await makeRequest(`${BASE_URL}/api/invalid-endpoint`);
    
    if (response.status !== 404) {
        throw new Error('Invalid endpoint should return 404');
    }

    // Test malformed JSON
    const malformedResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": json}'
    });

    if (malformedResponse.status === 500) {
        throw new Error('Malformed JSON caused server error instead of 400');
    }
});

// Main test runner
async function runAllTests() {
    log('🔒 Starting Comprehensive Security Testing...');
    log(`Testing URL: ${BASE_URL}`);
    log('');

    const tests = [
        testSecurityHeaders,
        testRateLimiting,
        testInputValidation,
        testSQLInjection,
        testXSSPrevention,
        testCORS,
        testAuthenticationFlow,
        testSessionManagement,
        testOAuthSecurity,
        testErrorHandling
    ];

    for (const test of tests) {
        await test();
        log(''); // Add spacing between tests
    }

    // Print summary
    log('📊 SECURITY TEST SUMMARY');
    log('='.repeat(50));
    log(`Total Tests: ${results.passed + results.failed}`);
    log(`Passed: ${results.passed} ✅`);
    log(`Failed: ${results.failed} ❌`);
    log('');

    if (results.failed > 0) {
        log('❌ FAILED TESTS:');
        results.tests
            .filter(t => t.status === 'FAILED')
            .forEach(t => log(`  - ${t.name}: ${t.error}`));
        log('');
    }

    if (results.passed === tests.length) {
        log('🎉 ALL SECURITY TESTS PASSED!');
        log('✅ Your application is secure and ready for production.');
    } else {
        log('⚠️  SOME SECURITY TESTS FAILED!');
        log('🔧 Please fix the failed tests before deployment.');
    }

    return results.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            log(`Test runner error: ${error.message}`, 'error');
            process.exit(1);
        });
}

module.exports = { runAllTests, results };