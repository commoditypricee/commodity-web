const fs = require('fs');
const https = require('https');

function getYahooData(symbol) {
    return new Promise((resolve, reject) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y`;
        
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

async function updateData() {
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    const customNames = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'BZ=F': 'Brent Oil', 'NG=F': 'Natural Gas' };
    const finalData = [];

    for (const sym of symbols) {
        try {
            const rawData = await getYahooData(sym);
            const result = rawData.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            const history = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (closes[i] !== null && closes[i] !== undefined) {
                    history.push({
                        x: timestamps[i] * 1000, 
                        y: parseFloat(closes[i].toFixed(2))
                    });
                }
            }

            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose; 
            const effectivePrevClose = previousClose || (history.length > 1 ? history[history.length - 2].y : currentPrice);
            const changePercent = ((currentPrice - effectivePrevClose) / effectivePrevClose) * 100;

            finalData.push({
                symbol: sym,
                name: customNames[sym] || sym,
                price: currentPrice.toFixed(2),
                changePercent: changePercent.toFixed(2),
                history: history 
            });
            console.log(`[BAŞARILI] ${sym} çekildi.`);
        } catch (error) {
            console.error(`Hata ${sym}:`, error.message);
        }
    }

    if (finalData.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
        console.log("Kasa 5 yıllık verilerle doldu!");
    } else {
        process.exit(1); 
    }
}
updateData();
