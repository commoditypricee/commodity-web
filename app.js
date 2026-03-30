// === DİKKAT: AŞAĞIDAKİ TIRNAKLARIN İÇİNE FMP SİTESİNDEN ALDIĞIN API ŞİFRENİ YAPIŞTIR ===
const API_KEY = "86Nedf4EOs5jHyEMnpZR3eXTeRfhSZhu"; 

const getEmojiIcon = (name) => {
    const n = name.toUpperCase();
    if (n.includes('GOLD')) return '🥇';
    if (n.includes('SILVER')) return '🥈';
    if (n.includes('BRENT')) return '🛢️';
    if (n.includes('COPPER')) return '🥉';
    if (n.includes('GAS')) return '💨';
    return '📊';
};

// JSON'daki emtia isimlerini, Yahoo Finance/FMP borsa kodlarına (TICKER) eşleştiren sözlük
const symbolMap = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "BRENT OIL": "BZ=F",
    "NATURAL GAS": "NG=F",
    "COPPER": "HG=F"
};

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) {
        const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        clockEl.innerHTML = `<span style="color: #475569;">${datePart}</span> <span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="color: #0f172a; font-weight: 800;">${timePart}</span>`;
    }
}

// === BOŞLUKLARI DOLDURAN AKILLI BORSA DALGALANMA ALGORİTMASI ===
function interpolateWithVolatility(data) {
    if (!data || data.length < 2) return data;
    let result = [];
    for (let i = 0; i < data.length - 1; i++) {
        let p1 = data[i];
        let p2 = data[i+1];
        result.push(p1);
        let timeDiff = p2.x - p1.x;
        let interval = 10 * 60 * 1000; 
        let steps = Math.floor(timeDiff / interval);
        if (steps > 1) {
            let timeStep = timeDiff / steps;
            let priceStep = (p2.y - p1.y) / steps;
            for (let j = 1; j < steps; j++) {
                let basePrice = p1.y + (priceStep * j);
                let volatilityNoise = (Math.random() - 0.5) * (basePrice * 0.0006); 
                result.push({ x: p1.x + (timeStep * j), y: parseFloat((basePrice + volatilityNoise).toFixed(2)) });
            }
        }
    }
    result.push(data[data.length - 1]);
    return result;
}

let mainApexChart = null; 
let currentItemHistory = []; 
let currentItemIntraday = []; 
let currentSymbolName = 'GOLD'; 
let globalMarketData = []; 

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // 1. Önce grafiğin iskeletini (geçmiş verileri) JSON'dan çiz
    fetchMarketData(true).then(() => {
        // 2. İskelet çizilince hemen GERÇEK API'ye bağlanıp anlık fiyatı güncelle
        fetchRealLivePrices();
        
        // 3. Her 3 saniyede bir ekranı canlandıran simülatörü çalıştır (Gerçek fiyata çapalıdır)
        startLiveTicker();
        
        // 4. Her 5 dakikada bir API kotasını yakmadan gerçek piyasa fiyatını kontrol et
        setInterval(fetchRealLivePrices, 300000);
    });
    
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

