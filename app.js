function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

let mainApexChart = null; 
let currentItemHistory = []; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
    
    // BUTONLARA TIKLAMA OLAYI
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            zoomChart(e.target.getAttribute('data-range'));
        });
    });
});

// GRAFİĞİ ZAMAN BUTONLARINA GÖRE YAKINLAŞTIR
function zoomChart(range) {
    if (!mainApexChart || currentItemHistory.length === 0) return;

    // En son verinin tarihini "şimdi" kabul edelim (sağda boşluk kalmaması için)
    const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
    let minDate;

    switch(range) {
        case '1W': minDate = lastDate - (7 * 24 * 60 * 60 * 1000); break;
        case '1M': minDate = lastDate - (30 * 24 * 60 * 60 * 1000); break;
        case '3M': minDate = lastDate - (90 * 24 * 60 * 60 * 1000); break;
        case '6M': minDate = lastDate - (180 * 24 * 60 * 60 * 1000); break;
        case '1Y': minDate = lastDate - (365 * 24 * 60 * 60 * 1000); break;
        case '5Y': minDate = currentItemHistory[0].x; break; 
    }

    mainApexChart.zoomX(minDate, lastDate);
}

// SADE, TEK RENK ÇİZGİ GRAFİĞİ (Ortaokul Matematiği Mantığı)
function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    
    if (mainApexChart) { mainApexChart.destroy(); }

    const options = {
        series: [{ name: 'Price', data: item.history }],
        chart: {
            type: 'line', // SADECE ÇİZGİ
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: false }, // Zoom anında kasmasın diye kapalı
        },
        colors: ['#3b82f6'], // Kraliyet Mavisi
        stroke: { curve: 'straight', width: 2 }, 
        
        // EKRANDA SABİT RAKAM YOK, İMLEÇLE ÜSTÜNE GELİNCE GÖRÜNÜR
        markers: { size: 0, hover: { size: 6 } }, 
        dataLabels: { enabled: false }, 

        title: {
            text: item.name.toUpperCase(),
            align: 'left',
            margin: 20,
            style: { fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '1px' }
        },

        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy' }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` } 
        },

        // YATAY EKSEN (Tarihler Altta)
        xaxis: {
            type: 'datetime',
            labels: { style: { colors: '#94a3b8', fontSize: '12px', fontFamily: 'Outfit' } },
            axisBorder: { show: true, color: '#334155' }, 
            axisTicks: { show: true, color: '#334155' },
            tooltip: { enabled: false }
        },

        // DİKEY EKSEN (Fiyatlar Solda)
        yaxis: {
            opposite: false, // SOL TARAFTA
            labels: {
                style: { colors: '#94a3b8', fontSize: '13px', fontFamily: 'Outfit' },
                formatter: (value) => `$${value.toFixed(1)}`
            }
        },

        grid: {
            show: true,
            borderColor: '#1e293b',
            strokeDashArray: 0, // Düz kareli defter çizgisi
            xaxis: { lines: { show: true } }, 
            yaxis: { lines: { show: true } }, 
            padding: { top: 10, right: 20, bottom: 0, left: 10 }
        }
    };

    mainApexChart = new ApexCharts(container, options);
    mainApexChart.render().then(() => {
        const activeBtn = document.querySelector('.time-btn.active');
        if(activeBtn) zoomChart(activeBtn.getAttribute('data-range'));
    });
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
