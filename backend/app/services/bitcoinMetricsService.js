// Service to fetch Bitcoin network metrics and gold price data

// Bitcoin supply constants
const TOTAL_BTC_SUPPLY = 21000000;
const UNSPENDABLE_BTC = 230.09; // Lost/burned coins (provably unspendable)

// Gold market data constants
const GOLD_MARKET_CAP_TRILLION = 17.5; // ~$17.5 trillion (relatively stable)

// Cache for API responses to prevent excessive calls
const cache = {
  supply: { data: null, timestamp: 0 },
  gold: { data: null, timestamp: 0 },
  treasury: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(cacheEntry) {
  return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
}

export async function fetchBitcoinSupplyMetrics() {
  // Check cache first
  if (isCacheValid(cache.supply)) {
    return cache.supply.data;
  }

  try {
    // Fetch real-time supply data from blockchain.info API
    const response = await fetch('https://blockchain.info/q/totalbc');
    
    if (!response.ok) {
      throw new Error('Failed to fetch supply from blockchain.info');
    }
    
    const totalSatoshis = await response.text();
    const currentSupply = Number(totalSatoshis) / 100000000; // Convert satoshis to BTC
    
    const percentageIssued = (currentSupply / TOTAL_BTC_SUPPLY) * 100;
    const issuanceRemaining = TOTAL_BTC_SUPPLY - currentSupply;
    
    const result = {
      moneySupply: currentSupply,
      percentageIssued: percentageIssued,
      unspendable: UNSPENDABLE_BTC,
      issuanceRemaining: issuanceRemaining,
      totalSupply: TOTAL_BTC_SUPPLY
    };
    
    // Cache the result
    cache.supply = { data: result, timestamp: Date.now() };
    
    return result;
  } catch (error) {
    console.error('Error fetching supply metrics:', error);
    
    // Fallback to mempool.space API
    try {
      const response = await fetch('https://mempool.space/api/v1/mining/blocks/tip/height');
      if (response.ok) {
        const blockHeight = await response.json();
        // Estimate supply based on block height (approximate)
        const currentSupply = estimateSupplyFromBlockHeight(blockHeight);
        const percentageIssued = (currentSupply / TOTAL_BTC_SUPPLY) * 100;
        const issuanceRemaining = TOTAL_BTC_SUPPLY - currentSupply;
        
        const result = {
          moneySupply: currentSupply,
          percentageIssued: percentageIssued,
          unspendable: UNSPENDABLE_BTC,
          issuanceRemaining: issuanceRemaining,
          totalSupply: TOTAL_BTC_SUPPLY
        };
        
        // Cache the result
        cache.supply = { data: result, timestamp: Date.now() };
        
        return result;
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }
    
    // Return cached data if available, even if expired
    if (cache.supply.data) {
      console.warn('Returning stale cached supply data');
      return cache.supply.data;
    }
    
    return null;
  }
}

// Estimate BTC supply from block height
function estimateSupplyFromBlockHeight(height) {
  let supply = 0;
  let reward = 50;
  let currentHeight = 0;
  const halvingInterval = 210000;
  
  while (currentHeight < height) {
    const nextHalving = Math.min(currentHeight + halvingInterval, height);
    const blocks = nextHalving - currentHeight;
    supply += blocks * reward;
    currentHeight = nextHalving;
    reward /= 2;
  }
  
  return supply;
}

export async function fetchGoldMetrics(btcPriceUSD) {
  try {
    // Fetch real-time gold price from APIs (no fallback)
    let goldPricePerOz = null;
    
    // Try GoldAPI.io if API key is available
    const goldApiKey = process.env.GOLD_API_KEY;
    if (goldApiKey) {
      try {
        const goldResponse = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: { 'x-access-token': goldApiKey }
        });
        if (goldResponse.ok) {
          const goldData = await goldResponse.json();
          if (goldData.price) {
            goldPricePerOz = goldData.price;
            console.log('✅ Gold price fetched from GoldAPI.io:', goldPricePerOz);
          }
        }
      } catch (err) {
        console.warn('⚠️  GoldAPI.io failed:', err.message);
      }
    }
    
    // Try Metals-API.com if still no price
    if (!goldPricePerOz) {
      const metalsApiKey = process.env.METALS_API_KEY;
      if (metalsApiKey) {
        try {
          const response = await fetch(`https://metals-api.com/api/latest?access_key=${metalsApiKey}&base=USD&symbols=XAU`);
          if (response.ok) {
            const data = await response.json();
            if (data.rates && data.rates.XAU) {
              goldPricePerOz = 1 / data.rates.XAU; // Convert to price per oz
              console.log('✅ Gold price fetched from Metals-API:', goldPricePerOz);
            }
          }
        } catch (err) {
          console.warn('⚠️  Metals-API failed:', err.message);
        }
      }
    }
    
    // Try free goldprice.org as last resort
    if (!goldPricePerOz) {
      try {
        const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items[0] && data.items[0].xauPrice) {
            goldPricePerOz = data.items[0].xauPrice;
            console.log('✅ Gold price fetched from goldprice.org (free):', goldPricePerOz);
          }
        }
      } catch (err) {
        console.warn('⚠️  goldprice.org failed:', err.message);
      }
    }
    
    // If all APIs failed, return null
    if (!goldPricePerOz) {
      console.error('❌ Failed to fetch gold price from all sources');
      return null;
    }
    
    // Get current BTC supply for market cap calculation
    const supplyData = await fetchBitcoinSupplyMetrics();
    const currentSupply = supplyData?.moneySupply || 19935341.79;
    
    // Calculate Bitcoin priced in gold (troy ounces)
    const btcInGold = btcPriceUSD / goldPricePerOz;
    
    // Calculate Bitcoin market cap
    const btcMarketCapBillion = (btcPriceUSD * currentSupply) / 1000000000;
    const btcMarketCapTrillion = btcMarketCapBillion / 1000;
    
    // Calculate Bitcoin vs Gold market cap percentage
    const btcVsGoldPct = (btcMarketCapTrillion / GOLD_MARKET_CAP_TRILLION) * 100;
    
    return {
      btcInGold: btcInGold,
      goldPricePerOz: goldPricePerOz,
      btcVsGoldMarketCapPct: btcVsGoldPct,
      btcMarketCap: btcMarketCapBillion,
      goldMarketCap: GOLD_MARKET_CAP_TRILLION * 1000 // in billions
    };
  } catch (error) {
    console.error('Error fetching gold metrics:', error);
    return null;
  }
}

