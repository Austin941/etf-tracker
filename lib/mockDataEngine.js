// lib/mockDataEngine.js
import twseEtfs from '../data/twse_etfs.json';

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
  { ticker: '2337', name: '旺宏' },
  { ticker: '2379', name: '瑞昱' },
  { ticker: '3711', name: '日月光投控' },
  { ticker: '3037', name: '欣興' },
  { ticker: '2356', name: '英業達' }
];

export function getAllETFs() {
  return twseEtfs;
}

export function generateMockNetBuys(etfIds) {
  const results = [];
  const selectedETFs = twseEtfs.filter(etf => etfIds.includes(etf.id));

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
        etfType: etf.type,
        etfIssuer: etf.issuer
      });
    }
  });

  return results;
}
