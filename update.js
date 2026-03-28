const fs = require('fs');
// Kütüphaneyi çağırmanın en sağlam ve klasik yolu
const yahooFinance = require('yahoo-finance2').default; 

async function updateData() {
    try {
        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        const customNames = {
            'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper',
            'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas'
        };

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const period1 = thirtyDaysAgo.toISOString().split('T')[0];

        console.log(`Veriler şu tarihten itibaren çekiliyor: ${period1}`);

        const finalData = [];

        // Her emtia için tek tek, sırayla ve güvenli bir şekilde işlem yapıyoruz
        for (const sym of symbols) {
            try {
                console.log(`\n---> ${sym} için veri çekiliyor...`);
                
                // 1. Anlık fiyatı çek
                const quoteData = await yahooFinance.quote(sym);
                console.log(`[BAŞARILI] ${sym} anlık fiyat alındı: $${quoteData.regularMarketPrice}`);

                // 2. Geçmiş 30 günün verisini çek
                const historyData = await yahooFinance.historical(sym, { period1: period1 });
                console.log(`[BAŞARILI] ${sym} geçmiş veri alındı: ${historyData.length} günlük veri`);

                const history = historyData.map(h => ({
                    x: h.date.getTime(),
                    y: parseFloat(h.close.toFixed(2))
                }));

                finalData.push({
                    symbol: sym,
                    name: customNames[sym] || sym,
                    price: quoteData.regularMarketPrice.toFixed(2),
                    changePercent: quoteData.regularMarketChangePercent.toFixed(2),
                    history: history
                });

            } catch (err) {
                console.error(`[HATA] ${sym} için veri çekilemedi:`, err.message);
                // Biri hata verse bile diğerleri çalışmaya devam etsin
            }
        }

        if (finalData.length === 0) {
            console.error("KRİTİK HATA: Hiçbir veri çekilemedi! finalData bomboş.");
            process.exit(1); // Görevi kırmızı çarpı ile bitir ki bilelim
        }

        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("\nZAFER! data.json dosyası dolu ve hazır.");
        
    } catch (error) {
        console.error("Sistem çöktü:", error);
        process.exit(1); 
    }
}

updateData();
