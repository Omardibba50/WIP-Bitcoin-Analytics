import { getAllTreasuries, getTopTreasuries, getTreasuryStats, insertTreasury } from '../db/treasuriesDb.js';
import { fetchTreasuryData } from '../services/treasuryService.js';
import { getLatestPrice } from '../db/pricesDb.js';

export async function getAll(req, res) {
  try {
    let treasuries = getAllTreasuries();
    
    // If no data, fetch and populate
    if (!treasuries || treasuries.length === 0) {
      const priceData = getLatestPrice('BTC');
      const btcPrice = priceData?.price || 65000;
      
      const freshData = await fetchTreasuryData(btcPrice);
      
      for (const treasury of freshData) {
        try {
          insertTreasury(
            treasury.companyName,
            treasury.btcHoldings,
            treasury.usdValue,
            treasury.percentageOfSupply,
            treasury.country
          );
        } catch (err) {
          console.error('Error inserting treasury:', err);
        }
      }
      
      treasuries = getAllTreasuries();
    }
    
    res.json({ data: treasuries });
  } catch (error) {
    console.error('Error in getAll:', error);
    res.status(500).json({ error: 'Failed to fetch treasuries' });
  }
}

export async function getTop(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const treasuries = getTopTreasuries(limit);
    res.json({ data: treasuries });
  } catch (error) {
    console.error('Error in getTop:', error);
    res.status(500).json({ error: 'Failed to fetch top treasuries' });
  }
}

export function getStats(req, res) {
  try {
    const stats = getTreasuryStats();
    res.json({ data: stats });
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
