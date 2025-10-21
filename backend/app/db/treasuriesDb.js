import { getDb } from '../../db.js';

export function insertTreasury(companyName, btcHoldings, usdValue, percentageOfSupply, country) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO corporate_treasuries (company_name, btc_holdings, usd_value, percentage_of_supply, country, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(companyName, btcHoldings, usdValue, percentageOfSupply, country, Date.now());
}

export function getAllTreasuries() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM corporate_treasuries
    ORDER BY btc_holdings DESC
  `);
  return stmt.all();
}

export function getTopTreasuries(limit = 10) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM corporate_treasuries
    ORDER BY btc_holdings DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getTreasuryStats() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_companies,
      SUM(btc_holdings) as total_btc,
      SUM(usd_value) as total_usd_value,
      AVG(btc_holdings) as avg_holdings
    FROM corporate_treasuries
  `);
  return stmt.get();
}
