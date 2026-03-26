document.addEventListener("DOMContentLoaded", () => {
    fetchMarketData();
    // Verileri her 60 saniyede bir otomatik yenile
    setInterval(fetchMarketData, 60000); 
});

async function fetchMarketData() {
    const container = document.getElementById('market-data');
    
    try {
        // Netlify'daki kendi özel API'mize bağlanıyoruz
        const response = await fetch('/.netlify/functions/api');
        const data = await response.json();
        
        container.innerHTML = ''; // Yükleniyor yazısını temizle

        // İkon eşleştirmeleri
        const icons = {
            'GC=F': '🥇', 'SI=F': '🥈', 'HG=F': '🥉', 'BZ=F': '🛢️', 'NG=F': '🔥'
        };

        // Gelen her emtia için ekranda şık bir kutu (card) oluştur
        data.forEach(item => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';
            const icon = icons[item.symbol] || '📊';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h2>${icon} ${item.name}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = '<div class="loading negative">Veriler alınırken bir bağlantı sorunu oluştu. Lütfen sayfayı yenileyin.</div>';
        console.error("Veri çekme hatası:", error);
    }
}