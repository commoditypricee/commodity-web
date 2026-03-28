// --- SAAT MOTURU ---
function updateClock() {
    const now = new Date();
    
    const timeString = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clockEl = document.getElementById('digital-clock');
    if(clockEl) clockEl.textContent = timeString;
    
    const dateString = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateEl = document.getElementById('date');
    if(dateEl) dateEl.textContent = dateString;
}

// Sayfa yüklendiğinde her şeyi başlat
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

// YAHOO'NUN KARMAŞIK İSİMLERİNİ TÜRKÇE VE SADE HALE GETİRİYORUZ
const customNames = {
    'GC=F': 'Altın (Ons)',
    'SI=F': 'Gümüş',
    'HG=F': 'Bakır',
    'BZ=F': 'Brent Petrol',
    'NG=F': 'Doğalgaz'
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
            "timezone": "Europe/Istanbul",
            "theme": "dark",
            "style": "2",
            "locale": "tr",
            "enable_publishing": false,
            "backgroundColor": "#080808",
            "gridColor": "rgba(255, 255, 255, 0.03)",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    } else {
        container.innerHTML = '<p style="color:gray; text-align:center; padding-top:200px;">Grafik yüklenemedi. Lütfen reklam engelleyiciyi kapatın.</p>';
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
            
            // BURASI YENİ: Eğer sözlükte karşılığı varsa temiz ismi kullan, yoksa Yahoo'dan geleni yaz.
            const cleanName = customNames[item.symbol] || item.name;

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer'; 
            
            card.innerHTML = `
                <h2>${icon} ${cleanName}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                card.style.transform = 'scale(0.97)';
                setTimeout(() => card.style.transform = 'scale(1)', 100);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Veri okuma hatası:", error);
    }
}
