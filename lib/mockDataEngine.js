// lib/mockDataEngine.js
const MOCK_ETFS = [
  { id: '00999', name: '統一台灣新視野主動ETF (POC)', type: 'active' },
  { id: '00998', name: '群益科技高股息主動ETF', type: 'active' },
  { id: '00997', name: '野村動能主動ETF', type: 'active' },
  { id: '0050', name: '元大台灣50', type: 'passive' },
  { id: '0056', name: '元大高股息', type: 'passive' },
  { id: '00878', name: '國泰永續高股息', type: 'passive' },
  { id: '00929', name: '復華台灣科技優息', type: 'passive' },
];

const STOCKS = [
  { ticker: '2330', name: '台積電' },
  { ticker: '2317', name: '鴻海' },
  { ticker: '2454', name: '聯發科' },
  { ticker: '2382', name: '廣達' },
  { ticker: '3231', name: '緯創' },
  { ticker: '2881', name: '富邦金' },
  { ticker: '2891', name: '中信金' },
  { ticker: '2603', name: '長榮' },
  { ticker: '3034', name: '聯詠' },
  { ticker: '2308', name: '台達電' },
];

export function getAllETFs() {
  return MOCK_ETFS;
}

export function generateMockNetBuys(etfIds) {
  const results = [];
  const selectedETFs = MOCK_ETFS.filter(etf => etfIds.includes(etf.id));

  // If 00999 is selected, we could use POCActiveScraper, but for simple API unified logic:
  // we will handle POC scraper directly in the route, and use this for the others.
  
  selectedETFs.forEach(etf => {
    // Generate 3-5 random stock buys for this ETF
    const numBuys = Math.floor(Math.random() * 3) + 3;
    const shuffledStocks = [...STOCKS].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numBuys; i++) {
      const stock = shuffledStocks[i];
      // Generate realistic volume based on active/passive (passive buys more)
      const baseVolume = etf.type === 'passive' ? 500000 : 50000;
      const netBuys = Math.floor(Math.random() * baseVolume) + 10000;
      
      results.push({
        ticker: stock.ticker,
        name: stock.name,
        netBuys: netBuys,
        etfId: etf.id,
        etfName: etf.name,
        etfType: etf.type
      });
    }
  });

  return results;
}
