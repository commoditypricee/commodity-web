document.addEventListener("DOMContentLoaded", () => {
    fetchMarketData();
    // Sayfayı açık tutanlar için her 1 dakikada bir güncel veriyi kontrol et
    setInterval(fetchMarketData, 60000); 
});

async function fetchMarketData() {
    const container = document.getElementById('market-data');
    try {
        // Artık sadece kendi GitHub dosyamızı okuyoruz! Çökme veya limit yok.
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
            card.innerHTML = `
                <h2>${icon} ${item.name}</h2>
                <div class="price">$${item.price}</div>
                <div class="change ${colorClass}">${sign}${item.changePercent}%</div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Veri okuma hatası:", error);
        container.innerHTML = '<div class="loading">Piyasa verileri güncelleniyor, lütfen saniyeler sonra tekrar deneyin...</div>';
    }
}
