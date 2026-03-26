const fs = require('fs');
const yahooFinance = require('yahoo-finance2').default;

async function updateData() {
    try {
        yahooFinance.setGlobalConfig({ validation: { logErrors: false } });
        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        
        // Verileri usulca çekiyoruz
        const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym)));
        
        const data = quotes.map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: (q.regularMarketPrice || 0).toFixed(2),
            changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
        }));

        // Gelen veriyi 'data.json' adında bir dosyaya kaydediyoruz
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("Veriler başarıyla çekildi ve data.json dosyasına yazıldı!");
    } catch (error) {
        console.error("Veri çekme hatası:", error.message);
    }
}

updateData();
