const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function(event, context) {
  try {
    // Takip edeceğimiz Ana Kadro (Altın, Gümüş, Bakır, Petrol, Doğalgaz)
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    
    // Verileri ışık hızında çekmek için hepsini aynı anda sorguluyoruz
    const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym)));
    
    // Sitemizin kafası karışmasın diye devasa veriyi filtreleyip sadece işimize yarayanları (Fiyat ve Yüzde) alıyoruz
    const data = quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.longName,
      price: q.regularMarketPrice.toFixed(2),
      changePercent: q.regularMarketChangePercent.toFixed(2)
    }));

    // Tarayıcıların (Chrome/Safari) güvenlik duvarını (CORS) aşıp veriyi sitemize gönderiyoruz
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Tüm sitelerden erişime izin ver (Kendi sitemiz için hayati ayar)
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error("API Hatası:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Veri çekilirken bir hata oluştu." })
    };
  }
};