// Sayfa yüklendiğinde her şeyi başlat
document.addEventListener("DOMContentLoaded", () => {
    fetchMarketData();
    setInterval(fetchMarketData, 60000); // Fiyatları 1 dkda bir güncelle
    
    // Grafiği 0.5s gecikmeli başlat (Kütüphane tam yüklensin)
    setTimeout(() => loadTradingViewChart('GC=F'), 500);
    
    // Dijital saati ve tarihi başlat!
    updateClock();
    setInterval(updateClock, 1000); // Saati her saniye güncelle
});

// PAYLAŞIMI ÜCRETSİZ VE STABİL OANDA SEMBOLLERİ (Çizelge Hatası Vermez!)
const tvSymbols = {
    'GC=F': 'OANDA:XAUUSD',       // Altın (Ons)
    'SI=F': 'OANDA:XAGUSD',       // Gümüş
    'HG=F': 'CAPITALCOM:COPPER',  // Bakır
    'BZ=F': 'OANDA:BCOUSD',       // Brent Petrol
    'NG=F': 'OANDA:NATGASUSD'     // Doğalgaz
};

// --- DİJİTAL SAAT VE TARİH FONKSİYONU ---
function updateClock() {
    const now = new Date();
    
    // Saati biçimlendir (HH:MM:SS)
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeString = now.toLocaleTimeString('tr-TR', timeOptions);
    document.getElementById('digital-clock').textContent = timeString;
    
    // Tarihi biçimlendir (DD MMM YYYY)
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const dateString = now.toLocaleDateString('tr-TR', dateOptions);
    document.getElementById('date').textContent = dateString;
}

// --- TRADINGVIEW GRAFİK YÜKLEME FONKSİYONU ---
function loadTradingViewChart(symbol) {
    const activeSymbol = tvSymbols[symbol] || 'OANDA:XAUUSD';
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // Eski grafiği temizle

    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "autosize": true,
            "symbol": activeSymbol,
            "interval": "D",
            "timezone": "Europe/Istanbul",
            "theme": "dark",
            "style": "2", // Mavi Çizgi Grafik (Premium Hissiyat)
            "locale": "tr",
            "enable_publishing": false,
            "backgroundColor": "#080808", // Sitenin yeni arka plan rengi
            "gridColor": "rgba(255, 255, 255, 0.03)",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });
    } else {
        container.innerHTML = '<p style="color:gray; text-align:center; padding-top:200px;">Grafik yüklenemedi. Lütfen AdBlockerı kapatıp sayfayı yenileyin.</p>';
    }
}

// --- FİYAT VERİLERİNİ ÇEKME VE KARTLARI OLUŞTURMA ---
async function fetchMarketData() {
    const container = document.getElementById('market-data');
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        container.innerHTML = ''; // Temizle
        const icons = { 'GC=F': '🥇', 'SI=F': '🥈', 'HG=F': '🥉', 'BZ=F': '🛢️', 'NG=F': '🔥' };

        data.forEach(item => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';
            const icon = icons[item.symbol] || '📊';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer'; 
            
            // Modernleştirilmiş Kart İçeriği (Yazı boyutları optimize edildi)
            card.innerHTML = `
                <h2>${icon} ${item.name}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            
            // Karta tıklandığında üstteki grafiği o ürüne çevir!
            card.addEventListener('click', () => {
                loadTradingViewChart(item.symbol);
                // Ufak bir tıklama efekti
                card.style.transform = 'scale(0.97)';
                setTimeout(() => card.style.transform = 'scale(1)', 100);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Veri okuma hatası:", error);
    }
}
