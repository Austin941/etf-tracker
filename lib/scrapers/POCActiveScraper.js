// lib/scrapers/POCActiveScraper.js
import { BaseScraper } from './BaseScraper';

/**
 * Proof of Concept: A real scraper that COULD fetch from a live URL.
 * For safety and to prevent blocking during POC, we simulate the fetch 
 * but structure it exactly how a real cheerio/fetch scraper would look.
 */
export class POCActiveScraper extends BaseScraper {
  constructor(etfId = '00999', etfName = '統一台灣新視野主動ETF (POC)') {
    super(etfId, etfName);
  }

  async fetchTodayHoldings() {
    // In reality: const res = await fetch('https://www.ezmoney.com.tw/...');
    // const html = await res.text();
    // parse HTML...
    
    console.log(`[Scraper] Fetching live data for ${this.etfName}...`);
    // Simulating the fetched result
    return [
      { ticker: '2330', name: '台積電', shares: 1500000 },
      { ticker: '2317', name: '鴻海', shares: 800000 },
      { ticker: '2454', name: '聯發科', shares: 50000 },
      { ticker: '3231', name: '緯創', shares: 450000 },
      { ticker: '2382', name: '廣達', shares: 320000 },
    ];
  }

  async fetchYesterdayHoldings() {
    // In reality: Fetch from database or historical CSV
    return [
      { ticker: '2330', name: '台積電', shares: 1450000 }, // Bought 50,000
      { ticker: '2317', name: '鴻海', shares: 820000 },    // Sold 20,000
      { ticker: '2454', name: '聯發科', shares: 45000 },   // Bought 5,000
      { ticker: '3231', name: '緯創', shares: 300000 },    // Bought 150,000
      { ticker: '2382', name: '廣達', shares: 320000 },    // No change
    ];
  }
}
