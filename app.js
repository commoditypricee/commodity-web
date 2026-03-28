document.addEventListener("DOMContentLoaded", () => {
    fetchMarketData();
    setInterval(fetchMarketData, 60000); 
    
    // TradingView kütüphanesi hazır olsun diye yarım saniye gecikmeli başlatıyoruz
    setTimeout(() => loadTradingViewChart('GC=F'), 500);
});

// En sorunsuz TradingView sembolleri
const tvSymbols = {
    'GC=F': 'COMEX:GC1!', // Altın
    'SI=F': 'COMEX:SI1!', // Gümüş
    'HG=F': 'COMEX:HG1!', // Bakır
    'BZ=F': 'TVC:UKOIL',  // Brent Petrol (En stabil grafik)
    'NG=F': 'NYMEX:NG1!'  // Doğalgaz
};

function loadTradingViewChart(symbol) {
    const activeSymbol = tvSymbols[symbol] || 'COMEX:GC1!';
    
    // TradingView kütüphanesi gerçekten yüklendi mi diye kontrol ediyoruz
    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "autosize": true,
            "symbol": activeSymbol,
            "interval": "D",
            "timezone": "Europe/Istanbul",
            "theme": "dark",
            "style": "2",
            "locale": "tr",
            "enable_publishing": false,
            "backgroundColor": "#121212",
            "gridColor": "#2c2c2c",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    } else {
        // Eğer reklam engelleyici TradingView'u engellediyse kullanıcıyı uyarıyoruz
        document.getElementById('chart-container').innerHTML = 
            '<p style="color:gray; text-align:center; padding-top:200px;">Grafik yüklenemedi. Lütfen reklam engelleyicinizi (AdBlock) kapatıp sayfayı yenileyin.</p>';
    }
}

async function fetchMarketData() {
    const container = document.getElementById('market-data');
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        container.innerHTML = ''; 
        const icons = { 'GC=F': '🥇', 'SI=F': '🥈', 'HG=F': '🥉', 'BZ=F': '🛢️', 'NG=F': '🔥' };

        data.forEach(item => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';
            const icon = icons[item.symbol] || '📊';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer'; 
            
            card.innerHTML = `
                <h2>${icon} ${item.name}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.transform = 'scale(1)', 150);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Veri okuma hatası:", error);
    }
}
