// --- SAAT KAPSÜLÜ ---
function updateClock() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${dateString} • ${timeString}`;
}

let mainApexChart = null; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
});

// --- APEXCHARTS: GOLDPRICE.ORG STANDARTLARI ---
function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    
    if (mainApexChart) {
        mainApexChart.destroy();
    }

    // 1. Zoom İçin Veri Analizi (En yüksek ve en düşük fiyatı bul)
    const prices = item.history.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Ufak bir pay bırakarak grafiği sadece o aralığa sıkıştır
    const yAxisMin = minPrice - (minPrice * 0.005); 
    const yAxisMax = maxPrice + (maxPrice * 0.005);

    // 2. Trend Rengi (Son 30 günde arttı mı azaldı mı?)
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isTrendPositive = lastPrice >= firstPrice;
    const chartColor = isTrendPositive ? '#10B981' : '#EF4444'; // Artış Yeşil, Düşüş Kırmızı

    const options = {
        series: [{
            name: item.name,
            data: item.history 
        }],
        chart: {
            type: 'area', 
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 400 }, 
        },
        colors: [chartColor], 
        // Keskin kırılımlar (gerçek piyasa verisi gibi)
        stroke: { curve: 'straight', width: 2 }, 
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.0, stops: [0, 100] }
        },
        dataLabels: { enabled: false }, 
        
        // BAŞLIK BİLGİLERİ
        title: {
            text: `${item.name.toUpperCase()} (30-DAY CHART)`,
            align: 'left',
            margin: 10,
            style: { fontSize: '12px', fontWeight: 600, color: '#64748b', letterSpacing: '1px' }
        },
        subtitle: {
            text: `$${item.price}`,
            align: 'left',
            margin: 25,
            style: { fontSize: '36px', fontWeight: 700, color: '#ffffff' }
        },

        // NİŞANGAH (Crosshairs) ÖZELLİĞİ
        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy' },
            y: { formatter: (value) => `$${value.toFixed(2)}` }
        },

        // ALT EKSEN (Tarihler ve Nişangah Etiketi)
        xaxis: {
            type: 'datetime',
            tooltip: {
                enabled: true, // Fareyle üzerine gelince tarihi vurgula
                formatter: function (val) {
                    return new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                }
            },
            labels: {
                style: { colors: '#64748b', fontSize: '12px', fontFamily: 'Outfit' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },

        // SAĞ EKSEN (Dinamik Fiyat Skalası ve Nişangah Etiketi)
        yaxis: {
            opposite: true, 
            min: yAxisMin, // Dümdüz çizgiyi önleyen kritik zoom ayarı
            max: yAxisMax,
            tooltip: {
                enabled: true // Fareyle üzerine gelince fiyatı vurgula
            },
            labels: {
                style: { colors: '#94a3b8', fontSize: '13px', fontFamily: 'Outfit', fontWeight: 500 },
                formatter: (value) => `$${value.toFixed(1)}`
            }
        },

        // KILAVUZ ÇİZGİLER (Tam bir hedef tahtası gibi)
        grid: {
            show: true,
            borderColor: '#1e293b',
            strokeDashArray: 3, 
            xaxis: { lines: { show: true } }, // Dikey kılavuz çizgileri açtık
            yaxis: { lines: { show: true } }, 
            padding: { top: 10, right: 0, bottom: 0, left: 10 }
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
        console.error("Data fetch error:", error);
    }
}
