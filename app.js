function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

let mainApexChart = null; 
let currentItemHistory = []; 
let currentSymbolName = 'GOLD'; 
let globalMarketData = []; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
    
    // BUTONLARA TIKLAMA (DÜZELTİLDİ: e.target yerine direkt btn kullanıldı)
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Önce tüm aktif sınıfları temizle
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            // Tıklanan butona aktif sınıfını ekle (e.target yerine btn kullandık ki içindeki yazıya tıklasan bile butonu baz alsın)
            btn.classList.add('active');
            
            const days = parseInt(btn.getAttribute('data-days'));
            const text = btn.textContent;
            
            console.log(`[TEST] Butona tıklandı. Süre: ${text}, Gün Sayısı: ${days}`);
            
            if (isNaN(days)) {
                console.error("[HATA] Gün sayısı (data-days) okunamadı! HTML dosyasındaki data-days özelliğini kontrol et.");
                return;
            }

            applyTimeFilter(days, text);
            updateCardPercentages(days); 
        });
    });
});

function updateCardPercentages(days) {
    if (!globalMarketData || globalMarketData.length === 0) {
        console.warn("[TEST] globalMarketData boş, kartlar güncellenemiyor.");
        return;
    }

    console.log(`[TEST] Yüzdeler ${days} gün öncesine göre hesaplanıyor...`);

    globalMarketData.forEach(item => {
        const cardBadge = document.querySelector(`.card[data-name="${item.name}"] .badge`);
        if (!cardBadge) return;

        let changePercent = 0;
        
        if (item.history && item.history.length > 0) {
            const lastData = item.history[item.history.length - 1];
            const currentPrice = lastData.y;
            const lastDate = lastData.x;
            const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

            const filteredData = item.history.filter(h => h.x >= cutoffDate);
            
            if (filteredData.length > 0) {
                 const startPrice = filteredData[0].y;
                 changePercent = ((currentPrice - startPrice) / startPrice) * 100;
                 console.log(`[TEST] ${item.name} | Eski Fiyat: ${startPrice}, Yeni Fiyat: ${currentPrice}, Değişim: %${changePercent.toFixed(2)}`);
            } else {
                 changePercent = parseFloat(item.changePercent); 
            }
        } else {
             changePercent = parseFloat(item.changePercent);
        }

        const isPositive = changePercent >= 0;
        const colorClass = isPositive ? 'positive' : 'negative';
        const sign = isPositive ? '+' : '';

        // Eski classları temizleyip sadece ilgili classları veriyoruz
        cardBadge.className = `badge ${colorClass}`;
        cardBadge.textContent = `${sign}${changePercent.toFixed(2)}%`;
    });
}

function applyTimeFilter(days, timeframeText) {
    if (!mainApexChart || currentItemHistory.length === 0) return;

    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

    const filteredData = currentItemHistory.filter(item => item.x >= cutoffDate);
    
    if(filteredData.length === 0) return;

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    mainApexChart.updateSeries([{ data: filteredData }]);
    
    mainApexChart.updateOptions({
        yaxis: {
            min: minPrice - (minPrice * 0.005),
            max: maxPrice + (maxPrice * 0.005)
        }
    });

    document.getElementById('chart-title').textContent = `${currentSymbolName.toUpperCase()} (${timeframeText})`;
}

function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentSymbolName = item.name;
    
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 30;
    const btnText = activeBtn ? activeBtn.textContent : '1 Month';

    document.getElementById('chart-title').textContent = `${item.name.toUpperCase()} (${btnText})`;

    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);
    const filteredData = currentItemHistory.filter(h => h.x >= cutoffDate);

    if(filteredData.length === 0) return;

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
            animations: { enabled: true, easing: 'easeinout', speed: 400 } 
        },
        colors: ['#3b82f6'], 
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
            min: minPrice - (minPrice * 0.005),
            max: maxPrice + (maxPrice * 0.005),
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
        
        globalMarketData = data; 
        container.innerHTML = ''; 

        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('data-name', item.name); 
            
            if (isFirstLoad && index === 0) {
                setTimeout(() => loadCustomApexChart(item), 100);
            }

            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';

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

        const activeBtn = document.querySelector('.time-btn.active');
        const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 30; 
        updateCardPercentages(days);

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}
