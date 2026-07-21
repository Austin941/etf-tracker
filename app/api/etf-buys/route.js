import { NextResponse } from 'next/server';
import { generateMockNetBuys, getAllETFs } from '@/lib/mockDataEngine';
import { POCActiveScraper } from '@/lib/scrapers/POCActiveScraper';

export async function POST(request) {
  try {
    const { etfIds } = await request.json();
    
    if (!etfIds || !Array.isArray(etfIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let allBuys = [];

    // 1. Check if POC ETF (00999) is in the requested list
    if (etfIds.includes('00999')) {
      const pocScraper = new POCActiveScraper();
      const pocBuys = await pocScraper.getNetBuys();
      // Map it to the unified format
      const formattedPocBuys = pocBuys.map(buy => ({
        ...buy,
        etfName: pocScraper.etfName,
        etfType: 'active'
      }));
      allBuys = [...allBuys, ...formattedPocBuys];
    }

    // 2. Get mock data for the rest of the ETFs
    const otherEtfIds = etfIds.filter(id => id !== '00999');
    if (otherEtfIds.length > 0) {
      const mockBuys = generateMockNetBuys(otherEtfIds);
      allBuys = [...allBuys, ...mockBuys];
    }

    // 3. Aggregate buys by stock (if multiple ETFs buy the same stock)
    const aggregatedMap = new Map();
    allBuys.forEach(buy => {
      if (aggregatedMap.has(buy.ticker)) {
        const existing = aggregatedMap.get(buy.ticker);
        existing.totalNetBuys += buy.netBuys;
        existing.boughtBy.push({
          etfId: buy.etfId,
          etfName: buy.etfName,
          etfType: buy.etfType,
          volume: buy.netBuys
        });
      } else {
        aggregatedMap.set(buy.ticker, {
          ticker: buy.ticker,
          name: buy.name,
          totalNetBuys: buy.netBuys,
          boughtBy: [{
            etfId: buy.etfId,
            etfName: buy.etfName,
            etfType: buy.etfType,
            volume: buy.netBuys
          }]
        });
      }
    });

    // 4. Sort descending by total net buys
    const sortedResults = Array.from(aggregatedMap.values()).sort((a, b) => b.totalNetBuys - a.totalNetBuys);

    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
