// Environment Setup Checker
// Run this script to verify your API keys and credentials are configured correctly

import 'dotenv/config';

console.log('🔍 Environment Configuration Checker');
console.log('=' .repeat(50));

const checks = [
  {
    name: 'OpenAI API Key',
    env: 'OPENAI_API_KEY',
    validator: (val) => val && val.startsWith('sk-'),
    required: true,
    help: 'Get from https://platform.openai.com/api-keys'
  },
  {
    name: 'Database URL',
    env: 'DATABASE_URL', 
    validator: (val) => val && val.includes('postgresql://'),
    required: true,
    help: 'Get from NeonDB, Supabase, or local PostgreSQL'
  },
  {
    name: 'Google Client ID',
    env: 'GOOGLE_CLIENT_ID',
    validator: (val) => val && val.includes('.apps.googleusercontent.com'),
    required: false,
    help: 'Get from Google Cloud Console for Gmail integration'
  },
  {
    name: 'Google Client Secret',
    env: 'GOOGLE_CLIENT_SECRET',
    validator: (val) => val && val.length > 20,
    required: false,
    help: 'Get from Google Cloud Console for Gmail integration'
  },
  {
    name: 'Microsoft Client ID',
    env: 'MICROSOFT_CLIENT_ID', 
    validator: (val) => val && val.length > 30,
    required: false,
    help: 'Get from Azure Portal for Outlook integration'
  },
  {
    name: 'Microsoft Client Secret',
    env: 'MICROSOFT_CLIENT_SECRET',
    validator: (val) => val && val.length > 30,
    required: false,
    help: 'Get from Azure Portal for Outlook integration'
  },
  {
    name: 'Session Secret',
    env: 'SESSION_SECRET',
    validator: (val) => val && val.length > 10,
    required: true,
    help: 'Set a secure random string for session encryption'
  }
];

let allRequired = true;
let hasEmailProvider = false;

console.log('📋 Checking configuration...\n');

checks.forEach(check => {
  const value = process.env[check.env];
  const isValid = check.validator(value);
  const status = isValid ? '✅' : (check.required ? '❌' : '⚠️');
  
  console.log(`${status} ${check.name}`);
  
  if (!isValid) {
    console.log(`   Value: ${value ? '[SET BUT INVALID]' : '[NOT SET]'}`);
    console.log(`   Help: ${check.help}`);
    
    if (check.required) {
      allRequired = false;
    }
  } else {
    console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  }
  
  // Check for email providers
  if ((check.env === 'GOOGLE_CLIENT_ID' || check.env === 'MICROSOFT_CLIENT_ID') && isValid) {
    hasEmailProvider = true;
  }
  
  console.log('');
});

// Summary
console.log('=' .repeat(50));
console.log('📊 CONFIGURATION SUMMARY');
console.log('=' .repeat(50));

if (allRequired) {
  console.log('✅ All required configuration is valid');
} else {
  console.log('❌ Some required configuration is missing or invalid');
}

if (hasEmailProvider) {
  console.log('✅ At least one email provider is configured');
} else {
  console.log('⚠️  No email providers configured (Gmail or Outlook)');
}

console.log('');

// Next steps
if (allRequired && hasEmailProvider) {
  console.log('🎉 READY TO GO!');
  console.log('Next steps:');
  console.log('  1. Run: npm run db:push');
  console.log('  2. Run: npm run dev');
  console.log('  3. Test CV extraction: node test-complete-pipeline.cjs');
} else {
  console.log('🔧 CONFIGURATION NEEDED');
  console.log('Next steps:');
  console.log('  1. Update your .env file with missing values');
  console.log('  2. Follow the setup guide in SETUP-GUIDE.md');
  console.log('  3. Run this checker again: node check-env.mjs');
}

// Environment detection
console.log('');
console.log('🌍 Environment Detection:');
console.log(`  Node Environment: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  Running on Replit: ${process.env.REPLIT_CONNECTORS_HOSTNAME ? 'Yes' : 'No'}`);
console.log(`  Port: ${process.env.PORT || '5000 (default)'}`);

export { checks };