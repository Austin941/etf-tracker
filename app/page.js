'use client';
import { useState, useEffect, useMemo } from 'react';

export default function Home() {
  const [etfs, setEtfs] = useState([]);
  const [selectedEtfIds, setSelectedEtfIds] = useState(new Set());
  const [buys, setBuys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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

  return (
    <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>
          全市場 ETF 買賣追蹤網
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          即時追蹤主動與被動 ETF 經理人當日買進作多的股票
        </p>
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
        <section className="glass-panel animate-fade-in" style={{ marginBottom: '32px', animationDelay: '0s' }}>
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
                    <label key={etf.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
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
          <div style={{ display: 'grid', gap: '16px' }}>
            {buys.map((buy, index) => (
              <div key={buy.ticker} className="glass-panel stock-row" style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                <div className="stock-rank" style={{ width: '40px', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  #{index + 1}
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

                <div className="stock-right-panel" style={{ marginLeft: '24px', textAlign: 'right', minWidth: '250px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                    +{buy.totalNetBuys.toLocaleString()} 股
                  </div>
                  
                  {/* ETF Badges */}
                  <div className="badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {buy.boughtBy.map(b => (
                      <span key={b.etfId} style={{ 
                        fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px',
                        background: b.etfType === 'active' ? 'var(--active-glow)' : 'var(--passive-glow)',
                        color: '#fff', border: `1px solid ${b.etfType === 'active' ? 'var(--active-color)' : 'var(--passive-color)'}`
                      }} title={b.etfIssuer}>
                        {b.etfId} {b.etfName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
