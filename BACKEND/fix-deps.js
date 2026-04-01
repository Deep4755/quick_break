// Quick fix script for dependency issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Checking for dependency issues...');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules exists');
} else {
  console.log('❌ node_modules missing - run npm install');
}

// Check if package-lock.json exists
const lockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  console.log('✅ package-lock.json exists');
} else {
  console.log('❌ package-lock.json missing');
}

// Check Express version
try {
  const express = require('express');
  console.log('✅ Express loaded successfully');
} catch (e) {
  console.log('❌ Express loading failed:', e.message);
}

console.log('🚀 If issues persist, try:');
console.log('   rm -rf node_modules package-lock.json');
console.log('   npm install');