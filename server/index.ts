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

// Main game route
app.get('/', (req, res) => {
  console.log('🏠 ROOT route - serving game!');
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Character Tap Game</title>
</head>
<body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px; min-height: 100vh; margin: 0;">
    <h1 style="font-size: 3em; margin-bottom: 30px;">🎮 Character Tap Game</h1>
    <p style="font-size: 1.5em; margin-bottom: 30px;">Welcome to your tap game!</p>
    
    <div style="background: rgba(0,0,0,0.3); padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 400px;">
        <div style="font-size: 4em; margin-bottom: 20px;">👤</div>
        <h2>Game Stats</h2>
        <div style="font-size: 1.2em; line-height: 1.5;">
            <div><strong>LP:</strong> <span id="lp">1250</span></div>
            <div><strong>Energy:</strong> <span id="energy">850</span>/1000</div>
            <div><strong>Level:</strong> 5</div>
        </div>
    </div>
    
    <button id="tapBtn" style="background: #ff6b6b; color: white; border: none; padding: 30px; border-radius: 50%; font-size: 24px; cursor: pointer; width: 150px; height: 150px; margin: 20px; transition: transform 0.1s;" onclick="tapCharacter()">
        TAP
    </button>
    
    <div style="margin-top: 30px;">
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="spinWheel()">🎰 Spin Wheel</button>
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="showStats()">📊 Stats</button>
    </div>
    
    <div id="message" style="margin-top: 20px; font-size: 1.2em; min-height: 30px; padding: 10px; border-radius: 8px;"></div>
    
    <p style="margin-top: 40px; opacity: 0.8;">✅ Game server is running perfectly!</p>
    
    <script>
        console.log('🎮 Character Tap Game loaded!');
        
        let gameState = {
            lp: 1250,
            energy: 850,
            maxEnergy: 1000,
            level: 5,
            lpPerTap: 2.5
        };
        
        function updateUI() {
            document.getElementById('lp').textContent = Math.floor(gameState.lp);
            document.getElementById('energy').textContent = Math.floor(gameState.energy);
        }
        
        function showMessage(text, bgColor = 'rgba(76, 205, 196, 0.3)') {
            const msg = document.getElementById('message');
            msg.style.background = bgColor;
            msg.textContent = text;
            setTimeout(() => {
                msg.textContent = '';
                msg.style.background = '';
            }, 3000);
        }
        
        function tapCharacter() {
            if (gameState.energy <= 0) {
                showMessage('Not enough energy! Wait for regeneration...', 'rgba(255, 107, 107, 0.3)');
                return;
            }
            
            // Gain LP and lose energy
            gameState.lp += gameState.lpPerTap;
            gameState.energy = Math.max(0, gameState.energy - 10);
            
            updateUI();
            showMessage('+' + gameState.lpPerTap + ' LP! Keep tapping!', 'rgba(76, 205, 196, 0.3)');
            
            // Button animation
            const btn = document.getElementById('tapBtn');
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);
            
            // Level up check
            if (gameState.lp >= gameState.level * 1000) {
                gameState.level++;
                gameState.lpPerTap += 0.5;
                showMessage('🎉 LEVEL UP! Now level ' + gameState.level + '!', 'rgba(255, 215, 0, 0.3)');
            }
        }
        
        function spinWheel() {
            const prizes = [
                { name: '100 LP', lp: 100 },
                { name: '250 LP', lp: 250 },
                { name: '50 LP', lp: 50 },
                { name: 'Full Energy', energy: true },
                { name: '500 LP', lp: 500 }
            ];
            
            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            
            if (prize.lp) {
                gameState.lp += prize.lp;
            }
            if (prize.energy) {
                gameState.energy = gameState.maxEnergy;
            }
            
            updateUI();
            showMessage('🎰 Wheel Prize: ' + prize.name + '!', 'rgba(255, 215, 0, 0.3)');
        }
        
        function showStats() {
            const totalValue = Math.floor(gameState.lp);
            const energyPercent = Math.floor((gameState.energy / gameState.maxEnergy) * 100);
            showMessage(
                'Total LP: ' + totalValue + ' | Energy: ' + energyPercent + '% | LP per Tap: ' + gameState.lpPerTap,
                'rgba(156, 39, 176, 0.3)'
            );
        }
        
        // Auto-regenerate energy every 3 seconds
        setInterval(() => {
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy = Math.min(gameState.energy + 5, gameState.maxEnergy);
                updateUI();
            }
        }, 3000);
        
        console.log('🎯 Game ready! Click TAP to start playing!');
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