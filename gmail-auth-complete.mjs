// Gmail OAuth Completion - Run this with your authorization code
// Usage: node gmail-auth-complete.js YOUR_AUTHORIZATION_CODE

import 'dotenv/config';
import { exchangeCodeForTokens, testGmailConnection } from './server/gmail-oauth.ts';

const authCode = process.argv[2];

if (!authCode) {
  console.log('❌ Missing authorization code!');
  console.log('');
  console.log('📋 Usage:');
  console.log('   node gmail-auth-complete.js YOUR_AUTHORIZATION_CODE');
  console.log('');
  console.log('💡 To get your authorization code:');
  console.log('   1. Run: node gmail-auth-setup.mjs');
  console.log('   2. Follow the OAuth flow');
  console.log('   3. Copy the code from the redirect URL');
  console.log('   4. Run this script with the code');
  process.exit(1);
}

async function completeGmailAuth() {
  console.log('🔑 Completing Gmail OAuth setup...');
  console.log(`📋 Using authorization code: ${authCode.substring(0, 20)}...`);
  
  try {
    // Exchange code for tokens
    console.log('\n🔄 Exchanging code for access tokens...');
    const tokens = await exchangeCodeForTokens(authCode);
    
    console.log('✅ Tokens received and saved!');
    console.log(`   📁 Saved to: gmail-token.json`);
    
    // Test connection
    console.log('\n🧪 Testing Gmail connection...');
    const result = await testGmailConnection();
    
    if (result.success) {
      console.log('🎉 SUCCESS! Gmail authentication completed!');
      console.log('');
      console.log('📧 Account Details:');
      console.log(`   Email: ${result.email}`);
      console.log(`   Messages: ${result.messagesTotal}`);
      console.log(`   Threads: ${result.threadsTotal}`);
      console.log('');
      console.log('🚀 What you can do now:');
      console.log('   ✅ Your app can fetch CVs from Gmail');
      console.log('   ✅ Test with: npm run dev');
      console.log('   ✅ Or run: node test-gmail-real.mjs');
      
    } else {
      console.log('❌ Connection test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to complete OAuth setup:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   • Check if the authorization code is correct');
    console.log('   • Make sure the code hasn\'t expired (they expire quickly)');
    console.log('   • Verify your Google OAuth credentials');
    console.log('   • Run gmail-auth-setup.mjs again to get a fresh code');
  }
}

completeGmailAuth();