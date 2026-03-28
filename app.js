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

// --- APEXCHARTS: ORTAOKUL MATEMATİK STANDARDI (Sade Çizgi Grafiği) ---
function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    
    if (mainApexChart) {
        mainApexChart.destroy();
    }

    // Fiyat skalasını (sol eksen) daraltmak için en düşük ve yüksek değerleri buluyoruz
    const prices = item.history.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const yAxisMin = minPrice - (minPrice * 0.01); 
    const yAxisMax = maxPrice + (maxPrice * 0.01);

    const options = {
        series: [{
            name: 'Price',
            data: item.history 
        }],
        chart: {
            type: 'line', // İŞTE BU: Boyalı alan iptal, sadece klasik çizgi!
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 400 }, 
        },
        colors: ['#5b68df'], // Sabit, göz yormayan modern mavi çizgi
        
        // ÇİZGİ VE NOKTALAR (Kareli defterdeki gibi)
        stroke: { curve: 'straight', width: 3 }, 
        markers: {
            size: 4, // Her günün verisine küçük bir nokta koyuyoruz ki imleçle üstüne gelmek kolay olsun
            colors: ['#0d0e12'],
            strokeColors: '#5b68df',
            strokeWidth: 2,
            hover: { size: 7 } // İmleç üstüne gelince nokta büyüsün
        },
        
        dataLabels: { enabled: false }, // Ekranda kalabalık yapan sabit fiyat yazıları KAPALI

        // SADE BAŞLIK
        title: {
            text: `${item.name.toUpperCase()} (30 Days)`,
            align: 'center', // Başlığı tam ortaya aldık
            margin: 20,
            style: { fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '1px' }
        },

        // İMLEÇ (HOVER) KUTUCUĞU
        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy' }, // İmleç tarihin üstüne gelince
            y: { formatter: (value) => `$${value.toFixed(2)}` } // İmleç fiyatı göstersin
        },

        // YATAY EKSEN (Tarihler)
        xaxis: {
            type: 'datetime',
            labels: {
                style: { colors: '#94a3b8', fontSize: '12px', fontFamily: 'Outfit' }
            },
            axisBorder: { show: true, color: '#334155' }, // Alt eksen çizgisi belirgin
            axisTicks: { show: true, color: '#334155' },
            title: { text: 'DATES', style: { color: '#64748b', fontSize: '10px' } }
        },

        // DİKEY EKSEN (Fiyatlar - SOL TARAFTA)
        yaxis: {
            opposite: false, // Borsacı stilinden çıkıp, klasik sola aldık
            min: yAxisMin,
            max: yAxisMax,
            labels: {
                style: { colors: '#94a3b8', fontSize: '13px', fontFamily: 'Outfit' },
                formatter: (value) => `$${value.toFixed(1)}`
            },
            title: { text: 'PRICES', style: { color: '#64748b', fontSize: '10px' } }
        },

        // KARELİ DEFTER ÇİZGİLERİ
        grid: {
            show: true,
            borderColor: '#1e293b',
            strokeDashArray: 0, // Noktalı değil, düz kareli defter çizgisi
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
        console.error("Data fetch error:", error);
    }
}
