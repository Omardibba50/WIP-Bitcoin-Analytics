// Test script to verify ScraperAPI is working
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '834924f88bd20caac4388379f42bda15';

async function testScraperAPI() {
  console.log('🧪 Testing ScraperAPI connection...\n');
  
  try {
    // Test 1: Simple test with httpbin
    console.log('Test 1: Basic API connectivity');
    const testUrl1 = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent('https://httpbin.org/ip')}`;
    const response1 = await fetch(testUrl1);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ ScraperAPI is working!');
      console.log('   Response:', data1);
    } else {
      console.log('❌ ScraperAPI test failed:', response1.status);
    }
    
    console.log('\n---\n');
    
    // Test 2: Fetch bitcointreasuries.net
    console.log('Test 2: Fetching bitcointreasuries.net');
    const testUrl2 = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent('https://bitcointreasuries.net/')}`;
    const response2 = await fetch(testUrl2);
    
    if (response2.ok) {
      const html = await response2.text();
      console.log('✅ Successfully fetched bitcointreasuries.net');
      console.log(`   HTML length: ${html.length} characters`);
      
      // Check if we got the right page
      if (html.includes('Bitcoin') || html.includes('MicroStrategy')) {
        console.log('✅ Page content looks correct');
        
        // Try to find some company names
        const companies = [];
        const patterns = [
          /MicroStrategy/gi,
          /Marathon/gi,
          /Tesla/gi,
          /Riot/gi,
          /Hut 8/gi
        ];
        
        patterns.forEach(pattern => {
          if (pattern.test(html)) {
            companies.push(pattern.source.replace(/\\/g, ''));
          }
        });
        
        if (companies.length > 0) {
          console.log('✅ Found companies:', companies.join(', '));
        }
      } else {
        console.log('⚠️  Page content might be incorrect');
      }
    } else {
      console.log('❌ Failed to fetch bitcointreasuries.net:', response2.status);
    }
    
    console.log('\n---\n');

     // Test 3: nodes with https://bitnodes.io/
    console.log('Test 3: Nodes connectivity');
    const testUrl3 = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent('https://bitnodes.io/')}`;
    const responsen = await fetch(testUrl3);
    
    if (responsen.ok) {
      const data3 = await responsen.json();
      console.log('✅ ScraperAPI is working!');
      console.log(' Nodes Response:', data3);
    } else {
      console.log('❌ ScraperAPI test failed:', responsen.status);
    }
    
    console.log('\n---\n');


    console.log('✅ All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Make sure SCRAPER_API_KEY is in your .env file');
    console.log('2. Restart your backend server');
    console.log('3. Check the console for "✅ Successfully fetched X companies"');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Verify API key is correct');
    console.error('3. Check ScraperAPI dashboard for quota');
  }
}

// Run the test
testScraperAPI();
