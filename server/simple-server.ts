/**
 * Simple Game Server - Character Tap Game
 * Clean, single-file server to avoid conflicts
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
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
  console.log('🏠 ROOT route hit!');
  
  const html = `<!DOCTYPE html>
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
            <div><strong>LP:</strong> 1,250</div>
            <div><strong>Energy:</strong> 850/1000</div>
            <div><strong>Level:</strong> 5</div>
        </div>
    </div>
    
    <button style="background: #ff6b6b; color: white; border: none; padding: 30px; border-radius: 50%; font-size: 24px; cursor: pointer; width: 150px; height: 150px; margin: 20px;" onclick="tapCharacter()">
        TAP
    </button>
    
    <div style="margin-top: 30px;">
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="spinWheel()">🎰 Spin Wheel</button>
        <button style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; margin: 10px; font-size: 16px; cursor: pointer;" onclick="showStats()">📊 Stats</button>
    </div>
    
    <div id="message" style="margin-top: 20px; font-size: 1.2em; min-height: 30px;"></div>
    
    <p style="margin-top: 40px; opacity: 0.8;">✅ Game server is running perfectly!</p>
    
    <script>
        console.log('🎮 Game loaded successfully!');
        
        let gameState = {
            lp: 1250,
            energy: 850,
            maxEnergy: 1000,
            level: 5
        };
        
        function showMessage(text, color = '#fff') {
            const msg = document.getElementById('message');
            msg.style.color = color;
            msg.textContent = text;
            setTimeout(() => msg.textContent = '', 3000);
        }
        
        function tapCharacter() {
            if (gameState.energy <= 0) {
                showMessage('Not enough energy!', '#ff6b6b');
                return;
            }
            
            gameState.lp += 2.5;
            gameState.energy -= 10;
            
            updateStats();
            showMessage('+2.5 LP!', '#4ecdc4');
            
            // Animation
            const btn = event.target;
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = '', 100);
        }
        
        function spinWheel() {
            const prizes = ['100 LP', '50 LP', '200 LP', '5 Energy', '25 LP'];
            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            showMessage('🎉 Won: ' + prize + '!', '#4ecdc4');
        }
        
        function showStats() {
            showMessage('Total LP: ' + Math.floor(gameState.lp) + ' | Level: ' + gameState.level + ' | Energy: ' + Math.floor(gameState.energy), '#4ecdc4');
        }
        
        function updateStats() {
            document.body.innerHTML = document.body.innerHTML.replace(
                /<strong>LP:<\/strong> \\d+/,
                '<strong>LP:</strong> ' + Math.floor(gameState.lp)
            ).replace(
                /<strong>Energy:<\/strong> \\d+\\/1000/,
                '<strong>Energy:</strong> ' + Math.floor(gameState.energy) + '/1000'
            );
        }
        
        // Auto-regenerate energy
        setInterval(() => {
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy = Math.min(gameState.energy + 2, gameState.maxEnergy);
                updateStats();
            }
        }, 3000);
        
        console.log('🎯 Game ready to play!');
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Simple API endpoints for demo
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎮 Character Tap Game server running on port ' + PORT);
  console.log('🔗 Game available at: http://localhost:' + PORT);
  console.log('✅ Server started successfully!');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});