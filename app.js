// --- YENİ NESİL SAAT KAPSÜLÜ ---
function updateClock() {
    const now = new Date();
    // Örn: "Mar 28 • 16:07" formatı (Çok daha estetik)
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${dateString} • ${timeString}`;
}

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData();
    setInterval(fetchMarketData, 60000); 
    setTimeout(() => loadTradingViewChart('GC=F'), 500);
});

const tvSymbols = {
    'GC=F': 'OANDA:XAUUSD',
    'SI=F': 'OANDA:XAGUSD',
    'HG=F': 'CAPITALCOM:COPPER',
    'BZ=F': 'OANDA:BCOUSD',
    'NG=F': 'OANDA:NATGASUSD'
};

const customNames = {
    'GC=F': 'Gold',
    'SI=F': 'Silver',
    'HG=F': 'Copper',
    'BZ=F': 'Brent Oil',
    'NG=F': 'Natural Gas'
};

function loadTradingViewChart(symbol) {
    const activeSymbol = tvSymbols[symbol] || 'OANDA:XAUUSD';
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; 

    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "autosize": true,
            "symbol": activeSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "2",
            "locale": "en",
            "enable_publishing": false,
            // Yeni ultra koyu arka plan rengimizle eşleştirdik
            "backgroundColor": "#0d0e12", 
            "gridColor": "#1a1d27",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    } else {
        container.innerHTML = '<p style="color:#8b92a5; text-align:center; padding-top:200px;">Chart is blocked by browser.</p>';
    }
}

async function fetchMarketData() {
    const container = document.getElementById('market-data');
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        container.innerHTML = ''; 

        data.forEach(item => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';
            const cleanName = customNames[item.symbol] || item.name;

            const card = document.createElement('div');
            card.className = 'card';
            
            // YENİ ASİMETRİK KART İÇERİĞİ
            card.innerHTML = `
                <div class="card-info">
                    <h2>${cleanName}</h2>
                    <div class="price">$${item.price}</div>
                </div>
                <div class="card-status">
                    <div class="badge ${colorClass}">${sign}${item.changePercent}%</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                // Menü efekti için tıklanınca çok hafif küçülme
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = 'translateX(-5px)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Data fetch error:", error);
    }
}
