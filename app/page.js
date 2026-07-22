'use client';
import { useState, useEffect, useMemo, useRef } from 'react';

export default function Home() {
  const [etfs, setEtfs] = useState([]);
  const [selectedEtfIds, setSelectedEtfIds] = useState(new Set());
  const [buys, setBuys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [viewingEtf, setViewingEtf] = useState(null);
  const [holdingsData, setHoldingsData] = useState(null);
  const [radarData, setRadarData] = useState({ additions: [], deletions: [] });
  const [sortKey, setSortKey] = useState('weight');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedStocks, setExpandedStocks] = useState(new Set());
  const selectorRef = useRef(null);

  // Click outside to collapse custom selector
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsSelectorOpen(false);
      }
    };
    if (isSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSelectorOpen]);

  // Fetch ETF list and radar data on mount
  useEffect(() => {
    fetch('/api/etfs')
      .then(res => res.json())
      .then(data => {
        setEtfs(data);
        // Initially select all
        setSelectedEtfIds(new Set(data.map(e => e.id)));
      })
      .catch(err => console.error(err));

    fetch('/api/rebalance-radar')
      .then(res => res.json())
      .then(data => setRadarData(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch buys whenever selectedEtfIds changes
  useEffect(() => {
    if (etfs.length === 0) return;
    
    if (selectedEtfIds.size === 0) {
      setBuys([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/etf-buys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etfIds: Array.from(selectedEtfIds) })
    })
      .then(res => res.json())
      .then(data => {
        setBuys(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedEtfIds, etfs]);

  // Group ETFs by issuer
  const etfsByIssuer = useMemo(() => {
    const grouped = {};
    etfs.forEach(etf => {
      if (!grouped[etf.issuer]) grouped[etf.issuer] = [];
      grouped[etf.issuer].push(etf);
    });
    return grouped;
  }, [etfs]);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const getEtfCategoryInfo = (type, category) => {
    if (type === 'active' && category === 'high_dividend') {
      return { label: '主動高股息', emoji: '🟡', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' };
    }
    if (type === 'active') {
      return { label: '主動一般', emoji: '🟣', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' };
    }
    if (category === 'high_dividend') {
      return { label: '被動高股息', emoji: '🟢', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981' };
    }
    return { label: '被動市值/一般', emoji: '🔵', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)', border: '#38bdf8' };
  };

  const getRebalanceText = (rebalanceMonths) => {
    if (!rebalanceMonths || rebalanceMonths.length === 0) {
      return '經理人機動';
    }
    return `${rebalanceMonths.join(', ')}月`;
  };

  const isRebalancingMonth = (rebalanceMonths) => {
    return Array.isArray(rebalanceMonths) && rebalanceMonths.includes(currentMonth);
  };

  const handleSelectPreset = (preset) => {
    if (preset === 'all') {
      setSelectedEtfIds(new Set(etfs.map(e => e.id)));
    } else if (preset === 'active_hd') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'active' && e.category === 'high_dividend').map(e => e.id)));
    } else if (preset === 'active_gen') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'active' && e.category !== 'high_dividend').map(e => e.id)));
    } else if (preset === 'passive_hd') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'passive' && e.category === 'high_dividend').map(e => e.id)));
    } else if (preset === 'passive_gen') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'passive' && e.category !== 'high_dividend').map(e => e.id)));
    } else if (preset === 'clear') {
      setSelectedEtfIds(new Set());
    }
  };

  const toggleEtf = (id) => {
    const newSet = new Set(selectedEtfIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEtfIds(newSet);
  };

  const toggleExpandStock = (ticker) => {
    const newSet = new Set(expandedStocks);
    if (newSet.has(ticker)) newSet.delete(ticker);
    else newSet.add(ticker);
    setExpandedStocks(newSet);
  };

  const handleViewEtf = async (id) => {
    setViewingEtf(id);
    setHoldingsData(null);
    setSortKey('weight');
    setSortOrder('desc');
    try {
      const res = await fetch(`/api/etf-holdings?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setHoldingsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedHoldings = useMemo(() => {
    if (!holdingsData || !holdingsData.holdings) return [];
    return [...holdingsData.holdings].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'weight') {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB, 'zh-TW') 
          : valB.localeCompare(valA, 'zh-TW');
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [holdingsData, sortKey, sortOrder]);

  return (
    <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>
          全市場 ETF 買賣追蹤網
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '8px' }}>
          即時追蹤主動與被動 ETF 經理人當日買進作多的股票
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', padding: '6px 16px', borderRadius: '20px', color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.9rem', border: '1px solid var(--surface-border)' }}>
          <span className="live-dot" />
          <span>即時連線監控中</span>
          <span style={{ color: 'var(--surface-border)' }}>|</span>
          <span>📅 {new Date().toLocaleDateString('zh-TW')}</span>
        </div>
      </header>

      {/* Filter Presets */}
      <section className="glass-panel animate-fade-in filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.1s' }}>
        <button 
          onClick={() => handleSelectPreset('all')}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: selectedEtfIds.size === etfs.length ? 'var(--accent-glow)' : 'transparent',
            color: selectedEtfIds.size === etfs.length ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          🌐 全選所有 ETF
        </button>
        <button 
          onClick={() => handleSelectPreset('active_hd')}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid #f59e0b',
            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          🟡 主動高股息
        </button>
        <button 
          onClick={() => handleSelectPreset('active_gen')}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid #a855f7',
            background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          🟣 主動一般
        </button>
        <button 
          onClick={() => handleSelectPreset('passive_hd')}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid #10b981',
            background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          🟢 被動高股息
        </button>
        <button 
          onClick={() => handleSelectPreset('passive_gen')}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid #38bdf8',
            background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          🔵 被動市值/一般
        </button>
        <button 
          onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: 'var(--surface-color)', color: '#fff',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s', marginLeft: 'auto'
          }}>
          {isSelectorOpen ? '收起詳細選單' : '展開自訂選擇器 ▼'}
        </button>
      </section>

      {/* Live Rebalance Additions & Deletions Radar Board */}
      <section className="glass-panel animate-fade-in" style={{ marginBottom: '32px', animationDelay: '0.15s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ ETF 換股風向球 (預計/正在納入與剔除股票)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              時時追蹤法人持股增減、成分股調整預測與即時建倉/出清進度
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
            🟢 實時連線比對中
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Additions Column */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h4 style={{ color: '#10b981', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📥 預計 / 正在納入股票 (加碼買進)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {radarData.additions.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{item.name}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.ticker}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>
                      目标 ETF: {item.etfId} {item.etfName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                      +{item.estVolume.toLocaleString()} 張
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', marginTop: '4px', display: 'inline-block' }}>
                      {item.status} ({item.confidence}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deletions Column */}
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h4 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📤 預計 / 正在剔除股票 (減碼賣出)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {radarData.deletions.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{item.name}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.ticker}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                      目标 ETF: {item.etfId} {item.etfName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>
                      -{item.estVolume.toLocaleString()} 張
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', marginTop: '4px', display: 'inline-block' }}>
                      {item.status} ({item.confidence}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {isSelectorOpen && (
        <section ref={selectorRef} className="glass-panel animate-fade-in" style={{ marginBottom: '32px', animationDelay: '0s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>依發行券商勾選</h3>
            <button onClick={() => handleSelectPreset('clear')} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>清除全部</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {Object.entries(etfsByIssuer).map(([issuer, issuerEtfs]) => (
              <div key={issuer} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <h4 style={{ color: 'var(--accent-color)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--surface-border)' }}>{issuer}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {issuerEtfs.map(etf => {
                    const catInfo = getEtfCategoryInfo(etf.type, etf.category);
                    const isRebalNow = isRebalancingMonth(etf.rebalanceMonths);
                    return (
                      <div key={etf.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={selectedEtfIds.has(etf.id)}
                            onChange={() => toggleEtf(etf.id)}
                            style={{ accentColor: catInfo.color }}
                          />
                          <span style={{ color: catInfo.color, fontWeight: 500 }}>
                            {catInfo.emoji} {etf.id} {etf.name}
                          </span>
                        </label>
                        
                        {isRebalNow && (
                          <span style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', background: '#ef4444', color: '#fff', fontWeight: 'bold' }}>
                            🚨換股月
                          </span>
                        )}

                        <button 
                          onClick={() => handleViewEtf(etf.id)}
                          style={{ 
                            background: 'rgba(255,255,255,0.05)', border: `1px solid ${catInfo.color}`, 
                            color: catInfo.color, borderRadius: '6px', cursor: 'pointer', 
                            padding: '2px 6px', fontSize: '0.7rem', fontWeight: 600
                          }}
                          title={`查看 ${etf.name} 持股明細 (預計換股: ${getRebalanceText(etf.rebalanceMonths)})`}
                        >
                          📊 明細
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Buys Board */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            計算資料中...
          </div>
        ) : buys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            請至少選擇一檔 ETF
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 🏆 Today's Champion Highlight Card */}
            <div className="glass-panel animate-fade-in" style={{ padding: '32px', border: '2px solid var(--accent-color)', background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', left: '-20px', fontSize: '120px', opacity: 0.05, transform: 'rotate(-15deg)' }}>🏆</div>
              <h3 style={{ color: 'var(--accent-color)', margin: '0 0 16px 0', fontSize: '1.2rem', letterSpacing: '2px' }}>🏆 今日 ETF 買入總冠軍</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '3.5rem', margin: 0, textShadow: '0 0 20px var(--accent-glow)' }}>{buys[0].name}</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>{buys[0].ticker}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '16px' }}>
                +{Math.round(buys[0].totalNetBuys / 1000).toLocaleString()} 張
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.9rem', marginBottom: '8px' }}>
                獲得 {buys[0].boughtBy.length} 檔 ETF 青睞買進：
              </p>
              <div className="badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {buys[0].boughtBy.map(b => {
                  const catInfo = getEtfCategoryInfo(b.etfType, b.etfCategory);
                  const isRebalNow = isRebalancingMonth(b.rebalanceMonths);
                  return (
                    <span 
                      key={b.etfId} 
                      onClick={() => handleViewEtf(b.etfId)}
                      style={{ 
                        fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px',
                        background: catInfo.bg, color: '#fff', border: `1px solid ${catInfo.border}`,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }} 
                      title={`${b.etfIssuer} ${b.etfName} | ${catInfo.label} | 預計換股: ${getRebalanceText(b.rebalanceMonths)}`}
                    >
                      {catInfo.emoji} {b.etfId} {b.etfName}
                      {isRebalNow && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🚨換股月</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            <h3 style={{ margin: '16px 0 0 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>📋 其他熱門買進排行</h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {buys.slice(1).map((buy, index) => (
                <div key={buy.ticker} className="glass-panel stock-row" style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                  <div className="stock-rank" style={{ width: '40px', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    #{index + 2}
                  </div>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{buy.name}</h2>
                    <span style={{ color: 'var(--text-secondary)' }}>{buy.ticker}</span>
                  </div>
                  
                  {/* Progress Bar for Volume */}
                  <div style={{ width: '100%', background: 'var(--surface-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min((buy.totalNetBuys / buys[0].totalNetBuys) * 100, 100)}%`,
                      background: 'var(--accent-color)',
                      boxShadow: '0 0 10px var(--accent-glow)'
                    }} />
                  </div>
                </div>

                <div className="stock-right-panel" style={{ marginLeft: '24px', textAlign: 'right', minWidth: '250px', maxWidth: '60%' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                    +{Math.round(buy.totalNetBuys / 1000).toLocaleString()} 張
                  </div>
                  
                  {/* ETF Badges with Expand / Collapse */}
                  <div className="badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(expandedStocks.has(buy.ticker) ? buy.boughtBy : buy.boughtBy.slice(0, 6)).map(b => {
                      const catInfo = getEtfCategoryInfo(b.etfType, b.etfCategory);
                      const isRebalNow = isRebalancingMonth(b.rebalanceMonths);
                      return (
                        <span 
                          key={b.etfId} 
                          onClick={() => handleViewEtf(b.etfId)}
                          style={{ 
                            fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px',
                            background: catInfo.bg, color: '#fff', border: `1px solid ${catInfo.border}`,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }} 
                          title={`${b.etfIssuer} ${b.etfName} | ${catInfo.label} | 預計換股: ${getRebalanceText(b.rebalanceMonths)}`}
                        >
                          {catInfo.emoji} {b.etfId} {b.etfName}
                          {isRebalNow && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🚨</span>}
                        </span>
                      );
                    })}

                    {buy.boughtBy.length > 6 && (
                      <button 
                        onClick={() => toggleExpandStock(buy.ticker)}
                        style={{
                          fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.1)', color: 'var(--accent-color)',
                          border: '1px solid var(--surface-border)', cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        {expandedStocks.has(buy.ticker) 
                          ? '收起 ▲' 
                          : `+${buy.boughtBy.length - 6} 檔 ETF ▼`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>

      {/* Holdings Modal */}
      {viewingEtf && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setViewingEtf(null)}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'var(--bg-color)', width: '100%', maxWidth: '900px', maxHeight: '90vh',
            overflowY: 'auto', borderRadius: '16px', padding: '32px', position: 'relative',
            border: '1px solid var(--surface-border)'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingEtf(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            
            {!holdingsData ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                載入持股資料中...
              </div>
            ) : (
              <div>
                {(() => {
                  const catInfo = getEtfCategoryInfo(holdingsData.type, holdingsData.category);
                  const isRebalNow = isRebalancingMonth(holdingsData.rebalanceMonths);
                  return (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '2rem', margin: 0, color: catInfo.color }}>
                          {holdingsData.name} ({holdingsData.etfId})
                        </h2>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                          background: catInfo.bg, color: catInfo.color, border: `1px solid ${catInfo.border}`
                        }}>
                          {catInfo.emoji} {catInfo.label}
                        </span>
                      </div>

                      <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>發行券商：<strong style={{ color: '#fff' }}>{holdingsData.issuer}</strong></span>
                        <span>📅 預計換股月份：<strong style={{ color: '#fff' }}>{getRebalanceText(holdingsData.rebalanceMonths)}</strong></span>
                        {isRebalNow && (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            🚨 本月預計進行持股調整 / 換股！
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ETF Specific Rebalance Additions & Deletions Cards */}
                    {(holdingsData.rebalanceAdditions || holdingsData.rebalanceDeletions) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.95rem' }}>📥 本期預計/正在納入成員</h4>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {holdingsData.rebalanceAdditions.map((item, idx) => (
                              <span key={idx} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.8rem' }}>
                                + {item.name} ({item.ticker}) <small style={{ color: 'var(--text-secondary)' }}>{item.status}</small>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontSize: '0.95rem' }}>📤 本期預計/正在剔除成員</h4>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {holdingsData.rebalanceDeletions.map((item, idx) => (
                              <span key={idx} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.8rem' }}>
                                - {item.name} ({item.ticker}) <small style={{ color: 'var(--text-secondary)' }}>{item.status}</small>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  );
                })()}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                        {[
                          { key: 'name', label: '股票名稱', align: 'left' },
                          { key: 'weight', label: '權重 (%)', align: 'right' },
                          { key: 'currentShares', label: '目前持股 (張)', align: 'right' },
                          { key: 'diff1d', label: '1日增減', align: 'right' },
                          { key: 'diff3d', label: '3日增減', align: 'right' },
                          { key: 'diff5d', label: '5日增減', align: 'right' },
                          { key: 'diff10d', label: '10日增減', align: 'right' },
                        ].map(col => (
                          <th 
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            style={{ 
                              padding: '12px', textAlign: col.align, cursor: 'pointer',
                              userSelect: 'none', color: sortKey === col.key ? 'var(--accent-color)' : 'var(--text-secondary)'
                            }}
                          >
                            {col.label} {sortKey === col.key ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHoldings.map(h => {
                        const renderDiff = (val) => {
                          if (val > 0) return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>+{val.toLocaleString()}</span>;
                          if (val < 0) return <span style={{ color: '#10b981', fontWeight: 'bold' }}>{val.toLocaleString()}</span>;
                          return <span style={{ color: 'var(--text-secondary)' }}>0</span>;
                        };
                        return (
                          <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px', textAlign: 'left' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{h.name}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{h.ticker}</span>
                            </td>
                            <td style={{ padding: '12px' }}>{h.weight}%</td>
                            <td style={{ padding: '12px' }}>{h.currentShares.toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{renderDiff(h.diff1d)}</td>
                            <td style={{ padding: '12px' }}>{renderDiff(h.diff3d)}</td>
                            <td style={{ padding: '12px' }}>{renderDiff(h.diff5d)}</td>
                            <td style={{ padding: '12px' }}>{renderDiff(h.diff10d)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
