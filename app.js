// --- SAAT KAPSÜLÜ ---
function updateClock() {
    const now = new Date();
    // Örn: "Mar 28 • 16:07" formatı
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
    
    // Verileri çek ve ilk grafiği (Gold) yükle
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); // Her dakika verileri tazele
});

// --- APEXCHARTS: ORİJİNAL INDIGO ÇİZİM MOTORU (İşte Bizim Grafik!) ---
function loadCustomApexChart(historyData) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // Eski grafiği temizle

    // ApexCharts Konfigürasyonu (Ultra Modern, Robinhood Tarzı)
    const options = {
        series: [{
            name: 'Price',
            data: historyData // data.json'dan gelen geçmiş veriler (x,y çiftleri)
        }],
        chart: {
            type: 'area', // Alan grafiği
            height: '100%',
            width: '100%',
            background: 'transparent', // Bento Box arka planını kullan
            foreColor: '#8b92a5', // Yazı renkleri (Buzlu Gri)
            toolbar: { show: false }, // Gereksiz menüleri gizle
            animations: { enabled: true, easing: 'easeinout', speed: 500 }, // Pürüzsüz geçişler
            sparkline: { enabled: false }, // Tam grafik modu
        },
        // İndigo-Neon Efekti (Bizim Renklerimiz)
        colors: ['#5b68df'], 
        stroke: { curve: 'smooth', width: 2 }, // Pürüzsüz kalın çizgi
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
        // Modern Minimalist Eksenler
        xaxis: {
            type: 'datetime',
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { show: false } // Minimalist görünüm için zaman etiketlerini gizle
        },
        yaxis: {
            show: false, // y-eksenini gizle
        },
        grid: {
            show: true,
            borderColor: '#1a1d27',
            strokeDashArray: 5, // Noktalı çizgiler
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }, // Sadece dikey çizgileri göster (Modern)
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
        // Tarayıcı önbelleğini kırmak için dinamik saat ekle
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
            
            // Eğer ilk yüklemeyse ve ilk emtiaysa (Altın), grafiğini çiz
            if (isFirstLoad && index === 0) {
                // ApexCharts kütüphanesinin tam yüklendiğinden emin olmak için 0.5s gecikme
                setTimeout(() => loadCustomApexChart(item.history), 100);
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
                loadCustomApexChart(item.history); 
                // Modern menü efekti
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = 'translateX(-5px)', 150);
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Proprietary data fetch error:", error);
    }
}
