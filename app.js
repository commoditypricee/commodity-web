function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

let mainApexChart = null; 
let currentItemHistory = []; 
let currentSymbolName = 'GOLD'; 

// YENİ: Verileri globalde tutmak için eklendi (Kart yüzdelerini hesaplarken lazım olacak)
let globalMarketData = []; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
    
    // BUTONLARA TIKLAMA (Veri Kesme Mantığı)
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const days = parseInt(e.target.getAttribute('data-days'));
            const text = e.target.textContent;
            
            applyTimeFilter(days, text);
            updateCardPercentages(days); // YENİ: Grafikle beraber kartlardaki yüzdeleri de güncelle
        });
    });
});

// YENİ FONKSİYON: Kartlardaki yüzdeleri seçilen tarihe göre günceller
function updateCardPercentages(days) {
    if (!globalMarketData || globalMarketData.length === 0) return;

    globalMarketData.forEach(item => {
        // data-name özelliğine göre kartın içindeki yüzde badge'ini buluyoruz
        const cardBadge = document.querySelector(`.card[data-name="${item.name}"] .badge`);
        if (!cardBadge) return;

        let changePercent = 0;
        
        // Geçmiş veri varsa seçilen tarihe göre hesapla
        if (item.history && item.history.length > 0) {
            const lastData = item.history[item.history.length - 1];
            const currentPrice = lastData.y;
            const lastDate = lastData.x;
            const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

            // Seçilen tarihten sonraki ilk veriyi bul (Başlangıç fiyatımız)
            const filteredData = item.history.filter(h => h.x >= cutoffDate);
            
            if (filteredData.length > 0) {
                 const startPrice = filteredData[0].y;
                 changePercent = ((currentPrice - startPrice) / startPrice) * 100;
            } else {
                 changePercent = parseFloat(item.changePercent); 
            }
        } else {
             changePercent = parseFloat(item.changePercent);
        }

        const isPositive = changePercent >= 0;
        const colorClass = isPositive ? 'positive' : 'negative';
        const sign = isPositive ? '+' : '';

        // Badge sınıfını (renk için) ve metnini güncelle
        cardBadge.className = `badge ${colorClass}`;
        cardBadge.textContent = `${sign}${changePercent.toFixed(2)}%`;
    });
}

// VERİYİ BUTONA GÖRE KES VE YENİDEN ÇİZ
function applyTimeFilter(days, timeframeText) {
    if (!mainApexChart || currentItemHistory.length === 0) return;

    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

    const filteredData = currentItemHistory.filter(item => item.x >= cutoffDate);