// === YENİ: GERÇEK ZAMANLI API BAĞLANTISI (PİYASA FİYATINI ÇEKER) ===
async function fetchRealLivePrices() {
    if(API_KEY === "BURAYA_API_ANAHTARINI_YAPISTIR" || API_KEY.trim() === "") {
        console.warn("API Anahtarı girilmediği için gerçek verilere bağlanılamıyor. Simülasyon devam ediyor.");
        return;
    }

    try {
        const symbols = Object.values(symbolMap).join(',');
        const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`);
        const data = await response.json();

        if (data && data.length > 0) {
            globalMarketData.forEach(item => {
                const fmpSymbol = symbolMap[item.name];
                const liveData = data.find(d => d.symbol === fmpSymbol);
                
                if (liveData) {
                    const oldPrice = item.price;
                    item.price = liveData.price; // Gerçek Spot Fiyat
                    item.changePercent = liveData.changesPercentage.toFixed(2); // Gerçek Günlük Değişim Yüzdesi

                    // Anlık veriyi grafiğe ekle
                    const now = new Date().getTime();
                    if (item.intraday && item.intraday.length > 0) {
                        item.intraday.push({ x: now, y: item.price });
                        if(item.intraday.length > 500) item.intraday.shift();
                    }

                    updateLiveUI(item.name, oldPrice, item.price, item.changePercent);
                }
            });

            // Aktif grafiği sessizce güncelle
            const activeBtn = document.querySelector('.time-btn.active');
            if (activeBtn && parseInt(activeBtn.getAttribute('data-days')) === 1) {
                applyTimeFilter(1, true);
            }
        }
    } catch (error) {
        console.error("Gerçek piyasa verisi çekilirken hata oluştu:", error);
    }
}

// 3 saniyede bir çalışan illüzyon motoru (Gerçek fiyata çapalanmıştır, kotayı yakmaz)
function startLiveTicker() {
    setInterval(() => {
        const now = new Date().getTime();
        
        globalMarketData.forEach(item => {
            const changeFactor = 1 + ((Math.random() - 0.5) * 0.0004);
            const oldPrice = item.price;
            const newPrice = parseFloat((oldPrice * changeFactor).toFixed(2));
            
            item.price = newPrice; // Çapalanmış mikro dalgalanma
            
            if (item.intraday && item.intraday.length > 0) {
                item.intraday.push({ x: now, y: newPrice });
                if(item.intraday.length > 500) item.intraday.shift();
            }

            updateLiveUI(item.name, oldPrice, newPrice, item.changePercent);
        });

        const activeBtn = document.querySelector('.time-btn.active');
        if (activeBtn && parseInt(activeBtn.getAttribute('data-days')) === 1) {
            applyTimeFilter(1, true); 
        }
    }, 3000); 
}

function updateLiveUI(symbolName, oldPrice, newPrice, realChangePercent) {
    const card = document.querySelector(`.card[data-name="${symbolName}"]`);
    if (!card) return;

    const priceEl = card.querySelector('.price');
    const badgeEl = card.querySelector('.badge');
    
    if (priceEl) {
        priceEl.textContent = `$${newPrice.toFixed(2)}`;
        const color = newPrice >= oldPrice ? '#10b981' : '#ef4444';
        priceEl.style.color = color;
        setTimeout(() => { priceEl.style.color = '#000000'; }, 500); 
    }
    
    // Yüzdelik değişimi gerçek API'den gelen değere sabitler
    if (badgeEl && realChangePercent !== undefined) {
        const isPos = parseFloat(realChangePercent) >= 0;
        const sign = isPos ? '+' : '';
        badgeEl.className = `badge ${isPos ? 'positive' : 'negative'}`;
        badgeEl.textContent = `${sign}${realChangePercent}%`;
    }
    
    if (symbolName === currentSymbolName) {
        renderGoldPriceTable(globalMarketData.find(i => i.name === symbolName));
    }
}

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
        
        let sourceData = (p.days === 1 && item.intraday && item.intraday.length > 0) ? item.intraday : history;

        if (sourceData && sourceData.length > 0) {
            const lastData = sourceData[sourceData.length - 1];
            const currentPrice = lastData.y;
            const cutoffDate = lastData.x - (p.days * 24 * 60 * 60 * 1000);
            
            const filteredData = sourceData.filter(h => h.x >= cutoffDate);
            let startPrice = sourceData[0].y;
            if (filteredData.length > 0) { startPrice = filteredData[0].y; }
            
            changeAmount = currentPrice - startPrice;
            changePercent = (changeAmount / startPrice) * 100;
        } else if (p.days === 1) {
            changePercent = parseFloat(item.changePercent) || 0;
            changeAmount = item.price - (item.price / (1 + (changePercent/100)));
        }

        // Today satırı direkt gerçek API yüzdesine eşitleniyor (Sıfır Hata)
        if (p.days === 1) {
            changePercent = parseFloat(item.changePercent);
            changeAmount = item.price - (item.price / (1 + (changePercent/100)));
        }

        const isPos = changePercent >= 0;
        const colorClass = isPos ? 'gp-pos' : 'gp-neg';
        const sign = isPos ? '+' : '';

        tbodyHtml += `
            <tr>
                <td class="left">${p.label}</td>
                <td class="right ${colorClass}">${sign}${changeAmount.toFixed(2)}</td>
                <td class="right ${colorClass}">${sign}${changePercent.toFixed(2)}%</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="gp-title">${item.name.toUpperCase()} PERFORMANCE (USD)</div>
        <table class="gp-simple-table">
            <thead>
                <tr>
                    <th class="left">Period</th>
                    <th class="right">Amount</th>
                    <th class="right">%</th>
                </tr>
            </thead>
            <tbody>${tbodyHtml}</tbody>
        </table>
    `;
}

function updateCardPercentages(days) {
    if (!globalMarketData || globalMarketData.length === 0) return;
    globalMarketData.forEach(item => {
        const cardBadge = document.querySelector(`.card[data-name="${item.name}"] .badge`);
        if (!cardBadge) return;
        
        if (days > 1) {
            let changePercent = 0;
            if (item.history && item.history.length > 0) {
                const lastData = item.history[item.history.length - 1];
                const filteredData = item.history.filter(h => h.x >= (lastData.x - (days * 24 * 60 * 60 * 1000)));
                if (filteredData.length > 0) changePercent = ((lastData.y - filteredData[0].y) / filteredData[0].y) * 100;
            }
            const isPos = changePercent >= 0;
            cardBadge.className = `badge ${isPos ? 'positive' : 'negative'}`;
            cardBadge.textContent = `${isPos ? '+' : ''}${changePercent.toFixed(2)}%`;
        } else {
            const isPos = parseFloat(item.changePercent) >= 0;
            const sign = isPos ? '+' : '';
            cardBadge.className = `badge ${isPos ? 'positive' : 'negative'}`;
            cardBadge.textContent = `${sign}${item.changePercent}%`;
        }
    });
}

function applyTimeFilter(days, isLiveUpdate = false) {
    if (!mainApexChart) return;
    let filteredData = [];
    let isIntraday = (days === 1);
    
    if (isIntraday) {
        let rawData = (currentItemIntraday && currentItemIntraday.length > 0) ? currentItemIntraday : currentItemHistory.filter(item => item.x >= (currentItemHistory[currentItemHistory.length - 1].x - 86400000));
        filteredData = isLiveUpdate ? rawData : interpolateWithVolatility(rawData);
    } else {
        if(currentItemHistory.length === 0) return;
        filteredData = currentItemHistory.filter(item => item.x >= (currentItemHistory[currentItemHistory.length - 1].x - (days * 86400000)));
    }
    
    if(filteredData.length === 0) return;

    const prices = filteredData.map(h => h.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (isLiveUpdate) {
        mainApexChart.updateSeries([{ name: 'Price', data: filteredData }], false);
    } else {
        mainApexChart.updateSeries([{ name: 'Price', data: filteredData }]);
    }
    
    mainApexChart.updateOptions({
        xaxis: {
            tickAmount: days >= 365 ? 5 : 6,
            labels: {
                style: { colors: '#334155', fontSize: '13px', fontFamily: 'Inter', fontWeight: 600 }, 
                formatter: function(val) {
                    if (!val) return '';
                    const date = new Date(val);
                    if (isIntraday) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (days >= 365) return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); 
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
        },
        yaxis: { 
            min: minPrice - (minPrice * 0.002), 
            max: maxPrice + (maxPrice * 0.002),
            labels: {
                style: { colors: '#334155', fontSize: '13px', fontFamily: 'Inter', fontWeight: 600 },
                formatter: (value) => `$${value.toFixed(2)}`
            }
        },
        tooltip: {
            x: {
                formatter: function(val) {
                    const date = new Date(val);
                    const dayMonthYear = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    if (isIntraday) { return dayMonthYear + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second:'2-digit', hour12: false }); }
                    return dayMonthYear;
                }
            }
        }
    });
}

function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    currentItemHistory = item.history; 
    currentItemIntraday = item.intraday || []; 
    currentSymbolName = item.name;
    
    const activeBtn = document.querySelector('.time-btn.active');
    const days = activeBtn ? parseInt(activeBtn.getAttribute('data-days')) : 1;
    const isIntraday = (days === 1);
    
    const camelName = item.name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    document.getElementById('chart-title').textContent = `${camelName} Price`;

    renderGoldPriceTable(item);

    let filteredData = [];
    if (isIntraday) {
        let rawData = (currentItemIntraday && currentItemIntraday.length > 0) ? currentItemIntraday : currentItemHistory.filter(h => h.x >= (currentItemHistory[currentItemHistory.length - 1].x - 86400000));
        filteredData = interpolateWithVolatility(rawData);
    } else {
        filteredData = currentItemHistory.filter(h => h.x >= (currentItemHistory[currentItemHistory.length - 1].x - (days * 86400000)));
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
            animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } } 
        },
        colors: ['#2563eb'], 
        stroke: { curve: 'smooth', width: 3 }, 
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.0, stops: [0, 90, 100] }
        },
        markers: { size: 0, hover: { size: 6, colors: ['#ffffff'], strokeColors: '#2563eb', strokeWidth: 2 } }, 
        dataLabels: { enabled: false }, 
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            x: {
                formatter: function(val) {
                    const date = new Date(val);
                    const dayMonthYear = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    if (isIntraday) { return dayMonthYear + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
                    return dayMonthYear;
                }
            }, 
            y: { formatter: (value) => `$${value.toFixed(2)}` },
            style: { fontSize: '14px', fontFamily: 'Inter', fontWeight: 500 }
        },
        xaxis: {
            type: 'datetime',
            tickAmount: days >= 365 ? 5 :
