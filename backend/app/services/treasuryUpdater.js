// Background service to update corporate treasury data periodically
import { insertTreasury, getAllTreasuries } from '../db/treasuriesDb.js';
import { fetchTreasuryData } from './treasuryService.js';
import { getLatestPrice } from '../db/pricesDb.js';

let updateInterval = null;
const UPDATE_INTERVAL = 3600000; // 1 hour in milliseconds

export function startTreasuryUpdater() {
  if (updateInterval) {
    console.log('⚠️  Treasury updater already running');
    return;
  }

  console.log('🔄 Starting corporate treasury updater...');
  console.log(`   Update frequency: Every ${UPDATE_INTERVAL / 1000 / 60} minutes`);

  // Initial update
  updateTreasuries();

  // Set up interval for periodic updates
  updateInterval = setInterval(updateTreasuries, UPDATE_INTERVAL);
}

export function stopTreasuryUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('⏹️  Treasury updater stopped');
  }
}

async function updateTreasuries() {
  try {
    console.log('\n🔄 Updating corporate treasury data...');
    
    // Get current BTC price
    const priceData = getLatestPrice('BTC');
    const btcPrice = priceData?.price || 67000;
    console.log(`   Current BTC price: $${btcPrice.toLocaleString()}`);
    
    // Fetch fresh data from APIs
    const freshData = await fetchTreasuryData(btcPrice);
    
    if (!freshData || freshData.length === 0) {
      console.warn('⚠️  No treasury data received, keeping existing data');
      return;
    }
    
    console.log(`   Received ${freshData.length} companies`);
    
    // Update database
    let updated = 0;
    let failed = 0;
    
    for (const treasury of freshData) {
      try {
        insertTreasury(
          treasury.companyName,
          treasury.btcHoldings,
          treasury.usdValue,
          treasury.percentageOfSupply,
          treasury.country
        );
        updated++;
      } catch (err) {
        console.error(`   ❌ Failed to update ${treasury.companyName}:`, err.message);
        failed++;
      }
    }
    
    console.log(`✅ Treasury update complete!`);
    console.log(`   Updated: ${updated} companies`);
    if (failed > 0) {
      console.log(`   Failed: ${failed} companies`);
    }
    
    // Show top 5 companies
    const allTreasuries = getAllTreasuries();
    if (allTreasuries && allTreasuries.length > 0) {
      console.log('\n📊 Top 5 Bitcoin Holders:');
      allTreasuries.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.company_name}: ${t.btc_holdings.toLocaleString()} BTC`);
      });
    }
    
    console.log(`\n⏰ Next update in ${UPDATE_INTERVAL / 1000 / 60} minutes\n`);
    
  } catch (error) {
    console.error('❌ Error updating treasuries:', error.message);
  }
}

// Manual update function (can be called from API endpoint)
export async function manualUpdate() {
  console.log('🔄 Manual treasury update triggered');
  await updateTreasuries();
}
