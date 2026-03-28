const fs = require('fs');
const yahooFinance = require('yahoo-finance2').default;

async function updateData() {
    try {
        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        const customNames = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas' };
        const finalData = [];

        for (const sym of symbols) {
            try {
                // Sadece anlık fiyatı çekiyoruz, macera yok
                const quote = await yahooFinance.quote(sym);
                finalData.push({
                    symbol: sym,
                    name: customNames[sym] || sym,
                    price: quote.regularMarketPrice.toFixed(2),
                    changePercent: quote.regularMarketChangePercent.toFixed(2)
                });
                console.log(`${sym} başarıyla çekildi.`);
            } catch (e) {
                console.log(`${sym} hatası:`, e.message);
            }
        }
        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("ZAFER! data.json güncellendi.");
    } catch (error) {
        console.error("Genel Hata:", error);
        process.exit(1);
    }
}
updateData();
