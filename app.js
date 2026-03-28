function updateClock() {
    const now = new Date();
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

// Paylaşımı ücretsiz, sorunsuz semboller
const tvSymbols = {
    'GC=F': 'OANDA:XAUUSD',
    'SI=F': 'OANDA:XAGUSD',
    'HG=F': 'CAPITALCOM:COPPER',
    'BZ=F': 'OANDA:BCOUSD',
    'NG=F': 'OANDA:NATGASUSD'
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
            "backgroundColor": "#0d0e12", 
            "gridColor": "#1a1d27",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    }
}

async function fetchMarketData() {
    const container = document.getElementById('market-data');
    try {
        // Her seferinde taze veri çek
        const response = await fetch('data.json?v=' + new Date().getTime());
        const data = await response.json();
        
        if (!data || data.length === 0) return;

        container.innerHTML = ''; 

        data.forEach(item => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';

            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-info">
                    <h2>${item.name}</h2>
                    <div class="price">$${item.price}</div>
                </div>
                <div class="card-status">
                    <div class="badge ${colorClass}">${sign}${item.changePercent}%</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = 'translateX(-5px)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}
