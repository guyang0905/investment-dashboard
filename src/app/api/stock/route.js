export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  
  try {
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
    
    if (!ALPHA_VANTAGE_KEY) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Alpha Vantage');
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      return Response.json({
        symbol: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'].replace('%', ''),
        source: 'alphavantage'
      });
    }
    
    return Response.json({ error: 'No data found for symbol' }, { status: 404 });
    
  } catch (error) {
    return Response.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}