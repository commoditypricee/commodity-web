const fs = require('fs');

async function updateData() {
    try {
        const yfPkg = await import('yahoo-finance2');
        let yahooFinance = yfPkg.default || yfPkg;
        if (yfPkg.YahooFinance && typeof yfPkg.YahooFinance === 'function') {
            yahooFinance = new yfPkg.YahooFinance();
        } else if (yfPkg.default && typeof yfPkg.default.YahooFinance === 'function') {
            yahooFinance = new yfPkg.default.YahooFinance();
        }

        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        const customNames = {
            'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper',
            'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas'
        };

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 31);
        const period1 = thirtyDaysAgo.toISOString().split('T')[0];

        const finalData = await Promise.all(symbols.map(async (sym) => {
            try {
                // 1. Geçmiş 30 günün verisini çek (ApexCharts için)
                const historyData = await yahooFinance.historical(sym, { period1: period1 });
                const history = historyData.map(h => ({
                    x: h.date.getTime(),
                    y: parseFloat(h.close.toFixed(2))
                }));

                // 2. Anlık canlı fiyatı çek (Kartlar için)
                const quoteData = await yahooFinance.quote(sym);

                return {
                    symbol: sym,
                    name: customNames[sym] || sym,
                    price: quoteData.regularMarketPrice.toFixed(2),
                    changePercent: quoteData.regularMarketChangePercent.toFixed(2),
                    history: history
                };
            } catch (err) {
                console.error(`Error fetching data for ${sym}:`, err.message);
                return null;
            }
        }));

        const filteredData = finalData.filter(item => item !== null);
        fs.writeFileSync('data.json', JSON.stringify(filteredData, null, 2));
        console.log("SUCCESS! proprietary data.json populated with history.");
        
    } catch (error) {
        console.error("Critical error in update:", error);
        process.exit(1); 
    }
}

updateData();
