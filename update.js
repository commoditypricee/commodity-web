const fs = require('fs');

async function updateData() {
    try {
        // Dinamik import ile kütüphaneyi ehlileştiriyoruz
        const yfPkg = await import('yahoo-finance2');
        let yahooFinance;
        if (yfPkg.YahooFinance && typeof yfPkg.YahooFinance === 'function') {
            yahooFinance = new yfPkg.YahooFinance();
        } else if (yfPkg.default && typeof yfPkg.default.YahooFinance === 'function') {
            yahooFinance = new yfPkg.default.YahooFinance();
        } else {
            yahooFinance = yfPkg.default || yfPkg;
        }

        const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
        // İngilizce sade isimler
        const customNames = {
            'GC=F': 'Gold',
            'SI=F': 'Silver',
            'HG=F': 'Copper',
            'BZ=F': 'Brent Oil',
            'NG=F': 'Natural Gas'
        };

        // Zamanı hesapla: Bugün ve 31 gün öncesi
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 31); 
        
        // Yahoo'ya geçmiş verileri çekmesi için tarihleri formatla (YYYY-MM-DD)
        const dateOptions = { period1: thirtyDaysAgo.toISOString().split('T')[0] };

        // Tüm emtialar için geçmiş verileri ve anlık fiyatı tek seferde çekiyoruz (FULL CHART)
        const finalData = await Promise.all(symbols.map(async (sym) => {
            try {
                // 'chart' fonksiyonu hem geçmişi hem anlık durumu verir (En stabil budur)
                const chartData = await yahooFinance.chart(sym, dateOptions);
                
                // Gelen karmaşık veriden sadece kapanış fiyatlarını ve tarihleri (timestamp) ayırıyoruz
                const history = chartData.quotes.map(q => ({
                    x: q.date.getTime(), // Grafiğin anlayacağı zaman formatı
                    y: parseFloat(q.close.toFixed(2)) // Kapanış fiyatı
                }));

                // Son çekilen güncel fiyat ve yüzdelik değişim
                const meta = chartData.meta;
                const price = meta.regularMarketPrice;
                const changePercent = meta.regularMarketChangePercent;

                return {
                    symbol: sym,
                    name: customNames[sym] || sym,
                    price: price.toFixed(2),
                    changePercent: changePercent.toFixed(2),
                    history: history // İŞTE BU BİZİM ORİJİNAL GRAFİK VERİMİZ!
                };
            } catch (err) {
                console.error(`Error fetching full data for ${sym}:`, err.message);
                return null; // Hata alan emtiayı null döndür
            }
        }));

        // Hata alanları (null olanları) temizle
        const filteredData = finalData.filter(item => item !== null);

        // Güçlendirilmiş veriyi 'data.json' dosyasına kaydet
        fs.writeFileSync('data.json', JSON.stringify(filteredData, null, 2));
        console.log("SUCCESS! proprietary data.json populated with history.");
        
    } catch (error) {
        console.error("Critical error in proprietary update:", error);
        process.exit(1); 
    }
}

updateData();
