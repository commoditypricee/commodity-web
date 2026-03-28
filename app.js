function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

let mainApexChart = null; 
let currentItemHistory = []; 
let currentItemIntraday = []; 
let currentSymbolName = 'GOLD'; 
let globalMarketData = []; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchMarketData(true); 
    setInterval(() => fetchMarketData(false), 60000); 
    
    // BUTONLARA TIKLAMA
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const days = parseInt(btn.getAttribute('data-days'));
            const text = btn.textContent;
            
            if (isNaN(days)) return;

            applyTimeFilter(days, text);
            updateCardPercentages(days); 
        });
    });
});

function updateCardPercentages(days) {
    if (!globalMarketData || globalMarketData.length === 0) return;

    globalMarketData.forEach(item => {
        const cardBadge = document.querySelector(`.card[data-name="${item.name}"] .badge`);
        if (!cardBadge) return;

        let changePercent = 0;
        let targetHistory = (days === 1 && item.intraday && item.intraday.length > 0) ? item.intraday : item.history;
        
        if (targetHistory && targetHistory.length > 0) {
            const lastData = targetHistory[targetHistory.length - 1];
            const currentPrice = lastData.y;
            const lastDate = lastData.x;
            const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);

            const filteredData = targetHistory.filter(h => h.x >= cutoffDate);
            
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

        cardBadge.className = `badge ${colorClass}`;
        cardBadge.textContent = `${sign}${changePercent.toFixed(2)}%`;
    });
}

function applyTimeFilter(days, timeframeText) {
    if (!mainApexChart) return;

    let filteredData = [];
    let isIntraday = (days === 1);

    if (isIntraday) {
        filteredData = currentItemIntraday; 
    } else {
        if(currentItemHistory.length === 0) return;
        const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
        const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);
        filteredData = currentItemHistory.filter(item => item.x >= cutoffDate);
    }
    
    if(filteredData.length === 0) return;

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    mainApexChart.updateSeries([{ data: filteredData }]);
    
    // EKSENLERİ GÜNCELLEME (HATA BURADAYDI, DÜZELTİLDİ)
    mainApexChart.updateOptions({
        yaxis: {
            min: minPrice - (minPrice * 0.002),
            max: maxPrice + (maxPrice * 0.002)
        },
        xaxis: {
            labels: {
                format: isIntraday ? 'HH:mm' : 'dd MMM' // 1 Gün ise Saat, değilse Gün/Ay
            }
        },
        tooltip: {
            x: {
                format: isIntraday ? 'dd MMM, HH:mm' : 'dd MMM yyyy'
            }
        }
    });

    document.getElementById('chart-title').textContent = `${currentSymbolName.toUpperCase()} (${timeframeText})`;
}

function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentItemIntraday = item.intraday || []; 
    currentSymbolName = item.name;
    
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1;
    const btnText = activeBtn ? activeBtn.textContent : '1 Day';

    document.getElementById('chart-title').textContent = `${item.name.toUpperCase()} (${btnText})`;

    let filteredData = [];
    let isIntraday = (days === 1);

    if (isIntraday) {
        filteredData = currentItemIntraday;
    } else {
        const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
        const cutoffDate = lastDate - (days * 24 * 60 * 60 * 1000);
        filteredData = currentItemHistory.filter(h => h.x >= cutoffDate);
    }

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
            x: { format: isIntraday ? 'dd MMM, HH:mm' : 'dd MMM yyyy' }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` } 
        },

        xaxis: {
            type: 'datetime',
            labels: { 
                style: { colors: '#94a3b8', fontSize: '12px', fontFamily: 'Outfit' },
                format: isIntraday ? 'HH:mm' : 'dd MMM', // İLK YÜKLEMEDEKİ AYAR
                datetimeUTC: false // Yerel saati baz alması için
            },
            axisBorder: { show: true, color: '#334155' },
