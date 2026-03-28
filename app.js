// DOSYA İSMİ YERİNE DİREKT EMOJİLER (Garantili Çözüm)
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
    if (n.includes('PLATINUM') || n.includes('PALLADIUM')) return '💍';
    return '📊'; // Hiçbiri değilse standart borsa emojisi
};

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) {
        const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        clockEl.innerHTML = `${datePart} <span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="color: #4b5563; font-weight: 600;">${timePart}</span>`;
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

// YENİ: İlgili emtianın farklı zaman dilimlerindeki performansını hesaplayan tablo motoru
function renderPerformanceTable(item) {
    const container = document.getElementById('perf-stats');
    if (!container) return;

    const periods = [
        { label: '1 Day', days: 1 },
        { label: '1 Week', days: 7 },
        { label: '1 Month', days: 30 },
        { label: '1 Year', days: 365 },
        { label: '5 Years', days: 1825 }
    ];

    let html = '';
    const history = item.history || [];

    periods.forEach(p => {
        let changePercent = 0;
        
        if (p.days === 1) {
             changePercent = parseFloat(item.changePercent);
        } else if (history.length > 0) {
            const lastData = history[history.length - 1];
            const currentPrice = lastData.y;
            const lastDate = lastData.x;
            const cutoffDate = lastDate - (p.days * 24 * 60 * 60 * 1000);

            const filteredData = history.filter(h => h.x >= cutoffDate);
            if (filteredData.length > 0) {
                const startPrice = filteredData[0].y;
                changePercent = ((currentPrice - startPrice) / startPrice) * 100;
            } else {
                // Eğer yeterli geçmiş veri yoksa eldeki en eski veriyi baz al
                const startPrice = history[0].y;
                changePercent = ((currentPrice - startPrice) / startPrice) * 100;
            }
        }

        const isPos = changePercent >= 0;
        const color = isPos ? '#10b981' : '#ef4444';
        const sign = isPos ? '+' : '';

        html += `
            <div class="stat-box">
                <div class="stat-label">${p.label}</div>
                <div class="stat-value" style="color: ${color}">${sign}${changePercent.toFixed(2)}%</div>
            </div>
        `;
    });

    container.innerHTML = html;
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

function getPriceTitle(name) {
    const camelName = name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return `${camelName} Price`; 
}

function applyTimeFilter(days) {
    if (!mainApexChart) return;

    let filteredData = [];
    let isIntraday = (days === 1);
    let isLongTerm = (days >= 365); 

    if (isIntraday) {
        if (currentItemIntraday && currentItemIntraday.length > 0) {
            filteredData = currentItemIntraday; 
        } else {
            const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
            const cutoffDate = lastDate - (24 * 60 * 60 * 1000);
            filteredData = currentItemHistory.filter(item => item.x >= cutoffDate);
        }
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

    mainApexChart.updateSeries([{ name: 'Price', data: filteredData }]);
    
    mainApexChart.updateOptions({
        xaxis: {
            tickAmount: isLongTerm ? 5 : 6,
            labels: {
                formatter: function(val) {
                    if (!val) return '';
                    const date = new Date(val);
                    if (isIntraday) {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                    }
                    if (isLongTerm) {
                        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); 
                    }
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
        },
        yaxis: {
            min: minPrice - (minPrice * 0.002),
            max: maxPrice + (maxPrice * 0.002)
        }
    });

    document.getElementById('chart-title').textContent = getPriceTitle(currentSymbolName);
}

function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentItemIntraday = item.intraday || []; 
    currentSymbolName = item.name;
    
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1;
    const isLongTerm = (days >= 365);

    document.getElementById('chart-title').textContent = getPriceTitle(item.name);

    // Her tıklamada tabloyu ilgili emtiaya göre yeniden oluştur
    renderPerformanceTable(item);

    let filteredData = [];

    if (days === 1) {
        if (currentItemIntraday && currentItemIntraday.length > 0) {
            filteredData = currentItemIntraday;
        } else {
            const lastDate = currentItemHistory[currentItemHistory.length - 1].x;
            const cutoffDate = lastDate - (24 * 60 * 60 * 1000);
            filteredData = currentItemHistory.filter(h => h.x >= cutoffDate);
        }
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
            type: 'area',
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 300 } 
        },
        colors: ['#3b82f6'], 
        stroke: { curve: 'smooth', width: 2 },
        
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.0, stops: [0, 90, 100]
            }
        },

        markers: { size: 0, hover: { size: 4 } }, 
        dataLabels: { enabled: false }, 

        tooltip: {
            theme: 'dark',
            x: { format: days === 1 ? 'dd MMM, HH:mm' : 'dd MMM yyyy' }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` },
            style: { fontSize: '13px', fontFamily: 'Inter' }
        },

        xaxis: {
            type: 'datetime',
            tickAmount: isLongTerm ? 5 : 6,
            labels: { 
                style: { colors: '#71717a', fontSize: '12px', fontFamily: 'Inter' },
                datetimeUTC: false,
                formatter: function(val) {
                    if (!val) return '';
                    const date = new Date(val);
                    if (days === 1) {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                    }
                    if (isLongTerm) {
                        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    }
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            },
            axisBorder: { show: false }, 
            axisTicks: { show: false },
            tooltip: { enabled: false }
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

function getCardHtml(item) {
    const iconEmoji = getEmojiIcon(item.name); // Simge olarak emojiyi çağır
    const isPositive = parseFloat(item.changePercent) >= 0;
    const colorClass = isPositive ? 'positive' : 'negative';
    const sign = isPositive ? '+' : '';

    return `
        <div class="card-info">
            <i class="commodity-icon">${iconEmoji}</i>
            <div class="commodity-details">
                <h2>${item.name}</h2>
                <div class="price">$${item.price}</div>
            </div>
        </div>
        <div class="card-status">
            <div class="badge ${colorClass}">${sign}${item.changePercent}%</div>
        </div>
    `;
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

            card.innerHTML = getCardHtml(item); 
            
            card.addEventListener('click', () => {
                loadCustomApexChart(item); 
            });

            container.appendChild(card);
        });

        const activeBtn = document.querySelector('.time-btn.active');
        const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1; 
        updateCardPercentages(days);

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}
