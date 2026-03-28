// --- SAAT MOTURU ---
function updateClock() {
    const now = new Date();
    
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const clockEl = document.getElementById('digital-clock');
    if(clockEl) clockEl.textContent = timeString;
    
    const dateString = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const dateEl = document.getElementById('date');
    if(dateEl) dateEl.textContent = dateString.toUpperCase();
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
            // Grafik arka planını yeni tasarımımızın rengine uyumlu yaptık
            "backgroundColor": "#111827", 
            "gridColor": "#1F2937",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    } else {
        container.innerHTML = '<p style="color:#94A3B8; text-align:center; padding-top:200px;">Chart could not be loaded.</p>';
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
            
            // EMOJİLER SİLİNDİ, TERTEMİZ HTML
            card.innerHTML = `
                <h2>${cleanName}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                // Yeni tasarıma uygun çok hafif, şık bir tıklama efekti
                card.style.transform = 'translateY(2px)';
                setTimeout(() => card.style.transform = 'translateY(0)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Data fetch error:", error);
    }
}
