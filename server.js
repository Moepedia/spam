const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PORT dari Railway
const PORT = process.env.PORT || 3000;

// SESSION POOL - 10 session buat spam (dikurangin biar ga berat di Railway)
const sessions = [];
for(let i = 0; i < 10; i++) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `session_${i}` }),
        puppeteer: { 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        }
    });
    client.on('qr', qr => {
        console.log(`📱 SESSION ${i} QR CODE:`);
        qrcode.generate(qr, { small: true });
    });
    client.on('ready', () => console.log(`✅ Session ${i} ready`));
    client.on('disconnected', (reason) => {
        console.log(`⚠️ Session ${i} disconnected: ${reason}`);
        // Auto reconnect
        setTimeout(() => {
            console.log(`🔄 Reconnecting session ${i}...`);
            client.initialize();
        }, 5000);
    });
    client.initialize();
    sessions.push(client);
}

// ROUTE SPAM
app.post('/spam', async (req, res) => {
    const { target, message, mode } = req.body;
    let sent = 0;
    const results = [];
    
    try {
        if(mode === 'api' || mode === 'hybrid') {
            const apiList = [
                `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(message)}`,
                `https://wa.me/${target}?text=${encodeURIComponent(message)}`
            ];
            for(const url of apiList) {
                try {
                    await axios.get(url, {
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 5000
                    });
                    sent++;
                    results.push({ method: 'api', status: 'sent' });
                } catch(e) {
                    results.push({ method: 'api', status: 'failed' });
                }
            }
        }
        
        if(mode === 'session' || mode === 'hybrid') {
            const number = `${target}@c.us`;
            for(const client of sessions) {
                try {
                    if(client && client.pupPage) {
                        await client.sendMessage(number, message);
                        sent++;
                        results.push({ method: 'session', status: 'sent' });
                    }
                } catch(e) {
                    results.push({ method: 'session', status: 'failed' });
                }
            }
        }
        
        res.json({ 
            sent, 
            total: sent,
            results,
            status: sent > 0 ? 'success' : 'partial',
            message: `${sent} pesan terkirim`
        });
    } catch(e) {
        res.json({ 
            sent: sent || 0,
            status: 'error',
            error: e.message
        });
    }
});

// HEALTH CHECK buat Railway
app.get('/health', (req, res) => {
    res.json({ 
        status: '🔥 NEBOLUSVERSE ACTIVE',
        sessions: sessions.length,
        uptime: process.uptime()
    });
});

// ROUTE UTAMA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 NEBOLUS SPAMMER RUNNING ON PORT ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
});
