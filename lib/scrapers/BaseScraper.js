// lib/scrapers/BaseScraper.js
export class BaseScraper {
  constructor(etfId, etfName) {
    this.etfId = etfId;
    this.etfName = etfName;
  }

  /**
   * Fetch today's holdings
   * @returns {Promise<Array<{ticker: string, name: string, shares: number}>>}
   */
  async fetchTodayHoldings() {
    throw new Error('Not implemented');
  }

  /**
   * Fetch yesterday's holdings
   * @returns {Promise<Array<{ticker: string, name: string, shares: number}>>}
   */
  async fetchYesterdayHoldings() {
    throw new Error('Not implemented');
  }

  /**
   * Calculate net buys
   * @returns {Promise<Array<{ticker: string, name: string, netBuys: number, etfId: string}>>}
   */
  async getNetBuys() {
    const today = await this.fetchTodayHoldings();
    const yesterday = await this.fetchYesterdayHoldings();

    const buyMap = new Map();

    today.forEach(stock => {
      buyMap.set(stock.ticker, {
        ticker: stock.ticker,
        name: stock.name,
        todayShares: stock.shares,
        yesterdayShares: 0
      });
    });

    yesterday.forEach(stock => {
      if (buyMap.has(stock.ticker)) {
        buyMap.get(stock.ticker).yesterdayShares = stock.shares;
      } else {
        buyMap.set(stock.ticker, {
          ticker: stock.ticker,
          name: stock.name,
          todayShares: 0,
          yesterdayShares: stock.shares
        });
      }
    });

    const netBuys = [];
    buyMap.forEach(data => {
      const net = data.todayShares - data.yesterdayShares;
      if (net > 0) {
        netBuys.push({
          ticker: data.ticker,
          name: data.name,
          netBuys: net,
          etfId: this.etfId
        });
      }
    });

    return netBuys.sort((a, b) => b.netBuys - a.netBuys);
  }
}
