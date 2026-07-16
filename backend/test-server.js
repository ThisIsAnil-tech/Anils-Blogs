// test-server.js - Minimal test to find the error

console.log('🚀 Starting minimal test...');

// Test 1: Check Node.js version
console.log(`📦 Node.js version: ${process.version}`);

// Test 2: Check if we can require basic modules
try {
  console.log('📡 Testing express...');
  require('express');
  console.log('✅ Express OK');
} catch (e) {
  console.error('❌ Express failed:', e.message);
}

try {
  console.log('📡 Testing mongoose...');
  require('mongoose');
  console.log('✅ Mongoose OK');
} catch (e) {
  console.error('❌ Mongoose failed:', e.message);
}

try {
  console.log('📡 Testing dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv OK');
  console.log(`   PORT: ${process.env.PORT}`);
} catch (e) {
  console.error('❌ Dotenv failed:', e.message);
}

// Test 3: Try to load app.js with error catching
console.log('📡 Loading app.js...');
try {
  const app = require('./src/app');
  console.log('✅ app.js loaded successfully');
  console.log(`   Type: ${typeof app}`);
  console.log(`   Is function: ${typeof app === 'function'}`);
} catch (err) {
  console.error('❌ Failed to load app.js:');
  console.error(`   Message: ${err.message}`);
  console.error(`   Stack: ${err.stack}`);
}

// Test 4: Try to load database
console.log('📡 Loading database config...');
try {
  const db = require('./src/config/database');
  console.log('✅ Database config loaded');
  console.log(`   Type: ${typeof db}`);
} catch (err) {
  console.error('❌ Failed to load database:');
  console.error(`   Message: ${err.message}`);
}

// Test 5: Try to load logger
console.log('📡 Loading logger...');
try {
  const logger = require('./src/utils/logger');
  console.log('✅ Logger loaded');
} catch (err) {
  console.error('❌ Failed to load logger:');
  console.error(`   Message: ${err.message}`);
}

// Test 6: Try to load routes
console.log('📡 Loading routes...');
try {
  const routes = require('./src/routes');
  console.log('✅ Routes loaded');
} catch (err) {
  console.error('❌ Failed to load routes:');
  console.error(`   Message: ${err.message}`);
}

console.log('🏁 Test complete.');