export async function fetchCorporateTreasuryTotals(btcPriceUSD) {
  try {
    // Calculate from our database only - no fallback
    let totalBtcHeld = 0;
    
    try {
      const { getAllTreasuries } = await import('../db/treasuriesDb.js');
      const treasuries = getAllTreasuries();
      if (treasuries && treasuries.length > 0) {
        // Sum all holdings from database
        totalBtcHeld = treasuries.reduce((sum, t) => sum + (t.btc_holdings || 0), 0);
        console.log(`✅ Corporate treasury total from database: ${totalBtcHeld.toLocaleString()} BTC (${treasuries.length} companies)`);
      } else {
        console.warn('⚠️  No treasury data in database yet');
      }
    } catch (dbError) {
      console.error('❌ Failed to fetch from database:', dbError.message);
    }
    
    // Get current supply for percentage calculation
    const supplyData = await fetchBitcoinSupplyMetrics();
    const currentSupply = supplyData?.moneySupply || 19935341.79;
    
    const valueUSD = totalBtcHeld * btcPriceUSD;
    const supplyPct = (totalBtcHeld / currentSupply) * 100;
    
    return {
      totalBtcHeld: totalBtcHeld,
      valueUSD: valueUSD,
      supplyPct: supplyPct
    };
  } catch (error) {
    console.error('❌ Error fetching treasury totals:', error);
    return null;
  }
}
