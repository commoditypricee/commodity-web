const yahooFinance = require('yahoo-finance2').default;

// Yahoo'nun hata vermesini önlemek için doğrulama ayarını kapatıyoruz
yahooFinance.setGlobalConfig({ 
    validation: { logErrors: false },
    queue: { timeout: 10000 } // İstek zaman aşımı süresi
});

exports.handler = async function(event, context) {
  try {
    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    
    // Verileri tek tek değil, Yahoo'nun sevdiği formatta topluca istiyoruz
    const quotes = await yahooFinance.quote(symbols);
    
    const data = quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.symbol,
      price: (q.regularMarketPrice || 0).toFixed(2),
      changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // Netlify'a "bu sonucu 5 dk hafızanda tut" diyoruz
      },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error("Yahoo Hatası:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Yahoo şu an yoğun, lütfen az sonra tekrar deneyin." })
    };
  }
};
