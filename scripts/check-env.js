#!/usr/bin/env node

/**
 * Environment Setup Checker
 * 
 * This script verifies that all required environment variables are properly configured.
 * Run this script before starting development or deployment to catch configuration issues early.
 * 
 * Usage: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envBakPath = path.join(process.cwd(), '.env.bak');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  log('\n=== Environment File Check ===\n', colors.bold);

  if (fs.existsSync(envPath)) {
    log('✓ .env file exists', colors.green);
    return true;
  } else {
    log('✗ .env file is MISSING', colors.red);
    log('\nThis is the most common cause of "Database connection error"', colors.yellow);
    
    if (fs.existsSync(envBakPath)) {
      log('\n💡 Solution: A backup file exists. Restore it with:', colors.blue);
      log('   cp .env.bak .env', colors.bold);
    } else if (fs.existsSync(envExamplePath)) {
      log('\n💡 Solution: Create from the example file:', colors.blue);
      log('   cp .env.example .env', colors.bold);
      log('   Then edit .env with your actual credentials', colors.yellow);
    }
    return false;
  }
}

function checkRequiredVars() {
  require('dotenv').config();

  const requiredVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string' },
    { name: 'DIRECT_URL', description: 'Direct PostgreSQL connection (for migrations)' },
    { name: 'JWT_SECRET', description: 'Secret for signing authentication tokens' },
    { name: 'SUPABASE_URL', description: 'Supabase project URL' },
    { name: 'SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
  ];

  log('\n=== Required Environment Variables ===\n', colors.bold);

  let allPresent = true;
  for (const varInfo of requiredVars) {
    const value = process.env[varInfo.name];
    if (value && value.trim() !== '') {
      log(`✓ ${varInfo.name.padEnd(20)} - ${varInfo.description}`, colors.green);
    } else {
      log(`✗ ${varInfo.name.padEnd(20)} - ${varInfo.description}`, colors.red);
      allPresent = false;
    }
  }

  return allPresent;
}

function checkDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return false;

  log('\n=== Database URL Validation ===\n', colors.bold);

  const issues = [];
  
  // Check protocol
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    issues.push('URL should start with postgresql:// or postgres://');
  }

  // Check for old PgBouncer port
  if (dbUrl.includes(':6543')) {
    issues.push('Port 6543 is deprecated. Use port 5432 for direct connections');
  }

  // Check for placeholder values
  if (dbUrl.includes('YOUR_PASSWORD') || dbUrl.includes('YOUR_HOST')) {
    issues.push('URL contains placeholder values - replace with actual credentials');
  }

  if (issues.length === 0) {
    log('✓ Database URL format looks good', colors.green);
    // Show sanitized URL
    const sanitized = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    log(`  ${sanitized}`, colors.blue);
    return true;
  } else {
    log('✗ Database URL has issues:', colors.red);
    issues.forEach(issue => log(`  - ${issue}`, colors.yellow));
    return false;
  }
}

function checkJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  log('\n=== JWT Secret Validation ===\n', colors.bold);

  const issues = [];
  
  if (secret.length < 32) {
    issues.push(`Secret is too short (${secret.length} chars). Should be at least 32 characters`);
  }

  const placeholders = ['your_hex_secret_here', 'changeme', 'your_secret_here'];
  if (placeholders.includes(secret.toLowerCase())) {
    issues.push('Secret appears to be a placeholder value');
  }

  if (issues.length === 0) {
    log('✓ JWT secret is properly configured', colors.green);
    return true;
  } else {
    log('✗ JWT secret has issues:', colors.red);
    issues.forEach(issue => log(`  - ${issue}`, colors.yellow));
    log('\n💡 Generate a secure secret with:', colors.blue);
    log('   openssl rand -hex 32', colors.bold);
    return false;
  }
}

// Main execution
function main() {
  log('\n╔════════════════════════════════════════╗', colors.blue);
  log('║  Environment Setup Checker             ║', colors.blue);
  log('╚════════════════════════════════════════╝', colors.blue);

  const envFileExists = checkEnvFile();
  
  if (!envFileExists) {
    log('\n❌ Cannot proceed: .env file is missing', colors.red);
    log('\nFix the .env file issue first, then run this script again.\n', colors.yellow);
    process.exit(1);
  }

  const varsPresent = checkRequiredVars();
  const dbUrlValid = checkDatabaseUrl();
  const jwtSecretValid = checkJwtSecret();

  log('\n=== Summary ===\n', colors.bold);

  if (varsPresent && dbUrlValid && jwtSecretValid) {
    log('✓ All environment checks passed!', colors.green);
    log('  You should be able to start the application.\n', colors.green);
    process.exit(0);
  } else {
    log('✗ Some environment checks failed', colors.red);
    log('  Fix the issues above before starting the application.\n', colors.yellow);
    process.exit(1);
  }
}

main();
