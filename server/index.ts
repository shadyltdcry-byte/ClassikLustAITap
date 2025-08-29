/**
 * Character Tap Game Server - Simplified
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

console.log('🎮 Starting Character Tap Game Server...');

// Basic middleware
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Test route
app.get('/test', (req, res) => {
  console.log('✅ TEST route hit!');
  res.send('<h1 style="color: red; text-align: center; padding: 100px;">SERVER IS WORKING!</h1>');
});

// Main game route - FULL CHARACTER TAP GAME
app.get('/', (req, res) => {
  console.log('🏠 ROOT route - serving FULL Character Tap Game!');
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Character Tap Game - Full Version</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            min-height: 100vh;
            overflow-x: hidden;
        }
        .container { max-width: 420px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .nav-tabs { display: flex; background: rgba(0,0,0,0.2); border-radius: 25px; margin-bottom: 20px; }
        .nav-tab { flex: 1; padding: 12px 8px; text-align: center; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 12px; }
        .nav-tab.active { background: rgba(255,255,255,0.2); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .character-card { background: rgba(0,0,0,0.3); border-radius: 20px; padding: 25px; margin-bottom: 20px; text-align: center; }
        .character-avatar { font-size: 80px; margin-bottom: 15px; cursor: pointer; transition: transform 0.1s; }
        .character-avatar:hover { transform: scale(1.05); }
        .character-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .character-mood { font-size: 14px; opacity: 0.8; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .stat-card { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4ecdc4; }
        .stat-label { font-size: 12px; opacity: 0.8; margin-top: 5px; }
        .energy-bar { background: rgba(0,0,0,0.3); height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .energy-fill { background: linear-gradient(90deg, #4ecdc4, #44a08d); height: 100%; transition: width 0.5s; }
        .bond-bar { background: rgba(0,0,0,0.3); height: 15px; border-radius: 8px; overflow: hidden; margin: 8px 0; }
        .bond-fill { background: linear-gradient(90deg, #ff6b6b, #ff8e53); height: 100%; transition: width 0.5s; }
        .tap-button { background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; border: none; padding: 35px; border-radius: 50%; font-size: 28px; cursor: pointer; width: 160px; height: 160px; margin: 20px auto; display: block; transition: all 0.2s; box-shadow: 0 8px 25px rgba(255,107,107,0.4); }
        .tap-button:hover { transform: scale(1.05); box-shadow: 0 12px 35px rgba(255,107,107,0.5); }
        .tap-button:active { transform: scale(0.95); }
        .tap-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .action-btn { background: rgba(76, 205, 196, 0.8); color: white; border: none; padding: 15px 12px; border-radius: 12px; cursor: pointer; font-size: 14px; transition: all 0.3s; }
        .action-btn:hover { background: rgba(76, 205, 196, 1); transform: translateY(-2px); }
        .action-btn.premium { background: linear-gradient(135deg, #667eea, #764ba2); }
        .message-area { background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; margin: 15px 0; min-height: 50px; }
        .chat-container { background: rgba(0,0,0,0.2); border-radius: 15px; padding: 20px; margin-bottom: 20px; max-height: 300px; overflow-y: auto; }
        .chat-message { margin-bottom: 15px; }
        .chat-user { text-align: right; }
        .chat-user .bubble { background: rgba(76, 205, 196, 0.8); padding: 10px 15px; border-radius: 18px 18px 5px 18px; display: inline-block; max-width: 80%; }
        .chat-char { text-align: left; }
        .chat-char .bubble { background: rgba(255, 255, 255, 0.1); padding: 10px 15px; border-radius: 18px 18px 18px 5px; display: inline-block; max-width: 80%; }
        .chat-input-area { display: flex; gap: 10px; margin-top: 15px; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.1); border: none; padding: 12px 15px; border-radius: 25px; color: white; }
        .chat-input::placeholder { color: rgba(255,255,255,0.6); }
        .send-btn { background: #4ecdc4; border: none; padding: 12px 20px; border-radius: 25px; color: white; cursor: pointer; }
        .upgrades-grid { display: grid; gap: 12px; }
        .upgrade-card { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; }
        .upgrade-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .upgrade-cost { color: #4ecdc4; font-weight: bold; }
        .buy-btn { background: #4ecdc4; border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-size: 12px; }
        .vip-banner { background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333; padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 20px; font-weight: bold; }
        .admin-panel { background: rgba(255,0,0,0.1); border: 2px solid rgba(255,0,0,0.3); border-radius: 12px; padding: 15px; margin-top: 20px; }
        .admin-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .admin-btn { background: rgba(255,0,0,0.7); border: none; padding: 10px; border-radius: 8px; color: white; cursor: pointer; font-size: 12px; }
        .wheel-container { text-align: center; padding: 20px; }
        .wheel { width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(#ff6b6b 0deg 72deg, #4ecdc4 72deg 144deg, #667eea 144deg 216deg, #ffd700 216deg 288deg, #ff8e53 288deg 360deg); margin: 20px auto; position: relative; transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99); }
        .wheel-center { width: 40px; height: 40px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .spin-btn { background: #ffd700; color: #333; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        .loading { display: none; text-align: center; padding: 40px; }
        .spinner { border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .floating-lp { position: absolute; pointer-events: none; font-size: 20px; font-weight: bold; color: #4ecdc4; animation: floatUp 2s ease-out forwards; }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-100px); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="font-size: 28px; margin-bottom: 10px;">🎮 Character Tap Game</h1>
            <div style="font-size: 14px; opacity: 0.8;">Advanced Edition v2.0</div>
        </div>

        <div class="nav-tabs">
            <div class="nav-tab active" onclick="showTab('game')">🎯 Game</div>
            <div class="nav-tab" onclick="showTab('chat')">💬 Chat</div>
            <div class="nav-tab" onclick="showTab('upgrades')">⚡ Upgrades</div>
            <div class="nav-tab" onclick="showTab('wheel')">🎰 Wheel</div>
            <div class="nav-tab" onclick="showTab('vip')">👑 VIP</div>
        </div>

        <!-- GAME TAB -->
        <div id="game-tab" class="tab-content active">
            <div class="character-card">
                <div class="character-avatar" id="characterAvatar" onclick="tapCharacter()">👤</div>
                <div class="character-name" id="characterName">Luna</div>
                <div class="character-mood" id="characterMood">Feeling playful today~ 💕</div>
                
                <div>Bond Level: <span id="bondLevel">5</span></div>
                <div class="bond-bar">
                    <div class="bond-fill" id="bondFill" style="width: 60%"></div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="lpDisplay">12,450</div>
                    <div class="stat-label">Lust Points</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="levelDisplay">15</div>
                    <div class="stat-label">Level</div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                    <span>Energy</span>
                    <span><span id="energyDisplay">850</span> / <span id="maxEnergyDisplay">1000</span></span>
                </div>
                <div class="energy-bar">
                    <div class="energy-fill" id="energyFill" style="width: 85%"></div>
                </div>
            </div>

            <button class="tap-button" id="tapBtn" onclick="tapCharacter()">
                TAP
            </button>

            <div class="action-grid">
                <button class="action-btn" onclick="giftCharacter()">🎁 Gift</button>
                <button class="action-btn" onclick="playMinigame()">🎮 Mini Game</button>
                <button class="action-btn premium" onclick="unlockContent()">🔓 Unlock</button>
                <button class="action-btn" onclick="viewStats()">📊 Stats</button>
            </div>

            <div class="message-area" id="gameMessage">
                Welcome back! Luna missed you~ 💕
            </div>
        </div>

        <!-- CHAT TAB -->
        <div id="chat-tab" class="tab-content">
            <div class="chat-container" id="chatContainer">
                <div class="chat-message chat-char">
                    <div class="bubble">Hi there~ I'm Luna! Want to chat? 😊</div>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendMessage()">
                <button class="send-btn" onclick="sendMessage()">Send</button>
            </div>
        </div>

        <!-- UPGRADES TAB -->
        <div id="upgrades-tab" class="tab-content">
            <div class="upgrades-grid">
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div><strong>⚡ Energy Boost</strong></div>
                        <div class="upgrade-cost">250 LP</div>
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">+50 max energy</div>
                    <button class="buy-btn" onclick="buyUpgrade('energy')">Buy</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div><strong>💪 Tap Power</strong></div>
                        <div class="upgrade-cost">500 LP</div>
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">+1.5 LP per tap</div>
                    <button class="buy-btn" onclick="buyUpgrade('power')">Buy</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div><strong>❤️ Bond Multiplier</strong></div>
                        <div class="upgrade-cost">750 LP</div>
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">Faster bond growth</div>
                    <button class="buy-btn" onclick="buyUpgrade('bond')">Buy</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div><strong>🌟 VIP Access</strong></div>
                        <div class="upgrade-cost">2000 LP</div>
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">Unlock premium content</div>
                    <button class="buy-btn" onclick="buyUpgrade('vip')">Buy</button>
                </div>
            </div>
        </div>

        <!-- WHEEL TAB -->
        <div id="wheel-tab" class="tab-content">
            <div class="wheel-container">
                <div class="wheel" id="wheel">
                    <div class="wheel-center">🎯</div>
                </div>
                <button class="spin-btn" onclick="spinWheel()">Spin Wheel (100 LP)</button>
                <div style="margin-top: 20px; font-size: 14px;">
                    <div>🔴 500 LP • 🔵 Energy Refill</div>
                    <div>🟣 1000 LP • 🟡 Premium Item • 🟠 250 LP</div>
                </div>
            </div>
        </div>

        <!-- VIP TAB -->
        <div id="vip-tab" class="tab-content">
            <div class="vip-banner">
                👑 VIP EXCLUSIVE CONTENT 👑
            </div>
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                <div style="font-size: 18px; margin-bottom: 15px;">Premium Content Locked</div>
                <div style="opacity: 0.8; margin-bottom: 25px;">Purchase VIP access to unlock exclusive characters, outfits, and special interactions!</div>
                <button class="action-btn premium" onclick="purchaseVIP()">Unlock VIP - 2000 LP</button>
            </div>
        </div>

        <!-- ADMIN PANEL (Hidden by default) -->
        <div class="admin-panel" id="adminPanel" style="display: none;">
            <div><strong>🔧 Admin Debug Panel</strong></div>
            <div class="admin-controls">
                <button class="admin-btn" onclick="addLP(1000)">+1000 LP</button>
                <button class="admin-btn" onclick="fillEnergy()">Fill Energy</button>
                <button class="admin-btn" onclick="levelUp()">Level Up</button>
                <button class="admin-btn" onclick="toggleVIP()">Toggle VIP</button>
            </div>
        </div>
    </div>

    <script>
        console.log('🎮 Character Tap Game - Full Version loaded!');
        
        // Game State
        let gameState = {
            lp: 12450,
            energy: 850,
            maxEnergy: 1000,
            level: 15,
            bondLevel: 5,
            bondProgress: 60,
            lpPerTap: 3.5,
            vipUnlocked: false,
            character: {
                name: 'Luna',
                avatar: '👤',
                mood: 'Feeling playful today~ 💕'
            }
        };

        let isAdmin = false;

        // UI Functions
        function updateUI() {
            document.getElementById('lpDisplay').textContent = gameState.lp.toLocaleString();
            document.getElementById('levelDisplay').textContent = gameState.level;
            document.getElementById('energyDisplay').textContent = Math.floor(gameState.energy);
            document.getElementById('maxEnergyDisplay').textContent = gameState.maxEnergy;
            document.getElementById('bondLevel').textContent = gameState.bondLevel;
            
            const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
            document.getElementById('energyFill').style.width = energyPercent + '%';
            document.getElementById('bondFill').style.width = gameState.bondProgress + '%';
            
            document.getElementById('characterName').textContent = gameState.character.name;
            document.getElementById('characterMood').textContent = gameState.character.mood;
            document.getElementById('characterAvatar').textContent = gameState.character.avatar;
        }

        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
        }

        function showMessage(text, duration = 3000) {
            const msg = document.getElementById('gameMessage');
            msg.textContent = text;
            setTimeout(() => {
                msg.textContent = 'Welcome back! Luna missed you~ 💕';
            }, duration);
        }

        function createFloatingLP(amount) {
            const floating = document.createElement('div');
            floating.className = 'floating-lp';
            floating.textContent = '+' + amount + ' LP';
            floating.style.left = Math.random() * 300 + 'px';
            floating.style.top = '200px';
            document.body.appendChild(floating);
            setTimeout(() => floating.remove(), 2000);
        }

        // Game Actions
        function tapCharacter() {
            if (gameState.energy <= 0) {
                showMessage('No energy! Wait for regeneration...');
                return;
            }

            gameState.lp += gameState.lpPerTap;
            gameState.energy = Math.max(0, gameState.energy - 15);
            gameState.bondProgress = Math.min(100, gameState.bondProgress + 1);

            if (gameState.bondProgress >= 100) {
                gameState.bondLevel++;
                gameState.bondProgress = 0;
                gameState.lpPerTap += 0.5;
                showMessage('💕 Bond level increased! LP per tap increased!');
            }

            updateUI();
            createFloatingLP(gameState.lpPerTap);
            
            // Button animation
            const btn = document.getElementById('tapBtn');
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);

            // Character responses
            const responses = [
                'Mmm~ That felt good! 💕',
                'Keep going~ I love your touch! ✨',
                'You\\'re making me so happy! 😊',
                'More please~ 💖',
                'I can feel our bond growing stronger! 🌟'
            ];
            if (Math.random() < 0.3) {
                showMessage(responses[Math.floor(Math.random() * responses.length)]);
            }
        }

        function giftCharacter() {
            if (gameState.lp < 100) {
                showMessage('Not enough LP! Need 100 LP to give a gift.');
                return;
            }
            gameState.lp -= 100;
            gameState.bondProgress = Math.min(100, gameState.bondProgress + 10);
            updateUI();
            showMessage('🎁 Luna loves your gift! Bond increased! 💕');
        }

        function playMinigame() {
            const prize = Math.floor(Math.random() * 200) + 50;
            gameState.lp += prize;
            updateUI();
            showMessage('🎮 Mini-game complete! Won ' + prize + ' LP!');
        }

        function unlockContent() {
            if (!gameState.vipUnlocked) {
                showMessage('VIP access required! Purchase VIP to unlock premium content.');
                return;
            }
            showMessage('🔓 Premium content unlocked! New character interactions available!');
        }

        function viewStats() {
            showMessage(
                'Total LP: ' + gameState.lp.toLocaleString() + 
                ' | Level: ' + gameState.level + 
                ' | Bond: ' + gameState.bondLevel + 
                ' | LP/Tap: ' + gameState.lpPerTap
            );
        }

        // Chat System
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;

            addChatMessage(message, 'user');
            input.value = '';

            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    'That\\'s so sweet of you to say! 💕',
                    'I love chatting with you~ Tell me more! 😊',
                    'You always know what to say! ✨',
                    'Mmm~ You\\'re making me blush! 😳',
                    'I feel so close to you when we talk! 💖'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage(response, 'character');
            }, 1000);
        }

        function addChatMessage(text, sender) {
            const container = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message chat-' + (sender === 'user' ? 'user' : 'char');
            messageDiv.innerHTML = '<div class="bubble">' + text + '</div>';
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        }

        // Upgrade System
        function buyUpgrade(type) {
            const costs = { energy: 250, power: 500, bond: 750, vip: 2000 };
            const cost = costs[type];

            if (gameState.lp < cost) {
                showMessage('Not enough LP! Need ' + cost + ' LP for this upgrade.');
                return;
            }

            gameState.lp -= cost;

            switch(type) {
                case 'energy':
                    gameState.maxEnergy += 50;
                    showMessage('⚡ Energy capacity increased!');
                    break;
                case 'power':
                    gameState.lpPerTap += 1.5;
                    showMessage('💪 Tap power increased!');
                    break;
                case 'bond':
                    showMessage('❤️ Bond growth multiplier activated!');
                    break;
                case 'vip':
                    gameState.vipUnlocked = true;
                    showMessage('👑 VIP access unlocked! Premium content available!');
                    break;
            }
            updateUI();
        }

        // Wheel System
        function spinWheel() {
            if (gameState.lp < 100) {
                showMessage('Need 100 LP to spin the wheel!');
                return;
            }

            gameState.lp -= 100;
            updateUI();

            const wheel = document.getElementById('wheel');
            const rotations = Math.floor(Math.random() * 1800) + 1800; // 5-10 full rotations
            wheel.style.transform = 'rotate(' + rotations + 'deg)';

            setTimeout(() => {
                const prizes = [
                    { name: '500 LP', lp: 500 },
                    { name: 'Energy Refill', energy: true },
                    { name: '1000 LP', lp: 1000 },
                    { name: 'Premium Item', special: true },
                    { name: '250 LP', lp: 250 }
                ];

                const prize = prizes[Math.floor(Math.random() * prizes.length)];

                if (prize.lp) {
                    gameState.lp += prize.lp;
                }
                if (prize.energy) {
                    gameState.energy = gameState.maxEnergy;
                }

                updateUI();
                showMessage('🎰 Wheel Prize: ' + prize.name + '!');
                
                wheel.style.transform = 'rotate(0deg)';
            }, 3000);
        }

        // VIP System
        function purchaseVIP() {
            if (gameState.lp < 2000) {
                showMessage('Need 2000 LP for VIP access!');
                return;
            }
            gameState.lp -= 2000;
            gameState.vipUnlocked = true;
            updateUI();
            showMessage('👑 VIP access purchased! Premium content unlocked!');
        }

        // Admin Functions
        function addLP(amount) {
            gameState.lp += amount;
            updateUI();
            showMessage('🔧 Admin: Added ' + amount + ' LP');
        }

        function fillEnergy() {
            gameState.energy = gameState.maxEnergy;
            updateUI();
            showMessage('🔧 Admin: Energy refilled');
        }

        function levelUp() {
            gameState.level++;
            gameState.lpPerTap += 1;
            updateUI();
            showMessage('🔧 Admin: Level increased');
        }

        function toggleVIP() {
            gameState.vipUnlocked = !gameState.vipUnlocked;
            updateUI();
            showMessage('🔧 Admin: VIP ' + (gameState.vipUnlocked ? 'enabled' : 'disabled'));
        }

        // Auto-regenerate energy
        setInterval(() => {
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy = Math.min(gameState.energy + 8, gameState.maxEnergy);
                updateUI();
            }
        }, 5000);

        // Admin panel toggle (triple-click header)
        let clickCount = 0;
        document.querySelector('.header h1').addEventListener('click', () => {
            clickCount++;
            setTimeout(() => clickCount = 0, 1000);
            if (clickCount === 3) {
                isAdmin = !isAdmin;
                document.getElementById('adminPanel').style.display = isAdmin ? 'block' : 'none';
                showMessage(isAdmin ? '🔧 Admin mode enabled' : '🔧 Admin mode disabled');
            }
        });

        // Initialize
        updateUI();
        console.log('🎯 Full Character Tap Game ready!');
    </script>
</body>
</html>`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Character Tap Game server running on port ${PORT}`);
  console.log(`🔗 Preview URL: https://05822bd3-d68c-4746-801b-bfd0933e7027-00-1rtxwdutqu2w1.picard.replit.dev`);
  console.log('✅ Server started successfully! Game is ready to play!');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

console.log('🚀 Server initialization complete!');