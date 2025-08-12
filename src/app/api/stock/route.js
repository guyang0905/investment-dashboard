export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  
  try {
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
    
    if (!ALPHA_VANTAGE_KEY) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get global quote data
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!quoteResponse.ok) {
      throw new Error('Failed to fetch from Alpha Vantage');
    }
    
    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      return Response.json({ error: 'No data found for symbol' }, { status: 404 });
    }

    // Get company overview for additional data
    let overviewData = null;
    try {
      const overviewResponse = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      );
      
      if (overviewResponse.ok) {
        overviewData = await overviewResponse.json();
      }
    } catch (overviewError) {
      console.log('Overview data not available');
    }

    // Parse and format the response
    const result = {
      symbol: symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      dayHigh: parseFloat(quote['03. high']),
      dayLow: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      source: 'alphavantage'
    };

    // Add overview data if available
    if (overviewData && overviewData.Symbol) {
      result.week52High = overviewData['52WeekHigh'] ? parseFloat(overviewData['52WeekHigh']) : undefined;
      result.week52Low = overviewData['52WeekLow'] ? parseFloat(overviewData['52WeekLow']) : undefined;
      result.marketCap = overviewData.MarketCapitalization ? parseInt(overviewData.MarketCapitalization) : undefined;
      result.peRatio = overviewData.PERatio && overviewData.PERatio !== 'None' ? parseFloat(overviewData.PERatio) : undefined;
      result.dividendYield = overviewData.DividendYield && overviewData.DividendYield !== 'None' ? parseFloat(overviewData.DividendYield) : undefined;
      result.eps = overviewData.EPS && overviewData.EPS !== 'None' ? parseFloat(overviewData.EPS) : undefined;
    }

    return Response.json(result);
    
  } catch (apiError) {
    console.error('API Error:', apiError);
    return Response.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}