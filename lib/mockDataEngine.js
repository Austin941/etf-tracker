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

const HIGH_DIVIDEND_KEYWORDS = /高息|高股息|優息|股利|收益|鑫收/;
const KNOWN_REBALANCE_MAP = {
  '0056': [6, 12],
  '00878': [5, 11],
  '00919': [5, 12],
  '00929': [6],
  '00940': [5, 11],
  '00713': [6, 12],
  '00939': [5],
  '00918': [6, 12],
  '00915': [6, 12],
  '00900': [4, 7, 12],
  '00934': [4, 9],
  '00936': [5, 11],
  '00944': [5, 11],
  '00946': [5, 11],
  '0050': [3, 6, 9, 12],
  '006208': [3, 6, 9, 12],
  '00400A': [6, 12],
  '00408A': [5, 11],
};

const enrichedEtfs = twseEtfs.map(etf => {
  const isHighDiv = KNOWN_REBALANCE_MAP[etf.id] ? (etf.id !== '0050' && etf.id !== '006208') : HIGH_DIVIDEND_KEYWORDS.test(etf.name);
  const category = isHighDiv ? 'high_dividend' : 'general';
  
  let rebalanceMonths = KNOWN_REBALANCE_MAP[etf.id];
  if (!rebalanceMonths) {
    if (etf.type === 'active') {
      rebalanceMonths = isHighDiv ? [6, 12] : [];
    } else {
      rebalanceMonths = isHighDiv ? [5, 11] : [3, 9];
    }
  }

  return {
    ...etf,
    category,
    rebalanceMonths
  };
});

export function getAllETFs() {
  return enrichedEtfs;
}

export function generateMockNetBuys(etfIds) {
  const results = [];
  const selectedETFs = enrichedEtfs.filter(etf => etfIds.includes(etf.id));
  const todayStr = new Date().toISOString().split('T')[0];

  selectedETFs.forEach(etf => {
    // Seed generator with etf.id and date for deterministic daily data
    const seed = stringToSeed(etf.id + todayStr);
    const rand = sfc32(seed, seed + 1, seed + 2, seed + 3);

    // Generate 3-5 deterministic stock buys for this ETF
    const numBuys = Math.floor(rand() * 3) + 3;
    const shuffledStocks = [...STOCKS].sort(() => 0.5 - rand());
    
    for (let i = 0; i < numBuys; i++) {
      const stock = shuffledStocks[i];
      // Generate realistic volume based on active/passive (passive buys more)
      const baseVolume = etf.type === 'passive' ? 500000 : 50000;
      const netBuys = Math.floor(rand() * baseVolume) + 10000;
      
      results.push({
        ticker: stock.ticker,
        name: stock.name,
        netBuys: netBuys,
        etfId: etf.id,
        etfName: etf.name,
        etfType: etf.type,
        etfCategory: etf.category,
        rebalanceMonths: etf.rebalanceMonths,
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
  const etf = enrichedEtfs.find(e => e.id === etfId);
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

  // Deterministically select 2 additions and 2 deletions for this ETF
  const addCandidates = STOCKS.filter(s => !selectedHoldings.some(h => h.ticker === s.ticker)).slice(0, 2);
  const delCandidates = selectedHoldings.slice(-2);

  const rebalanceAdditions = addCandidates.map(s => ({
    ticker: s.ticker,
    name: s.name,
    status: etf.type === 'active' ? '經理人建倉中' : (rand() > 0.5 ? '高機率納入' : '換股建倉中'),
    estVolume: Math.floor(rand() * 30000) + 5000,
    confidence: Math.floor(rand() * 15) + 85
  }));

  const rebalanceDeletions = delCandidates.map(s => ({
    ticker: s.ticker,
    name: s.name,
    status: etf.type === 'active' ? '經理人出清中' : (rand() > 0.5 ? '剔除候選' : '減碼出清中'),
    estVolume: Math.floor(rand() * 30000) + 5000,
    confidence: Math.floor(rand() * 15) + 85
  }));

  return {
    etfId: etf.id,
    name: etf.name,
    type: etf.type,
    category: etf.category,
    rebalanceMonths: etf.rebalanceMonths,
    issuer: etf.issuer,
    holdings: holdings,
    rebalanceAdditions: rebalanceAdditions,
    rebalanceDeletions: rebalanceDeletions
  };
}

export function getMockRebalancePredictions() {
  const additions = [
    { etfId: '00878', etfName: '國泰永續高股息', ticker: '2382', name: '廣達', status: '高機率納入', estVolume: 35000, confidence: 94 },
    { etfId: '0056', etfName: '元大高股息', ticker: '3231', name: '緯創', status: '建倉買進中', estVolume: 28000, confidence: 91 },
    { etfId: '00919', etfName: '群益台灣精選高息', ticker: '2881', name: '富邦金', status: '高機率納入', estVolume: 42000, confidence: 89 },
    { etfId: '00940', etfName: '元大台灣價值高息', ticker: '2379', name: '瑞昱', status: '建倉買進中', estVolume: 19000, confidence: 86 },
    { etfId: '00929', etfName: '復華台灣科技優息', ticker: '6669', name: '緯穎', status: '高機率納入', estVolume: 12000, confidence: 85 },
    { etfId: '00400A', etfName: '主動國泰動能高息', ticker: '2454', name: '聯發科', status: '經理人布局中', estVolume: 8500, confidence: 92 }
  ];

  const deletions = [
    { etfId: '00878', etfName: '國泰永續高股息', ticker: '2603', name: '長榮', status: '剔除候選', estVolume: 22000, confidence: 92 },
    { etfId: '0056', etfName: '元大高股息', ticker: '2002', name: '中鋼', status: '減碼出清中', estVolume: 45000, confidence: 88 },
    { etfId: '00919', etfName: '群益台灣精選高息', ticker: '2337', name: '旺宏', status: '剔除候選', estVolume: 18000, confidence: 87 },
    { etfId: '00940', etfName: '元大台灣價值高息', ticker: '1301', name: '台塑', status: '減碼出清中', estVolume: 31000, confidence: 84 },
    { etfId: '00929', etfName: '復華台灣科技優息', ticker: '2356', name: '英業達', status: '剔除候選', estVolume: 25000, confidence: 82 },
    { etfId: '00408A', etfName: '主動第一金優股息', ticker: '2886', name: '兆豐金', status: '經理人獲利了結', estVolume: 9600, confidence: 90 }
  ];

  return { additions, deletions };
}
