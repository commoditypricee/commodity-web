const fs = require('fs');
const https = require('https');

// GitHub'ın kasasından şifreni çeker
const API_KEY = process.env.FMP_API_KEY; 
const symbols = "GC=F,SI=F,BZ=F,NG=F,HG=F";
const url = `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`;

// Mevcut data.json dosyanı okur
let rawdata = fs.readFileSync('data.json');
let marketData = JSON.parse(rawdata);

// FMP'den gerçek veriyi çeker
https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
        const apiResponse = JSON.parse(data);
        const symbolMap = { "GC=F": "GOLD", "SI=F": "SILVER", "BZ=F": "BRENT OIL", "NG=F": "NATURAL GAS", "HG=F": "COPPER" };

        apiResponse.forEach(liveData => {
            const itemName = symbolMap[liveData.symbol];
            const item = marketData.find(i => i.name === itemName);
            
            if(item) {
                item.price = liveData.price;
                item.changePercent = liveData.changesPercentage.toFixed(2);
                
                const now = new Date().getTime();
                if(!item.intraday) item.intraday = [];
                
                // Yeni fiyatı grafiğe ekler
                item.intraday.push({ x: now, y: liveData.price });
                
                // Dosya şişmesin diye sadece son 500 veriyi tutar
                if(item.intraday.length > 500) item.intraday.shift(); 
            }
        });

        // Güncel veriyi data.json dosyasına geri yazar ve kaydeder
        fs.writeFileSync('data.json', JSON.stringify(marketData, null, 2));
        console.log("Piyasa verileri başarıyla güncellendi!");
    });
}).on("error", (err) => {
    console.log("Hata oluştu: " + err.message);
});
