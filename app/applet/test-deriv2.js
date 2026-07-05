import WebSocket from 'ws';
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
ws.on('open', () => {
    ws.send(JSON.stringify({ ticks_history: 'cryBTCUSD', adjust_start_time: 1, count: 5, end: "latest", style: "candles", granularity: 60 }));
});
ws.on('message', (data) => {
    console.log(data.toString());
    process.exit(0);
});
