// DİNAMİK EMOJİLER (Garantili Çözüm)
const getEmojiIcon = (name) => {
    const n = name.toUpperCase();
    if (n.includes('GOLD')) return '🥇';
    if (n.includes('SILVER')) return '🥈';
    if (n.includes('OIL') || n.includes('BRENT') || n.includes('WTI')) return '🛢️';
    if (n.includes('COPPER')) return '🥉';
    if (n.includes('GAS')) return '💨';
    if (n.includes('WHEAT') || n.includes('CORN')) return '🌾';
    if (n.includes('COFFEE')) return '☕';
    if (n.includes('SUGAR')) return '🧊';
    return '📊';
};

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) {
        const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        // BEYAZ TEMA İÇİN SAAT RENKLERİ DÜZELTİLDİ
        clockEl.innerHTML = `${datePart} <span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="color: #111827; font-weight: 600;">${timePart}</span>`;
    }
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
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const days = parseInt(btn.getAttribute('data-days'));
            if (isNaN(days)) return;
            applyTimeFilter(days);
            updateCardPercentages(days); 
        });
    });
});

// GOLDPRICE.ORG STİLİ BİREBİR TABLO OLUŞTURUCU
function renderGoldPriceTable(item) {
    const container = document.getElementById('perf-stats');
    if (!container) return;

    const periods = [
        { label: 'Today', days: 1 },
        { label: '30 Days', days: 30 },
        { label: '6 Months', days: 180 },
        { label: '1 Year', days: 365 },
        { label: '5 Years', days: 1825 }
    ];

    let tbodyHtml = '';
    const history = item.history || [];

    periods.forEach(p => {
        let changePercent = 0;
        let changeAmount = 0;
        
        if (p.days === 1) {
             changePercent = parseFloat(item.changePercent);
             const currentPrice = history.length > 0 ? history[history.length-1].y : item.price;
             changeAmount = currentPrice - (currentPrice / (1 + (changePercent/100)));
        } else if (history.length > 0) {
            const lastData = history[history.length - 1];
            const currentPrice = lastData.y;
            const cutoffDate = lastData.x - (p.days * 24 * 60 * 60 * 1000);
            const filteredData = history.filter(h => h.x >= cutoffDate);
            
            let startPrice = history[0].y;
            if (filteredData.length > 0) startPrice = filteredData[0].y;
            
            changeAmount = currentPrice - startPrice;
            changePercent = (changeAmount / startPrice) * 100;
        }

        const isPos = changePercent >= 0;
        const colorClass = isPos ? 'gp-positive' : 'gp-negative';
        const sign = isPos ? '+' : '';

        // GoldPrice.org stili dikey tablo HTML'i
        tbodyHtml += `
            <div class="stat-box">
                <div class="stat-label">${item.name} PRICE PERFORMANCE (${p.label})</div>
                <div class="stat-value" style="color: ${isPos ? '#10b981' : '#ef4444'}">${sign}${changeAmount.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)</div>
            </div>
        `;
    });

    container.innerHTML = tbodyHtml;
}

function updateCardPercentages(days) {
    if (!globalMarketData || globalMarketData.length === 0) return;
    globalMarketData.forEach(item => {
        const cardBadge = document.querySelector(`.card[data-name="${item.name}"] .badge`);
        if (!cardBadge) return;
        let changePercent = 0;
        let targetHistory = (days === 1 && item.intraday && item.intraday.length > 0) ? item.intraday : item.history;
        if (targetHistory && targetHistory.length > 0) {
            const lastData = targetHistory[targetHistory.length - 1];
            const filteredData = targetHistory.filter(h => h.x >= (lastData.x - (days * 24 * 60 * 60 * 1000)));
            if (filteredData.length > 0) changePercent = ((lastData.y - filteredData[0].y) / filteredData[0].y) * 100;
            else changePercent = parseFloat(item.changePercent); 
        } else { changePercent = parseFloat(item.changePercent); }
        const isPos = changePercent >= 0;
        cardBadge.className = `badge ${isPos ? 'positive' : 'negative'}`;
        cardBadge.textContent = `${isPos ? '+' : ''}${changePercent.toFixed(2)}%`;
    });
}

