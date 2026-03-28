function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

let mainApexChart = null; 
let currentItemHistory = []; 
let currentSymbolName = 'GOLD'; // Başlık için isim hafızası

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
    
    // YENİ BUTON TIKLAMA OLAYI (Kusursuz Kesim Mantığı)
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Aktif butonu değiştir
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Kaç günlük veri istediğini ve buton ismini al
            const days = parseInt(e.target.getAttribute('data-days'));
            const text = e.target.textContent;
            
            applyTimeFilter(days, text);
        });
    });
});

// YENİ: VERİYİ GÜN SAYISINA GÖRE KESİP GRAFİĞİ GÜNCELLEME (Asla Çökmez)
function applyTimeFilter(days, timeframeText) {
    if (!mainApexChart || currentItemHistory.length === 0) return;

    // Hedeflenen tarihi bul
    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

    // İstenilen tarihten sonrasını kesip al
    const filteredData = currentItemHistory.filter(item => item.x >= cutoffDate);

    // Yeni çizim için en alt ve en üst fiyatı bul (Y eksenini ayarlamak için)
    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // 1. Grafiğin verisini güncelle (Animasyonlu)
    mainApexChart.updateSeries([{ data: filteredData }]);
    
    // 2. Grafiğin fiyat eksenini (Y ekseni) yeni verilere göre otomatik sıkıştır!
    mainApexChart.updateOptions({
        yaxis: {
            min: minPrice - (minPrice * 0.01),
            max: maxPrice + (maxPrice * 0.01)
        }
    });

    // 3. Başlığı güncelle (Örn: "GOLD (1 Month)")
    document.getElementById('chart-title').textContent = `${currentSymbolName.toUpperCase()} (${timeframeText})`;
}

// SADE, TEK RENK ÇİZGİ GRAFİĞİ BAŞLANGICI
function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentSymbolName = item.name;
    
    // İlk açılışta hangi buton aktifse ona göre veriyi kes (Örn: 1 Month -> 30 gün)
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 30;
    const btnText = activeBtn ? activeBtn.textContent : '1 Month';

    // Başlığı ekle
    document.getElementById('chart-title').textContent = `${item.name.toUpperCase()} (${btnText})`;

    // İlk veriyi kes
    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);
    const filteredData = currentItemHistory.filter(h => h.x >= cutoffDate);

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (mainApexChart) { mainApexChart.destroy(); }

    const options = {
        series: [{ name: 'Price', data: filteredData }],
        chart: {
            type: 'line',
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 400 } // Artık kasmadan animasyon yapabilir
        },
        colors: ['#3b82f6'], // Kraliyet Mavisi
        stroke: { curve: 'straight', width: 2 }, 
        
        markers: { size: 0, hover: { size: 6 } }, 
        dataLabels: { enabled: false }, 

        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy' }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` } 
        },

        xaxis: {
            type: 'datetime',
            labels: { style: { colors: '#94a3b8', fontSize: '12px', fontFamily: 'Outfit' } },
            axisBorder: { show: true, color: '#334155' }, 
            axisTicks: { show: true, color: '#334155' },
            tooltip: { enabled: false }
        },

        yaxis: {
            opposite: false, 
            min: minPrice - (minPrice * 0.01),
            max: maxPrice + (maxPrice * 0.01),
            labels: {
                style: { colors: '#94a3b8', fontSize: '13px', fontFamily: 'Outfit' },
                formatter: (value) => `$${value.toFixed(1)}`
            }
        },

        grid: {
            show: true,
            borderColor: '#1e293b',
            strokeDashArray: 0, 
            xaxis: { lines: { show: true } }, 
            yaxis: { lines: { show: true } }, 
            padding: { top: 10, right: 20, bottom: 0, left: 10 }
        }
    };

    mainApexChart = new ApexCharts(container, options);
    mainApexChart.render();
}

async function fetchMarketData(isFirstLoad = false) {
    const container = document.getElementById('market-data');
    try {
        const response = await fetch('data.json?v=' + new Date().getTime());
        const data = await response.json();
        
        if (!data || data.length === 0) return;
        container.innerHTML = ''; 

        data.forEach((item, index) => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';

            const card = document.createElement('div');
            card.className = 'card';
            
            if (isFirstLoad && index === 0) {
                setTimeout(() => loadCustomApexChart(item), 100);
            }

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
                loadCustomApexChart(item); 
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = 'translateX(-5px)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}
