const fs = require('fs');

async function updateData() {
    try {
        // Yahoo Finance v3'ün tam olarak istediği başlatma şekli
        const module = await import('yahoo-finance2');
        const YahooFinance = module.YahooFinance || module.default.YahooFinance;
        
        // İşte hata mesajının bizden yalvararak istediği o satır!
        const yahooFinance = new YahooFinance();

        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        
        // Verileri çekiyoruz
        const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym)));
        
        const data = quotes.map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: (q.regularMarketPrice || 0).toFixed(2),
            changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
        }));

        // Gelen veriyi kaydediyoruz
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("ZAFER! Veriler başarıyla çekildi ve data.json dosyasına yazıldı.");
        
    } catch (error) {
        console.error("Hata Yakalandı:", error);
        process.exit(1); 
    }
}

updateData();
