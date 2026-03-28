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

// --- APEXCHARTS: PROFESYONEL TERMİNAL TASARIMI ---
// Artık sadece geçmiş veriyi değil, tüm item'ı (isim, fiyat vs.) gönderiyoruz
function loadCustomApexChart(item) {
    const container = document.getElementById('chart-container');
    
    // Eski grafik varsa tamamen yok et (Sıfırdan temiz çizim için)
    if (mainApexChart) {
        mainApexChart.destroy();
    }

    const options = {
        series: [{
            name: 'Price',
            data: item.history 
        }],
        chart: {
            type: 'area', 
            height: '100%',
            width: '100%',
            background: 'transparent', 
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 600 }, 
        },
        colors: ['#5b68df'], 
        stroke: { curve: 'smooth', width: 3 }, // Çizgiyi biraz daha belirgin yaptık
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] }
        },
        dataLabels: { enabled: false }, // Çizgi üstündeki gereksiz rakamları kapat
        // DİNAMİK GRAFİK BAŞLIĞI VE FİYATI
        title: {
            text: item.name.toUpperCase(),
            align: 'left',
            margin: 10,
            style: { fontSize: '14px', fontWeight: 500, color: '#8b92a5', letterSpacing: '1px' }
        },
        subtitle: {
            text: '$' + item.price,
            align: 'left',
            margin: 20,
            style: { fontSize: '32px', fontWeight: 700, color: '#ffffff' }
        },
        // MODERN X EKSENİ (Tarihler)
        xaxis: {
            type: 'datetime',
            labels: {
                style: { colors: '#64748b', fontSize: '12px', fontFamily: 'Outfit' },
                datetimeFormatter: { month: "MMM 'yy", day: 'dd MMM' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false }
        },
        // MODERN Y EKSENİ (Fiyatlar - SAĞ TARAFTA)
        yaxis: {
            opposite: true, // Borsa stili: Fiyatlar sağda olur
            labels: {
                style: { colors: '#64748b', fontSize: '13px', fontFamily: 'Outfit', fontWeight: 500 },
                formatter: (value) => { return '$' + value.toFixed(1); }
            }
        },
        // KILAVUZ ÇİZGİLER (Sadece yatay, okunabilirliği artırır)
        grid: {
            show