function applyTimeFilter(days) {
    if (!mainApexChart) return;
    let filteredData = [];
    let isIntraday = (days === 1);
    
    if (isIntraday) {
        filteredData = (currentItemIntraday && currentItemIntraday.length > 0) ? currentItemIntraday : currentItemHistory.filter(item => item.x >= (currentItemHistory[currentItemHistory.length - 1].x - 86400000));
    } else {
        if(currentItemHistory.length === 0) return;
        filteredData = currentItemHistory.filter(item => item.x >= (currentItemHistory[currentItemHistory.length - 1].x - (days * 86400000)));
    }
    if(filteredData.length === 0) return;

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // KLASİK DÜZ ÇİZGİ YERİNE MODERN GÖLGE DESTEKLİ AREA (VİZYON 1)
    mainApexChart.updateSeries([{ name: 'Price', data: filteredData }]);
    
    mainApexChart.updateOptions({
        xaxis: {
            tickAmount: days >= 365 ? 5 : 6,
            labels: {
                formatter: function(val) {
                    if (!val) return '';
                    const date = new Date(val);
                    if (isIntraday) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (days >= 365) return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); 
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
        },
        yaxis: { min: minPrice - (minPrice * 0.002), max: maxPrice + (maxPrice * 0.002) }
    });
}

function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentItemIntraday = item.intraday || []; 
    currentSymbolName = item.name;
    
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1;
    
    const camelName = item.name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    document.getElementById('chart-title').textContent = `${camelName} Price`;

    // TABLOYU OTOMATİK OLUŞTUR
    renderGoldPriceTable(item);

    let filteredData = [];
    if (days === 1) {
        filteredData = (currentItemIntraday && currentItemIntraday.length > 0) ? currentItemIntraday : currentItemHistory.filter(h => h.x >= (currentItemHistory[currentItemHistory.length - 1].x - 86400000));
    } else {
        filteredData = currentItemHistory.filter(h => h.x >= (currentItemHistory[currentItemHistory.length - 1].x - (days * 86400000)));
    }
    if(filteredData.length === 0) return;

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (mainApexChart) { mainApexChart.destroy(); }

    // MODERN YENİ NESİL GRAFİK (APPLE STOCKS STİLİ)
    const options = {
        series: [{ name: 'Price', data: filteredData }],
        chart: {
            type: 'area', // Gölge destekli modern akış
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 200 } 
        },
        colors: ['#3b82f6'], 
        stroke: { curve: 'smooth', width: 2 }, // Pürüzsüz kıvrımlar
        
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.2, 
                opacityTo: 0.0,  
                stops: [0, 90, 100]
            }
        },

        markers: { size: 0, hover: { size: 6 } }, 
        dataLabels: { enabled: false }, 

        tooltip: {
            theme: 'light',
            x: { format: days === 1 ? 'dd MMM, HH:mm' : 'dd MMM yyyy' }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` },
            style: { fontSize: '13px', fontFamily: 'Inter' }
        },

        xaxis: {
            type: 'datetime',
            tickAmount: days >= 365 ? 5 : 6,
            labels: { 
                style: { colors: '#71717a', fontSize: '12px', fontFamily: 'Inter' },
                datetimeUTC: false,
                formatter: function(val) {
                    if (!val) return '';
                    const date = new Date(val);
                    if (days === 1) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (days >= 365) return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            },
            axisBorder: { show: false }, 
            axisTicks: { show: false }
        },

        yaxis: {
            opposite: false, 
            min: minPrice - (minPrice * 0.002),
            max: maxPrice + (maxPrice * 0.002),
            labels: {
                style: { colors: '#71717a', fontSize: '12px', fontFamily: 'Inter' },
                formatter: (value) => `$${value.toFixed(2)}`
            }
        },

        grid: {
            show: true, borderColor: '#e2e8f0', strokeDashArray: 4, 
            xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } }, 
            padding: { top: 10, right: 20, bottom: 20, left: 10 }
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
            
            if (isFirstLoad && index === 0) setTimeout(() => loadCustomApexChart(item), 100);

            const isPos = parseFloat(item.changePercent) >= 0;
            const sign = isPos ? '+' : '';

            card.innerHTML = `
                <div class="card-info">
                    <i class="commodity-icon">${getEmojiIcon(item.name)}</i>
                    <div class="commodity-details">
                        <h2>${item.name}</h2>
                        <div class="price">$${item.price}</div>
                    </div>
                </div>
                <div class="card-status">
                    <div class="badge ${isPos ? 'positive' : 'negative'}">${sign}${item.changePercent}%</div>
                </div>
            `;
            
            card.addEventListener('click', () => loadCustomApexChart(item));
            container.appendChild(card);
        });

        const activeBtn = document.querySelector('.time-btn.active');
        const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1; 
        updateCardPercentages(days);

    } catch (error) { console.error("Veri çekme hatası:", error); }
}
