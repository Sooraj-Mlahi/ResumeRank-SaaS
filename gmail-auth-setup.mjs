// Gmail Authentication Setup Tool
// Run this to set up Gmail OAuth authentication

import 'dotenv/config';
import { 
  getGmailAuthUrl, 
  exchangeCodeForTokens, 
  testGmailConnection,
  isGmailAuthenticated 
} from './server/gmail-oauth.ts';

console.log('📧 Gmail Authentication Setup');
console.log('=' .repeat(40));

async function setupGmailAuth() {
  try {
    // Check if already authenticated
    if (isGmailAuthenticated()) {
      console.log('✅ Gmail already authenticated!');
      console.log('🧪 Testing connection...\n');
      
      const result = await testGmailConnection();
      if (result.success) {
        console.log(`📧 Connected to: ${result.email}`);
        console.log(`📨 Total messages: ${result.messagesTotal}`);
        console.log(`🧵 Total threads: ${result.threadsTotal}`);
        console.log('\n🎉 Gmail is ready for CV fetching!');
      } else {
        console.log(`❌ Connection failed: ${result.error}`);
        console.log('\n🔧 You may need to re-authenticate.');
      }
      return;
    }

    // Generate auth URL
    console.log('🔑 Gmail not authenticated. Starting OAuth flow...\n');
    
    const authUrl = getGmailAuthUrl();
    
    console.log('📋 STEP 1: Authorize Gmail Access');
    console.log('━'.repeat(40));
    console.log('🌐 Open this URL in your browser:');
    console.log(`\n${authUrl}\n`);
    console.log('📝 STEP 2: Follow these steps:');
    console.log('   1. Click the link above');
    console.log('   2. Sign in to your Google account');
    console.log('   3. Grant permission to access Gmail');
    console.log('   4. Copy the authorization code from the URL');
    console.log('   5. Come back here and paste it');
    
    console.log('\n⚠️  Note: The redirect will show "This site can\'t be reached"');
    console.log('   That\'s normal! Just copy the "code" parameter from the URL.');
    console.log('\n📎 Example: http://localhost:5000/...&code=4/0AeaXXX...&scope=...');
    console.log('   Copy everything after "code=" and before "&scope"');
    
    console.log('\n🔗 Click here: ' + authUrl);
    console.log('\n⏳ Waiting for your authorization code...');
    console.log('   Run: node gmail-auth-complete.js YOUR_CODE_HERE');
    
  } catch (error) {
    console.error('❌ Error setting up Gmail auth:', error);
  }
}

setupGmailAuth();