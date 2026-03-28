const fs = require('fs');
const https = require('https'); // Node.js'in kendi sağlam modülü

// Kendi yenilmez veri çekme motorumuzu yazıyoruz
function getYahooData(symbol) {
    return new Promise((resolve, reject) => {
        // Yahoo'dan 1 aylık günlük grafik verisini istiyoruz
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
        
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } // Tarayıcı taklidi
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP Hatası: ${res.statusCode}`));
                        return;
                    }
                    resolve(JSON.parse(data));
                } catch (e) { reject(e); }
            });
        }).on('error', (e) => reject(e));
    });
}

async function updateData() {
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    const customNames = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas' };
    const finalData = [];

    console.log("Saf veri çekimi başladı...");

    for (const sym of symbols) {
        console.log(`\n---> ${sym} için veri çekiliyor...`);
        try {
            // Sağlam motorumuzu çalıştırıyoruz
            const rawData = await getYahooData(sym);
            const result = rawData.chart.result[0];
            
            // Verileri ayıklıyoruz (meta, zamanlar, kapanışlar)
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            if (!timestamps || !closes) throw new Error("Geçmiş veri eksik.");

            // Grafiğin anlayacağı geçmiş 30 günlük veriyi inşa ediyoruz (x: zaman, y: fiyat)
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
            const previousClose = meta.chartPreviousClose; // Önceki kapanış
            
            // Eğer Yahoo previousClose vermezse, dünkü kapanışı kullan
            const effectivePrevClose = previousClose || (history.length > 1 ? history[history.length - 2].y : currentPrice);
            const changePercent = ((currentPrice - effectivePrevClose) / effectivePrevClose) * 100;

            finalData.push({
                symbol: sym,
                name: customNames[sym] || sym,
                price: currentPrice.toFixed(2),
                changePercent: changePercent.toFixed(2),
                history: history // İŞTE BU BİZİM ORİJİNAL GRAFİK VERİMİZ!
            });
            
            console.log(`[BAŞARILI] ${sym} - Fiyat: $${currentPrice}`);

        } catch (error) {
            console.error(`[HATA] ${sym} çekilemedi:`, error.message);
        }
    }

    // Kasa dolduysa kaydet, boşsa eskiyi koru
    if (finalData.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("\nZAFER! Proprietary data.json güncellendi.");
    } else {
        console.error("\nKRİTİK HATA: Hiçbir veri çekilemedi. Eski data.json korunuyor.");
        process.exit(1); 
    }
}

updateData();
