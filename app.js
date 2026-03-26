document.addEventListener("DOMContentLoaded", () => {
    fetchMarketData();
    setInterval(fetchMarketData, 60000); 
    
    // Sayfa ilk açıldığında varsayılan olarak Altın grafiğini yükle
    loadTradingViewChart('GC=F');
});

// Yahoo sembollerini TradingView sembollerine çeviren sözlüğümüz
const tvSymbols = {
    'GC=F': 'COMEX:GC1!', // Altın
    'SI=F': 'COMEX:SI1!', // Gümüş
    'HG=F': 'COMEX:HG1!', // Bakır
    'BZ=F': 'NYMEX:BZ1!', // Brent Petrol
    'NG=F': 'NYMEX:NG1!'  // Doğalgaz
};

// Grafiği ekrana çizen özel fonksiyon
function loadTradingViewChart(symbol) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // Eski grafiği temizle

    const activeSymbol = tvSymbols[symbol] || 'COMEX:GC1!';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => {
        new TradingView.widget({
            "autosize": true,
            "symbol": activeSymbol,
            "interval": "D", // Günlük grafik (İstersen "60" yapıp saatliğe çevirebilirsin)
            "timezone": "Europe/Istanbul",
            "theme": "dark",
            "style": "2", // 1: Mum grafik, 2: Çizgi grafik (Goldprice stili), 3: Alan grafiği
            "locale": "tr",
            "enable_publishing": false,
            "backgroundColor": "#1a1a1a",
            "gridColor": "#2c2c2c",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    };
    container.appendChild(script);
}

// Verileri çekme ve kartları oluşturma
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
            // Tıklanabilir efekti için cursor ekledik
            card.style.cursor = 'pointer'; 
            
            card.innerHTML = `
                <h2>${icon} ${item.name}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            
            // Karta tıklandığında üstteki grafiği o ürüne çevir!
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                
                // Tıklanan karta ufak bir parlama efekti verelim
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.transform = 'scale(1)', 150);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Veri okuma hatası:", error);
    }
}
