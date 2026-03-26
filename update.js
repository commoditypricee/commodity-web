const fs = require('fs');

async function updateData() {
    try {
        // Modülü sistemi şaşırtmayacak özel bir isimle içeri alıyoruz
        const yfPkg = await import('yahoo-finance2');
        
        let yahooFinance;

        // Kütüphanenin o gizli başlatıcısını her deliğe bakarak arıyoruz:
        if (yfPkg.YahooFinance && typeof yfPkg.YahooFinance === 'function') {
            yahooFinance = new yfPkg.YahooFinance(); // 1. İhtimal (v3 Standart)
        } else if (yfPkg.default && typeof yfPkg.default.YahooFinance === 'function') {
            yahooFinance = new yfPkg.default.YahooFinance(); // 2. İhtimal
        } else if (typeof yfPkg.default === 'function') {
            yahooFinance = new yfPkg.default(); // 3. İhtimal
        } else {
            // Eğer hiçbiri değilse kütüphane eski sürümdür (v2), doğrudan kullan
            yahooFinance = yfPkg.default || yfPkg;
        }

        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        
        // Verileri o ulaştığımız gerçek kütüphane ile çekiyoruz
        const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym)));
        
        const data = quotes.map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: (q.regularMarketPrice || 0).toFixed(2),
            changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
        }));

        // Gelen veriyi yazdırıyoruz
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("ZAFER! Kütüphane ehlileştirildi ve veriler data.json'a yazıldı.");
        
    } catch (error) {
        console.error("Hata Yakalandı:", error);
        process.exit(1); 
    }
}

updateData();
