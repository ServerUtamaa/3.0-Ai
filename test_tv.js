const fetch = require('node-fetch');
async function test() {
    const response = await fetch("https://economic-calendar.tradingview.com/events?from=2026-07-01T00:00:00.000Z&to=2026-07-08T00:00:00.000Z", {
        headers: {
            'origin': 'https://www.tradingview.com',
            'referer': 'https://www.tradingview.com/'
        }
    });
    console.log("Status:", response.status);
    console.log(await response.text());
}
test();
