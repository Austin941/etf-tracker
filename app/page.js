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

  // Fetch ETF list on mount
  useEffect(() => {
    fetch('/api/etfs')
      .then(res => res.json())
      .then(data => {
        setEtfs(data);
        // Initially select all
        setSelectedEtfIds(new Set(data.map(e => e.id)));
      })
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

  const handleSelectPreset = (preset) => {
    if (preset === 'all') {
      setSelectedEtfIds(new Set(etfs.map(e => e.id)));
    } else if (preset === 'active') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'active').map(e => e.id)));
    } else if (preset === 'passive') {
      setSelectedEtfIds(new Set(etfs.filter(e => e.type === 'passive').map(e => e.id)));
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

  return (
    <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>
          全市場 ETF 買賣追蹤網
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '8px' }}>
          即時追蹤主動與被動 ETF 經理人當日買進作多的股票
        </p>
        <div style={{ display: 'inline-block', background: 'var(--surface-color)', padding: '6px 16px', borderRadius: '20px', color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.9rem', border: '1px solid var(--surface-border)' }}>
          📅 今日資料日期：{new Date().toLocaleDateString('zh-TW')}
        </div>
      </header>

      {/* Filter Presets */}
      <section className="glass-panel animate-fade-in filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'center', animationDelay: '0.1s' }}>
        <button 
          onClick={() => handleSelectPreset('all')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: selectedEtfIds.size === etfs.length ? 'var(--accent-glow)' : 'transparent',
            color: selectedEtfIds.size === etfs.length ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          全選所有 ETF
        </button>
        <button 
          onClick={() => handleSelectPreset('active')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: 'transparent', color: 'var(--active-color)', borderColor: 'var(--active-color)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          選取主動式
        </button>
        <button 
          onClick={() => handleSelectPreset('passive')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: 'transparent', color: 'var(--passive-color)', borderColor: 'var(--passive-color)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          選取被動式
        </button>
        <button 
          onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: 'var(--surface-color)', color: '#fff',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s', marginLeft: 'auto'
          }}>
          {isSelectorOpen ? '收起詳細選單' : '展開自訂選擇器 ▼'}
        </button>
      </section>

      {/* Advanced Selector */}
      {isSelectorOpen && (
        <section ref={selectorRef} className="glass-panel animate-fade-in" style={{ marginBottom: '32px', animationDelay: '0s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>依發行券商勾選</h3>
            <button onClick={() => handleSelectPreset('clear')} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>清除全部</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {Object.entries(etfsByIssuer).map(([issuer, issuerEtfs]) => (
              <div key={issuer} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <h4 style={{ color: 'var(--accent-color)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--surface-border)' }}>{issuer}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {issuerEtfs.map(etf => (
                    <div key={etf.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                        <input 
                          type="checkbox" 
                          checked={selectedEtfIds.has(etf.id)}
                          onChange={() => toggleEtf(etf.id)}
                          style={{ accentColor: etf.type === 'active' ? 'var(--active-color)' : 'var(--passive-color)' }}
                        />
                        <span style={{ color: etf.type === 'active' ? 'var(--active-color)' : 'var(--text-primary)' }}>
                          {etf.id} {etf.name} {etf.type === 'active' && '(主動)'}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleViewEtf(etf.id)}
                        style={{ 
                          background: 'rgba(56,189,248,0.15)', border: '1px solid var(--accent-color)', 
                          color: 'var(--accent-color)', borderRadius: '6px', cursor: 'pointer', 
                          padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600
                        }}
                        title="查看持股明細"
                      >
                        📊 明細
                      </button>
                    </div>
                  ))}
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
                {buys[0].boughtBy.map(b => (
                  <span 
                    key={b.etfId} 
                    onClick={() => handleViewEtf(b.etfId)}
                    style={{ 
                      fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px',
                      background: b.etfType === 'active' ? 'var(--active-glow)' : 'var(--passive-glow)',
                      color: '#fff', border: `1px solid ${b.etfType === 'active' ? 'var(--active-color)' : 'var(--passive-color)'}`,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }} 
                    title={`查看 ${b.etfIssuer} ${b.etfName} 持股明細`}
                  >
                    📊 {b.etfId} {b.etfName}
                  </span>
                ))}
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
                    {(expandedStocks.has(buy.ticker) ? buy.boughtBy : buy.boughtBy.slice(0, 6)).map(b => (
                      <span 
                        key={b.etfId} 
                        onClick={() => handleViewEtf(b.etfId)}
                        style={{ 
                          fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px',
                          background: b.etfType === 'active' ? 'var(--active-glow)' : 'var(--passive-glow)',
                          color: '#fff', border: `1px solid ${b.etfType === 'active' ? 'var(--active-color)' : 'var(--passive-color)'}`,
                          cursor: 'pointer'
                        }} 
                        title={`查看 ${b.etfIssuer} ${b.etfName} 持股明細`}
                      >
                        🔍 {b.etfId} {b.etfName}
                      </span>
                    ))}

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
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: holdingsData.type === 'active' ? 'var(--active-color)' : 'var(--passive-color)' }}>
                    {holdingsData.name} ({holdingsData.etfId})
                  </h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    發行券商：{holdingsData.issuer} | 類型：{holdingsData.type === 'active' ? '主動式' : '被動式'}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>股票名稱</th>
                        <th style={{ padding: '12px' }}>權重 (%)</th>
                        <th style={{ padding: '12px' }}>目前持股 (張)</th>
                        <th style={{ padding: '12px' }}>1日增減</th>
                        <th style={{ padding: '12px' }}>3日增減</th>
                        <th style={{ padding: '12px' }}>5日增減</th>
                        <th style={{ padding: '12px' }}>10日增減</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsData.holdings.map(h => {
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
