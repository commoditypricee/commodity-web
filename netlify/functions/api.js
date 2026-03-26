const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function(event, context) {
  try {
    // Kütüphane ayarlarını en başta yapıyoruz
    yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

    const symbols = ['GC=F', 'SI=F', 'HG=F', 'BZ=F', 'NG=F'];
    
    // Verileri çekiyoruz
    const quotes = await Promise.all(
      symbols.map(sym => yahooFinance.quote(sym))
    );
    
    const data = quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: (q.regularMarketPrice || 0).toFixed(2),
      changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error("API Hatası:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
