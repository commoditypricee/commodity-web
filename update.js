const fs = require('fs');

async function updateData() {
    try {
        // Dinamik import ile kütüphaneyi en güvenli şekilde çağırıyoruz
        const yf = await import('yahoo-finance2');
        // Kütüphanenin yapısına göre doğru fonksiyonu yakalıyoruz
        const yahooFinance = yf.default.quote ? yf.default : yf;

        // Sorun çıkaran setGlobalConfig satırını tamamen sildik!
        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        
        // Verileri çekiyoruz
        const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym)));
        
        const data = quotes.map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: (q.regularMarketPrice || 0).toFixed(2),
            changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
        }));

        // Gelen veriyi 'data.json' dosyasına kaydediyoruz
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("Veriler başarıyla çekildi ve data.json dosyasına yazıldı!");
        
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        // GitHub'a "Görev BAŞARISIZ oldu, yeşil tik VERME" diyoruz!
        process.exit(1); 
    }
}

updateData();
