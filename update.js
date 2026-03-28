const fs = require('fs');

async function updateData() {
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    const customNames = {
        'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper',
        'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas'
    };

    const finalData = [];

    // Kütüphane yok! Doğrudan Yahoo'nun API'sine bağlanıyoruz.
    for (const sym of symbols) {
        console.log(`\n---> ${sym} için veri çekiliyor...`);
        try {
            // Yahoo'dan 1 aylık günlük grafik verisini doğrudan istiyoruz
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1mo`;
            
            // Tarayıcı taklidi yaparak Yahoo'yu kandırıyoruz
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);
            
            const rawData = await response.json();
            const result = rawData.chart.result[0];
            
            // Verileri ayıklıyoruz
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            // Grafiğin anlayacağı geçmiş 30 günlük veriyi inşa ediyoruz
            const history = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (closes[i] !== null && closes[i] !== undefined) {
                    history.push({
                        x: timestamps[i] * 1000, // Milisaniyeye çeviriyoruz
                        y: parseFloat(closes[i].toFixed(2))
                    });
                }
            }

            // Anlık fiyat ve yüzdelik değişimi hesaplıyoruz
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose;
            const changePercent = ((currentPrice - previousClose) / previousClose) * 100;

            finalData.push({
                symbol: sym,
                name: customNames[sym] || sym,
                price: currentPrice.toFixed(2),
                changePercent: changePercent.toFixed(2),
                history: history
            });
            
            console.log(`[BAŞARILI] ${sym} - Fiyat: $${currentPrice}`);

        } catch (error) {
            console.error(`[HATA] ${sym} çekilemedi:`, error.message);
        }
    }

    // Eğer en az 1 tane bile veri çekebildiysek dosyayı kaydet
    if (finalData.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("\nZAFER! Veriler doğrudan Yahoo'nun kalbinden sökülüp alındı ve data.json dolduruldu.");
    } else {
        console.error("\nKRİTİK HATA: Hiçbir veri çekilemedi. Sistem durduruluyor.");
        process.exit(1);
    }
}

updateData();
