// --- SAAT KAPSÜLÜ ---
function updateClock() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${dateString} • ${timeString}`;
}

// Grafik nesnesini globalde tutuyoruz ki tıklayınca yenileyebilelim
let mainApexChart = null; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Verileri çek ve ilk grafiği yükle
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); // Fiyatları 1 dkda bir güncelle
});

// --- APEXCHARTS: ORİJİNAL INDIGO ÇİZİM MOTORU ---
function loadCustomApexChart(historyData) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // Temizle

    // ApexCharts Konfigürasyonu (Ultra Modern & Neon Indigo)
    const options = {
        series: [{
            name: 'Price',
            data: historyData // data.json'dan gelen geçmiş veriler
        }],
        chart: {
            type: 'area', // Alan grafiği (Robinhood Tarzı)
            height: '100%',
            width: '100%',
            background: 'transparent',
            foreColor: '#8b92a5', // Yazı renkleri
            toolbar: { show: false }, // Gereksiz menüleri gizle
            animations: { enabled: true, easing: 'easeinout', speed: 500 },
            sparkline: { enabled: false }, // Sparkline değil tam grafik
        },
        // İndigo-Neon Efekti (Gradient)
        colors: ['#5b68df'], 
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        markers: { size: 0 },
        // Modern x-Ekseni (Zaman)
        xaxis: {
            type: 'datetime',
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { show: false } // x-ekseni yazılarını gizle (Minimalist)
        },
        // Modern y-Ekseni (Fiyat)
        yaxis: {
            show: false, // y-eksenini gizle
        },
        grid: {
            show: true,
            borderColor: '#1a1d27',
            strokeDashArray: 5,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }, // Yatay çizgileri gizle
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM' },
            y: { formatter: (value) => `$${value.toFixed(2)}` } // Tooltipte $ işareti
        }
    };

    // Grafiği oluştur ve çiz
    mainApexChart = new ApexCharts(container, options);
    mainApexChart.render();
}

async function fetchMarketData(isFirstLoad = false) {
    const container = document.getElementById('market-data');
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        container.innerHTML = ''; 

        data.forEach((item, index) => {
            const isPositive = parseFloat(item.changePercent) >= 0;
            const colorClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';

            const card = document.createElement('div');
            card.className = 'card';
            
            // Eğer ilk yüklemeyse ve ilk emtiaysa (Altın), grafiğini çiz
            if (isFirstLoad && index === 0) {
                loadCustomApexChart(item.history);
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
            
            // Karta tıklandığında kendi orijinal grafiğini çiz!
            card.addEventListener('click', () => {
                loadCustomApexChart(item.history); // TradingView yok, kendi motorumuzu çağırıyoruz!
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = 'translateX(-5px)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Proprietary data fetch error:", error);
    }
}
