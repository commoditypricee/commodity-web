const fs = require('fs');
const https = require('https');

function getYahooData(symbol, interval = '1d', range = '5y') {
    return new Promise((resolve, reject) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) return reject(new Error(`HTTP: ${res.statusCode}`));
                    resolve(JSON.parse(data));
                } catch (e) { reject(e); }
            });
        }).on('error', (e) => reject(e));
    });
}

function processYahooResult(result) {
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];
    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] !== null && closes[i] !== undefined) {
            history.push({
                x: timestamps[i] * 1000, 
                y: parseFloat(closes[i].toFixed(2))
            });
        }
    }
    return history;
}

async function updateData() {
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    const customNames = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas' };
    const finalData = [];

    for (const sym of symbols) {
        try {
            // 1. Günlük veriler (Uzun vade için)
            const rawDaily = await getYahooData(sym, '1d', '5y');
            const dailyResult = rawDaily.chart.result[0];
            const history = processYahooResult(dailyResult);

            // 2. Gün içi (Intraday) 5 dakikalık veriler (1 Day butonu için)
            const rawIntraday = await getYahooData(sym, '5m', '1d');
            const intradayResult = rawIntraday.chart.result[0];
            const intraday = processYahooResult(intradayResult);

            const meta = dailyResult.meta;
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose; 
            const effectivePrevClose = previousClose || (history.length > 1 ? history[history.length - 2].y : currentPrice);
            const changePercent = ((currentPrice - effectivePrevClose) / effectivePrevClose) * 100;

            finalData.push({
                symbol: sym,
                name: customNames[sym] || sym,
                price: currentPrice.toFixed(2),
                changePercent: changePercent.toFixed(2),
                history: history,       // 5 yıllık günlük veri
                intraday: intraday      // 1 günlük dakikalık veri
            });
            console.log(`[BAŞARILI] ${sym} çekildi (Günlük ve Intraday).`);
        } catch (error) {
            console.error(`Hata ${sym}:`, error.message);
        }
    }

    if (finalData.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("Kasa güncellendi! (Dakikalık saat verileri eklendi)");
    } else {
        process.exit(1); 
    }
}
updateData();
