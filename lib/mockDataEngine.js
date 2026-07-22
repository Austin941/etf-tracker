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
  { ticker: '2356', name: '英業達' },
  { ticker: '2303', name: '聯電' },
  { ticker: '2882', name: '國泰金' },
  { ticker: '2886', name: '兆豐金' },
  { ticker: '2884', name: '玉山金' },
  { ticker: '2892', name: '第一金' },
  { ticker: '2880', name: '華南金' },
  { ticker: '5880', name: '合庫金' },
  { ticker: '2883', name: '凱基金' },
  { ticker: '2887', name: '台新金' },
  { ticker: '2890', name: '永豐金' },
  { ticker: '2357', name: '華碩' },
  { ticker: '2376', name: '技嘉' },
  { ticker: '2377', name: '微星' },
  { ticker: '6669', name: '緯穎' },
  { ticker: '3661', name: '世芯-KY' },
  { ticker: '3443', name: '創意' },
  { ticker: '3017', name: '奇鋐' },
  { ticker: '6230', name: '尼克森' },
  { ticker: '2609', name: '陽明' },
  { ticker: '2615', name: '萬海' },
  { ticker: '2002', name: '中鋼' },
  { ticker: '1301', name: '台塑' },
  { ticker: '1303', name: '南亞' }
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

// Pseudo-random number generator for deterministic mock data
function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

export function getMockEtfHoldings(etfId) {
  const etf = twseEtfs.find(e => e.id === etfId);
  if (!etf) return null;

  // Use ETF ID to seed the random generator so data is deterministic for the same ETF
  const seed = stringToSeed(etfId);
  const rand = sfc32(seed, seed + 1, seed + 2, seed + 3);

  // Generate 30 holdings for complete ETF portfolio representation
  const numHoldings = Math.min(30, STOCKS.length);
  const shuffledStocks = [...STOCKS].sort(() => 0.5 - rand());
  const selectedHoldings = shuffledStocks.slice(0, numHoldings);

  // Generate realistic Zipf-like weights summing to 100%
  let rawWeights = selectedHoldings.map((_, idx) => Math.pow(numHoldings - idx, 1.5) + rand() * 2);
  const totalWeight = rawWeights.reduce((acc, val) => acc + val, 0);
  let weights = rawWeights.map(w => (w / totalWeight) * 100);

  const holdings = selectedHoldings.map((stock, idx) => {
    // Base current shares between 1,000 and 200,000 lots (張)
    const currentShares = Math.floor(rand() * 180000) + 2000;
    
    // Generate differences (-800 to +800 lots for 1 day, up to +/- 5000 for 10 days)
    const trend = rand() > 0.45 ? 1 : -1;
    
    return {
      ticker: stock.ticker,
      name: stock.name,
      weight: weights[idx].toFixed(2),
      currentShares: currentShares,
      diff1d: Math.floor(rand() * 1000 * trend) - (trend > 0 ? 100 : -100),
      diff3d: Math.floor(rand() * 2500 * trend) - (trend > 0 ? 300 : -300),
      diff5d: Math.floor(rand() * 4000 * trend) - (trend > 0 ? 500 : -500),
      diff10d: Math.floor(rand() * 7000 * trend) - (trend > 0 ? 1000 : -1000),
    };
  });

  // Sort by weight descending
  holdings.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));

  return {
    etfId: etf.id,
    name: etf.name,
    type: etf.type,
    issuer: etf.issuer,
    holdings: holdings
  };
}
