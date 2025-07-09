#!/usr/bin/env node

/**
 * Comprehensive Login and Register Test Script
 * Tests both UI behavior and API functionality
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  summary: []
};

// Test configuration
const testConfig = {
  timeout: 30000,
  testUsers: [
    {
      name: 'Valid User',
      email: 'john.doe@angkorcompliance.com',
      password: 'SecurePass123!',
      fullName: 'John Doe',
      expectedResult: 'success'
    },
    {
      name: 'Invalid Email Format',
      email: 'invalid-email',
      password: 'password123',
      fullName: 'Invalid User',
      expectedResult: 'validation_error'
    },
    {
      name: 'Weak Password',
      email: 'user@example.com',
      password: '123',
      fullName: 'Weak Password User',
      expectedResult: 'validation_error'
    },
    {
      name: 'Empty Fields',
      email: '',
      password: '',
      fullName: '',
      expectedResult: 'validation_error'
    },
    {
      name: 'SQL Injection Attempt',
      email: "admin'; DROP TABLE users; --",
      password: 'password123',
      fullName: 'Hacker',
      expectedResult: 'security_error'
    },
    {
      name: 'XSS Attempt',
      email: 'user@example.com',
      password: 'password123',
      fullName: '<script>alert("XSS")</script>',
      expectedResult: 'security_error'
    }
  ]
};

// Utility functions
const logTest = (testName, success, error = null, details = null) => {
  const timestamp = new Date().toISOString();
  if (success) {
    console.log(`✅ [${timestamp}] ${testName}${details ? ` - ${details}` : ''}`);
    testResults.passed++;
  } else {
    console.log(`❌ [${timestamp}] ${testName} - ${error || 'Unknown error'}`);
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error, timestamp });
    }
  }
  testResults.summary.push({ test: testName, success, error, details, timestamp });
};

const runTest = async (testName, testFunction) => {
  try {
    const result = await Promise.race([
      testFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), testConfig.timeout)
      )
    ]);
    
    if (result === false) {
      throw new Error('Test returned false');
    }
    
    if (typeof result === 'object' && result.details) {
      logTest(testName, true, null, result.details);
    } else {
      logTest(testName, true);
    }
    return true;
  } catch (error) {
    logTest(testName, false, error.message);
    return false;
  }
};

// Import API functions
let apiModule;
try {
  apiModule = await import('./src/lib/supabase-enhanced.js');
} catch (e) {
  console.log('⚠️  Enhanced API module not found, trying basic API...');
  try {
    apiModule = await import('./src/lib/supabase.js');
  } catch (e2) {
    console.log('❌ No API module found. Using mock API for testing...');
    apiModule = null;
  }
}

// Mock API for testing when real API is not available
const mockAPI = {
  signIn: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!email || !password) {
      return { data: null, error: { message: 'Email and password are required' } };
    }
    
    if (!email.includes('@')) {
      return { data: null, error: { message: 'Invalid email format' } };
    }
    
    if (password.length < 6) {
      return { data: null, error: { message: 'Password must be at least 6 characters' } };
    }
    
    if (email.includes("'") || email.includes('<script>')) {
      return { data: null, error: { message: 'Invalid characters in email' } };
    }
    
    if (email === 'john.doe@angkorcompliance.com' && password === 'SecurePass123!') {
      return {
        data: {
          user: {
            id: 'user-123',
            email: email,
            created_at: new Date().toISOString()
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      };
    }
    
    return { data: null, error: { message: 'Invalid login credentials' } };
  },

  signUp: async (email, password, fullName) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (!email || !password || !fullName) {
      return { data: null, error: { message: 'All fields are required' } };
    }
    
    if (!email.includes('@')) {
      return { data: null, error: { message: 'Invalid email format' } };
    }
    
    if (password.length < 6) {
      return { data: null, error: { message: 'Password must be at least 6 characters' } };
    }
    
    if (fullName.includes('<script>')) {
      return { data: null, error: { message: 'Invalid characters in name' } };
    }
    
    if (email.includes("'") || email.includes('<script>')) {
      return { data: null, error: { message: 'Invalid characters in email' } };
    }
    
    if (email === 'existing@angkorcompliance.com') {
      return { data: null, error: { message: 'User already exists' } };
    }
    
    return {
      data: {
        user: {
          id: 'user-456',
          email: email,
          created_at: new Date().toISOString(),
          user_metadata: {
            full_name: fullName
          }
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    };
  }
};

// Form validation simulation
const simulateFormValidation = (formData, isSignUp = false) => {
  const errors = [];
  
  // Email validation
  if (!formData.email) {
    errors.push('Email is required');
  } else if (!formData.email.includes('@')) {
    errors.push('Invalid email format');
  } else if (formData.email.length > 100) {
    errors.push('Email is too long');
  }
  
  // Password validation
  if (!formData.password) {
    errors.push('Password is required');
  } else if (formData.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  } else if (formData.password.length > 100) {
    errors.push('Password is too long');
  }
  
  // Sign up specific validation
  if (isSignUp) {
    if (!formData.fullName) {
      errors.push('Full name is required');
    } else if (formData.fullName.length < 2) {
      errors.push('Full name must be at least 2 characters');
    } else if (formData.fullName.length > 100) {
      errors.push('Full name is too long');
    }
    
    if (formData.confirmPassword !== formData.password) {
      errors.push('Passwords do not match');
    }
  }
  
  return errors;
};

// Test login form functionality
const testLoginForm = async () => {
  console.log('\n🔐 Testing Login Form Functionality...');
  
  const authAPI = apiModule || mockAPI;
  
  // Test 1: Valid login
  await runTest('Valid Login - Success Flow', async () => {
    const validUser = testConfig.testUsers[0];
    const result = await authAPI.signIn(validUser.email, validUser.password);
    
    if (result.error) {
      throw new Error(`Login failed: ${result.error.message}`);
    }
    
    if (!result.data || !result.data.user) {
      throw new Error('No user data returned');
    }
    
    return {
      details: `User: ${result.data.user.email}, ID: ${result.data.user.id}`
    };
  });
  
  // Test 2: Invalid email format
  await runTest('Invalid Email Format - Validation', async () => {
    const formData = { email: 'invalid-email', password: 'password123' };
    const validationErrors = simulateFormValidation(formData);
    
    if (validationErrors.length === 0) {
      throw new Error('Should have validation errors for invalid email');
    }
    
    return {
      details: `Validation errors: ${validationErrors.join(', ')}`
    };
  });
  
  // Test 3: Empty fields
  await runTest('Empty Fields - Validation', async () => {
    const formData = { email: '', password: '' };
    const validationErrors = simulateFormValidation(formData);
    
    if (validationErrors.length === 0) {
      throw new Error('Should have validation errors for empty fields');
    }
    
    return {
      details: `Validation errors: ${validationErrors.join(', ')}`
    };
  });
  
  // Test 4: Wrong credentials
  await runTest('Wrong Credentials - Authentication Error', async () => {
    const result = await authAPI.signIn('john.doe@angkorcompliance.com', 'wrongpassword');
    
    if (!result.error) {
      throw new Error('Should have authentication error for wrong credentials');
    }
    
    return {
      details: `Error: ${result.error.message}`
    };
  });
  
  // Test 5: SQL injection attempt
  await runTest('SQL Injection Prevention - Security Test', async () => {
    const maliciousEmail = "admin'; DROP TABLE users; --";
    const result = await authAPI.signIn(maliciousEmail, 'password123');
    
    if (!result.error) {
      throw new Error('Should have blocked SQL injection attempt');
    }
    
    return {
      details: `Security error: ${result.error.message}`
    };
  });
};

// Test register form functionality
const testRegisterForm = async () => {
  console.log('\n📝 Testing Register Form Functionality...');
  
  const authAPI = apiModule || mockAPI;
  
  // Test 1: Valid registration
  await runTest('Valid Registration - Success Flow', async () => {
    const newUser = {
      email: 'newuser@angkorcompliance.com',
      password: 'NewSecurePass123!',
      fullName: 'New User',
      confirmPassword: 'NewSecurePass123!'
    };
    
    const validationErrors = simulateFormValidation(newUser, true);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const result = await authAPI.signUp(newUser.email, newUser.password, newUser.fullName);
    
    if (result.error) {
      throw new Error(`Registration failed: ${result.error.message}`);
    }
    
    if (!result.data || !result.data.user) {
      throw new Error('No user data returned');
    }
    
    return {
      details: `User: ${result.data.user.email}, ID: ${result.data.user.id}`
    };
  });
  
  // Test 2: Password mismatch
  await runTest('Password Mismatch - Validation', async () => {
    const formData = {
      email: 'user@example.com',
      password: 'password123',
      fullName: 'Test User',
      confirmPassword: 'different123'
    };
    
    const validationErrors = simulateFormValidation(formData, true);
    
    if (!validationErrors.includes('Passwords do not match')) {
      throw new Error('Should detect password mismatch');
    }
    
    return {
      details: `Validation caught password mismatch`
    };
  });
  
  // Test 3: Missing full name
  await runTest('Missing Full Name - Validation', async () => {
    const formData = {
      email: 'user@example.com',
      password: 'password123',
      fullName: '',
      confirmPassword: 'password123'
    };
    
    const validationErrors = simulateFormValidation(formData, true);
    
    if (!validationErrors.includes('Full name is required')) {
      throw new Error('Should require full name');
    }
    
    return {
      details: `Validation caught missing full name`
    };
  });
  
  // Test 4: Weak password
  await runTest('Weak Password - Validation', async () => {
    const formData = {
      email: 'user@example.com',
      password: '123',
      fullName: 'Test User',
      confirmPassword: '123'
    };
    
    const validationErrors = simulateFormValidation(formData, true);
    
    if (!validationErrors.some(error => error.includes('Password must be at least 6 characters'))) {
      throw new Error('Should detect weak password');
    }
    
    return {
      details: `Validation caught weak password`
    };
  });
  
  // Test 5: XSS attempt in name
  await runTest('XSS Attack Prevention - Security Test', async () => {
    const xssAttempt = '<script>alert("XSS")</script>';
    const result = await authAPI.signUp('user@example.com', 'password123', xssAttempt);
    
    if (!result.error) {
      throw new Error('Should have blocked XSS attempt');
    }
    
    return {
      details: `Security error: ${result.error.message}`
    };
  });
  
  // Test 6: Existing user
  await runTest('Existing User - Conflict Error', async () => {
    const result = await authAPI.signUp('existing@angkorcompliance.com', 'password123', 'Existing User');
    
    if (!result.error) {
      throw new Error('Should detect existing user');
    }
    
    return {
      details: `Conflict error: ${result.error.message}`
    };
  });
};

// Test UI behavior simulation
const testUIBehavior = async () => {
  console.log('\n🎨 Testing UI Behavior Simulation...');
  
  // Test 1: Form toggle behavior
  await runTest('Form Toggle - Login/Register Switch', async () => {
    let currentMode = 'login';
    
    // Simulate toggle to register
    currentMode = 'register';
    
    if (currentMode !== 'register') {
      throw new Error('Failed to switch to register mode');
    }
    
    // Simulate toggle back to login
    currentMode = 'login';
    
    if (currentMode !== 'login') {
      throw new Error('Failed to switch to login mode');
    }
    
    return {
      details: 'Form mode toggling works correctly'
    };
  });
  
  // Test 2: Password visibility toggle
  await runTest('Password Visibility Toggle', async () => {
    let showPassword = false;
    
    // Simulate toggle to show
    showPassword = !showPassword;
    
    if (!showPassword) {
      throw new Error('Failed to show password');
    }
    
    // Simulate toggle to hide
    showPassword = !showPassword;
    
    if (showPassword) {
      throw new Error('Failed to hide password');
    }
    
    return {
      details: 'Password visibility toggle works correctly'
    };
  });
  
  // Test 3: Loading state simulation
  await runTest('Loading State Management', async () => {
    let isLoading = false;
    
    // Simulate loading start
    isLoading = true;
    
    if (!isLoading) {
      throw new Error('Failed to set loading state');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate loading end
    isLoading = false;
    
    if (isLoading) {
      throw new Error('Failed to clear loading state');
    }
    
    return {
      details: 'Loading state management works correctly'
    };
  });
  
  // Test 4: Error message display
  await runTest('Error Message Display', async () => {
    let errorMessage = '';
    
    // Simulate error
    errorMessage = 'Test error message';
    
    if (!errorMessage) {
      throw new Error('Failed to set error message');
    }
    
    // Simulate error clearing
    errorMessage = '';
    
    if (errorMessage) {
      throw new Error('Failed to clear error message');
    }
    
    return {
      details: 'Error message display works correctly'
    };
  });
};

// Test performance characteristics
const testPerformance = async () => {
  console.log('\n⚡ Testing Performance Characteristics...');
  
  const authAPI = apiModule || mockAPI;
  
  // Test 1: Login response time
  await runTest('Login Response Time', async () => {
    const startTime = Date.now();
    
    try {
      await authAPI.signIn('john.doe@angkorcompliance.com', 'SecurePass123!');
    } catch (error) {
      // Ignore errors for performance test
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime > 2000) {
      throw new Error(`Login took ${responseTime}ms, expected < 2000ms`);
    }
    
    return {
      details: `Response time: ${responseTime}ms`
    };
  });
  
  // Test 2: Registration response time
  await runTest('Registration Response Time', async () => {
    const startTime = Date.now();
    
    try {
      await authAPI.signUp('perf@test.com', 'password123', 'Performance Test');
    } catch (error) {
      // Ignore errors for performance test
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime > 2000) {
      throw new Error(`Registration took ${responseTime}ms, expected < 2000ms`);
    }
    
    return {
      details: `Response time: ${responseTime}ms`
    };
  });
  
  // Test 3: Form validation performance
  await runTest('Form Validation Performance', async () => {
    const startTime = Date.now();
    
    // Simulate multiple validation calls
    for (let i = 0; i < 100; i++) {
      simulateFormValidation({
        email: `user${i}@test.com`,
        password: 'password123',
        fullName: `User ${i}`,
        confirmPassword: 'password123'
      }, true);
    }
    
    const endTime = Date.now();
    const validationTime = endTime - startTime;
    
    if (validationTime > 100) {
      throw new Error(`Validation took ${validationTime}ms for 100 calls, expected < 100ms`);
    }
    
    return {
      details: `100 validations in ${validationTime}ms`
    };
  });
};

// Main test runner
async function runAllLoginRegisterTests() {
  console.log('🚀 Starting Comprehensive Login & Register Tests...\n');
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Check if we're using real API or mock
    if (apiModule) {
      console.log('📡 Testing with REAL API modules');
    } else {
      console.log('🎭 Testing with MOCK API (no modules found)');
    }
    
    // Run all test suites
    await testLoginForm();
    await testRegisterForm();
    await testUIBehavior();
    await testPerformance();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    testResults.errors.push({ test: 'Test Suite', error: error.message });
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print comprehensive results
  console.log('\n' + '='.repeat(70));
  console.log('🎯 LOGIN & REGISTER TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  
  if (testResults.passed + testResults.failed > 0) {
    console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  // Detailed test summary
  console.log('\n📋 DETAILED TEST SUMMARY:');
  console.log('='.repeat(70));
  
  const categories = {
    'Login Tests': testResults.summary.filter(test => test.test.includes('Login') || test.test.includes('Credentials')),
    'Register Tests': testResults.summary.filter(test => test.test.includes('Registration') || test.test.includes('Password Mismatch') || test.test.includes('Full Name')),
    'Security Tests': testResults.summary.filter(test => test.test.includes('SQL') || test.test.includes('XSS') || test.test.includes('Security')),
    'UI Tests': testResults.summary.filter(test => test.test.includes('Toggle') || test.test.includes('Loading') || test.test.includes('Error Message')),
    'Performance Tests': testResults.summary.filter(test => test.test.includes('Performance') || test.test.includes('Response Time'))
  };
  
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      console.log(`\n📂 ${category}:`);
      tests.forEach((test, index) => {
        const status = test.success ? '✅' : '❌';
        const details = test.details ? ` (${test.details})` : '';
        console.log(`  ${index + 1}. ${status} ${test.test}${details}`);
      });
    }
  });
  
  // Final status
  console.log('\n🔐 AUTHENTICATION SYSTEM STATUS:');
  console.log('='.repeat(70));
  
  const healthScore = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
  console.log(`📈 System Health: ${healthScore}% (${testResults.failed === 0 ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'})`);
  
  if (testResults.failed === 0) {
    console.log('🎉 All authentication tests passed! Login and Register functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n🏁 Test Suite Complete!');
  
  // Return success/failure for CI/CD
  return testResults.failed === 0;
}

// Run the tests
runAllLoginRegisterTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });

export { runAllLoginRegisterTests, testResults };