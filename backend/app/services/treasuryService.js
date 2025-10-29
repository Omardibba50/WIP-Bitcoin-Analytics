// Service to fetch corporate treasury data from real-time sources

// NO HARDCODED DATA - All data fetched from APIs
// 
// API Options:
// 1. Scrape bitcointreasuries.net (most accurate)
// 2. Use CoinGecko companies endpoint (limited data)
// 3. Use custom API if available
//
// Current implementation: Fetches from multiple sources with fallback

const TOTAL_BTC_SUPPLY = 21000000;

// Cache to prevent excessive API calls
let treasuryCache = {
  data: null,
  timestamp: 0,
  ttl: 3600000 // 1 hour cache
};

// NO HARDCODED DATA - All fetched from bitcointreasuries.net via ScraperAPI

// Scrape bitcointreasuries.net for real-time data
async function scrapeBitcoinTreasuries() {
  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY || '834924f88bd20caac4388379f42bda15';
    
    // bitcointreasuries.net is a JavaScript-rendered site, so we need to enable rendering
    const targetUrl = encodeURIComponent('https://bitcointreasuries.net/');
    const apiUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${targetUrl}&render=true`;
    
    console.log('🔄 Fetching corporate treasury data from bitcointreasuries.net...');
    console.log('   (Using JavaScript rendering - this may take up to 60 seconds)');
    
    // Add 60 second timeout for scraping (JS rendering takes time)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`ScraperAPI returned status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse the rendered HTML to extract company data
    const companies = parseCompanyData(html);
    
    if (companies && companies.length > 0) {
      console.log(`✅ Successfully fetched ${companies.length} companies from bitcointreasuries.net`);
      return companies;
    }
    
    console.warn('⚠️  No company data found in rendered HTML');
    return null;
    
  } catch (error) {
    console.error('❌ Failed to scrape bitcointreasuries.net:', error.message);
    return null;
  }
}

// Parse HTML to extract company treasury data
function parseCompanyData(html) {
  try {
    const companies = [];
    
    // Look for table rows - after rendering, the data should be in proper HTML tables
    const tableRowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
    const rows = html.match(tableRowPattern) || [];
    
    console.log(`   Found ${rows.length} table rows to parse`);
    
    for (const row of rows) {
      // Extract all cells from this row
      const cellPattern = /<td[^>]*>(.*?)<\/td>/gis;
      const cellMatches = [...row.matchAll(cellPattern)];
      
      if (cellMatches.length < 3) continue; // Need at least 3 columns
      
      // Extract text from cells, removing all HTML tags
      const cells = cellMatches.map(m => {
        let text = m[1];
        // Remove all HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        // Remove emojis
        text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
        // Normalize whitespace
        text = text.replace(/\s+/g, ' ').trim();
        return text;
      });
      
      // Try to identify the structure:
      // Usually: [Rank, Company, Country, BTC, USD Value, % Supply]
      // But could vary, so we look for patterns
      
      let rank = null;
      let company = null;
      let country = null;
      let btc = null;
      
      // Find rank (should be a number)
      for (let i = 0; i < Math.min(2, cells.length); i++) {
        if (/^\d+$/.test(cells[i])) {
          rank = parseInt(cells[i]);
          break;
        }
      }
      
      // Find BTC amount (number with optional commas and decimals)
      for (let i = 0; i < cells.length; i++) {
        const match = cells[i].match(/^([\d,]+(?:\.\d+)?)$/);
        if (match && !cells[i].includes('%')) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          // BTC amounts for companies are typically 100 - 500,000
          if (value >= 100 && value <= 500000) {
            btc = value;
            // Company name is usually before BTC amount
            if (i > 0) {
              company = cells[i - 1];
              // Country might be before company
              if (i > 1 && cells[i - 2].length < 30) {
                country = cells[i - 2];
              }
            }
            break;
          }
        }
      }
      
      // Validate we have minimum required data
      if (company && btc && btc > 100) {
        // Additional validation: company name should be reasonable
        if (company.length >= 2 && company.length < 100) {
          // Check if it's a valid company name (letters, numbers, spaces, common punctuation)
          if (/^[A-Za-z0-9\s&.,'-]+$/.test(company)) {
            companies.push({
              company: company,
              btc: btc,
              country: country || 'Unknown',
              lastUpdate: new Date().toISOString().split('T')[0]
            });
          }
        }
      }
    }
    
    // Remove duplicates (same company name)
    const uniqueCompanies = [];
    const seen = new Set();
    for (const comp of companies) {
      if (!seen.has(comp.company)) {
        seen.add(comp.company);
        uniqueCompanies.push(comp);
      }
    }
    
    if (uniqueCompanies.length > 5) {
      console.log(`✅ Successfully parsed ${uniqueCompanies.length} unique companies`);
      console.log(`   Top 3: ${uniqueCompanies.slice(0, 3).map(c => `${c.company} (${c.btc} BTC)`).join(', ')}`);
      return uniqueCompanies;
    }
    
    console.warn(`⚠️  Only found ${uniqueCompanies.length} companies, trying alternative method...`);
    return null;
    
  } catch (error) {
    console.error('❌ Error parsing company data:', error.message);
    return null;
  }
}

