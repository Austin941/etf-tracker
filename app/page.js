'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [etfs, setEtfs] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'passive'
  const [buys, setBuys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch ETF list on mount
  useEffect(() => {
    fetch('/api/etfs')
      .then(res => res.json())
      .then(data => {
        setEtfs(data);
      })
      .catch(err => console.error(err));
  }, []);

  // Fetch buys whenever filter or ETF list changes
  useEffect(() => {
    if (etfs.length === 0) return;

    let targetEtfs = etfs;
    if (filter === 'active') targetEtfs = etfs.filter(e => e.type === 'active');
    if (filter === 'passive') targetEtfs = etfs.filter(e => e.type === 'passive');

    const etfIds = targetEtfs.map(e => e.id);

    setLoading(true);
    fetch('/api/etf-buys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etfIds })
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
  }, [filter, etfs]);

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

      {/* Filter Bar */}
      <section className="glass-panel animate-fade-in filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '32px', justifyContent: 'center', animationDelay: '0.1s' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: filter === 'all' ? 'var(--accent-glow)' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          全市場 ETF
        </button>
        <button 
          onClick={() => setFilter('active')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: filter === 'active' ? 'var(--active-glow)' : 'transparent',
            color: filter === 'active' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          主動式 ETF (Active)
        </button>
        <button 
          onClick={() => setFilter('passive')}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--surface-border)',
            background: filter === 'passive' ? 'var(--passive-glow)' : 'transparent',
            color: filter === 'passive' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}>
          被動式 ETF (Passive)
        </button>
      </section>

      {/* Top Buys Board */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            載入資料中...
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

                <div className="stock-right-panel" style={{ marginLeft: '24px', textAlign: 'right', minWidth: '150px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                    +{buy.totalNetBuys.toLocaleString()} 股
                  </div>
                  
                  {/* ETF Badges */}
                  <div className="badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {buy.boughtBy.map(b => (
                      <span key={b.etfId} style={{ 
                        fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px',
                        background: b.etfType === 'active' ? 'var(--active-glow)' : 'var(--passive-glow)',
                        color: '#fff', border: `1px solid ${b.etfType === 'active' ? 'var(--active-color)' : 'var(--passive-color)'}`
                      }}>
                        {b.etfName}
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
