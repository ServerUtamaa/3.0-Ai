export default async function handler(req, res) {
  const { from, to, lang } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to parameters' });
  }

  const targetUrl = `https://economic-calendar.tradingview.com/events?from=${from}&to=${to}&lang=${lang || 'id'}`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36)'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from TradingView' });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Calendar API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