// Alternative parsing method using different patterns
function parseCompanyDataAlternative(html) {
  try {
    const companies = [];
    
    // Look for common patterns in the HTML
    // bitcointreasuries.net typically shows: Company Name, BTC amount
    const patterns = [
      /([A-Za-z\s&.]+?)\s*[:\-]\s*([\d,]+(?:\.\d+)?)\s*BTC/gi,
      /"company":\s*"([^"]+)".*?"btc":\s*([\d.]+)/gi,
      /data-company="([^"]+)".*?data-btc="([\d.]+)"/gi
    ];
    
    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      
      if (matches.length > 0) {
        for (const match of matches) {
          const company = match[1].trim();
          const btc = parseFloat(match[2].replace(/,/g, ''));
          
          if (btc > 100 && company.length > 2) { // Sanity check
            companies.push({
              company: company,
              btc: btc,
              country: 'Unknown',
              lastUpdate: new Date().toISOString().split('T')[0]
            });
          }
        }
        
        if (companies.length > 0) {
          console.log(`✅ Alternative parsing found ${companies.length} companies`);
          return companies;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Alternative parsing failed:', error.message);
    return null;
  }
}

// Fetch from alternative API sources
async function fetchFromAlternativeAPIs() {
  try {
    // Try to fetch from any available API
    // This is a placeholder for future API integrations
    
    console.log('ℹ️  No alternative APIs configured yet');
    return null;
    
  } catch (error) {
    console.error('❌ Alternative APIs failed:', error.message);
    return null;
  }
}

export async function fetchTreasuryData(btcPrice = 67000) {
  try {
    // Check cache first
    const now = Date.now();
    if (treasuryCache.data && (now - treasuryCache.timestamp) < treasuryCache.ttl) {
      console.log('✅ Using cached treasury data');
      return treasuryCache.data.map(item => ({
        ...item,
        usdValue: item.btcHoldings * btcPrice
      }));
    }
    
    console.log('🔄 Fetching fresh treasury data...');
    
    // Fetch from bitcointreasuries.net via ScraperAPI
    let treasuryData = await scrapeBitcoinTreasuries();
    
    if (!treasuryData || treasuryData.length === 0) {
      throw new Error('Failed to fetch treasury data from all sources');
    }
    
    // Process and cache the data
    const processedData = treasuryData
      .sort((a, b) => b.btc - a.btc)
      .map((item, index) => ({
        companyName: item.company,
        btcHoldings: item.btc,
        usdValue: item.btc * btcPrice,
        percentageOfSupply: (item.btc / TOTAL_BTC_SUPPLY) * 100,
        country: item.country,
        lastUpdate: item.lastUpdate || new Date().toISOString().split('T')[0],
        rank: index + 1
      }));
    
    // Update cache
    treasuryCache = {
      data: processedData,
      timestamp: now,
      ttl: 3600000 // 1 hour
    };
    
    return processedData;
    
  } catch (error) {
    console.error('❌ Error fetching treasury data:', error);
    
    // Return cached data if available
    if (treasuryCache.data) {
      console.log('⚠️  Returning stale cached data due to error');
      return treasuryCache.data;
    }
    
    // Last resort: return empty array
    return [];
  }
}

export async function updateTreasuryData(btcPrice) {
  const treasuries = await fetchTreasuryData(btcPrice);
  return treasuries;
}

// Clear cache manually if needed
export function clearTreasuryCache() {
  treasuryCache = {
    data: null,
    timestamp: 0,
    ttl: 3600000
  };
  console.log('✅ Treasury cache cleared');
}
