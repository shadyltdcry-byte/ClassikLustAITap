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

// Main game route - ClassikLust Game
app.get('/', (req, res) => {
  console.log('🏠 ROOT route - serving ClassikLust Game!');
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClassikLust</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #2d1b4e 0%, #5a1a1a 50%, #3d1a4e 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        /* Loading Screen */
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, #1a0033 0%, #330066 50%, #660033 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: opacity 0.5s ease-out;
        }
        
        .loading-screen.hidden { opacity: 0; pointer-events: none; }
        
        .logo {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #ff4081, #e91e63);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: white;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(233, 30, 99, 0.3);
        }
        
        .app-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #ff4081, #e91e63);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 30px;
        }
        
        .version {
            font-size: 14px;
            opacity: 0.6;
            margin-bottom: 40px;
        }
        
        .loading-text {
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .loading-bar {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .loading-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4081, #e91e63);
            border-radius: 2px;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .loading-dots {
            display: flex;
            gap: 5px;
        }
        
        .dot {
            width: 8px;
            height: 8px;
            background: #ff4081;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }
        
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Main Game Interface */
        .main-container {
            max-width: 420px;
            margin: 0 auto;
            min-height: 100vh;
            background: linear-gradient(135deg, #2d1b4e 0%, #5a1a1a 50%, #3d1a4e 100%);
            position: relative;
        }
        
        /* Header Layout */
        .game-header {
            padding: 15px 10px;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }
        
        .user-section {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 80px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ff4081"/><text x="50" y="58" text-anchor="middle" fill="white" font-size="24" font-weight="bold">S</text></svg>');
            background-size: cover;
        }
        
        .user-info {
            color: white;
        }
        
        .user-info h3 {
            font-size: 13px;
            margin-bottom: 2px;
            font-weight: bold;
        }
        
        .user-info .level {
            font-size: 11px;
            opacity: 0.8;
        }
        
        .currency-section {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 90px;
        }
        
        .currency-row {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
        }
        
        .lp-per-hour-section {
            background: linear-gradient(135deg, #d84315, #bf360c);
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            min-width: 60px;
            color: white;
        }
        
        .lp-hour-title {
            font-size: 9px;
            margin-bottom: 2px;
            opacity: 0.9;
        }
        
        .lp-hour-value {
            font-size: 12px;
            font-weight: bold;
            margin: 2px 0;
        }
        
        .lp-hour-amount {
            font-size: 10px;
        }
        
        .energy-section {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 90px;
            font-size: 11px;
        }
        
        .energy-booster {
            background: linear-gradient(135deg, #1565c0, #0d47a1);
            border-radius: 6px;
            padding: 4px 6px;
            text-align: center;
            font-size: 9px;
            color: white;
        }
        
        .settings-btn {
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
        }
        
        /* Character Card */
        .character-section {
            padding: 20px 15px;
            text-align: center;
        }
        
        .character-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            border: 2px solid rgba(233, 30, 99, 0.3);
        }
        
        .character-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .character-description {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 20px;
        }
        
        .character-image {
            width: 300px;
            height: 400px;
            background: linear-gradient(135deg, #424242, #616161);
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ffdbcc"/><stop offset="100%" style="stop-color:%23f4c2a1"/></linearGradient><linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%232d1b1b"/><stop offset="100%" style="stop-color:%231a0e0e"/></linearGradient></defs><rect width="300" height="400" fill="%23f0f0f0"/><ellipse cx="150" cy="180" rx="80" ry="100" fill="url(%23skin)"/><path d="M80 120 Q150 80 220 120 Q200 100 180 110 Q150 100 120 110 Q100 100 80 120" fill="url(%23hair)"/><circle cx="130" cy="160" r="8" fill="%23333"/><circle cx="170" cy="160" r="8" fill="%23333"/><path d="M140 180 Q150 190 160 180" stroke="%23333" stroke-width="2" fill="none"/><path d="M135 200 Q150 210 165 200" stroke="%23ff69b4" stroke-width="3" fill="none"/><text x="150" y="350" text-anchor="middle" fill="%23333" font-size="16" font-weight="bold">Luna</text></svg>');
            background-size: cover;
            background-position: center;
            border-radius: 15px;
            margin: 0 auto 20px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            border: 3px solid rgba(233, 30, 99, 0.5);
            cursor: pointer;
            transition: transform 0.2s;
            font-size: 0;
        }
        
        .character-image:hover {
            transform: scale(1.02);
        }
        
        .character-image:active {
            transform: scale(0.98);
        }
        
        /* Bottom Navigation */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 420px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px 0;
            display: flex;
            justify-content: space-around;
            z-index: 100;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 12px;
            gap: 4px;
        }
        
        .nav-item.active {
            background: rgba(233, 30, 99, 0.2);
            color: #ff4081;
        }
        
        .nav-item .icon {
            font-size: 20px;
        }
        
        .nav-item .label {
            font-size: 10px;
            font-weight: 500;
        }
        
        /* Modal */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: linear-gradient(135deg, #7b1fa2, #8e24aa);
            border-radius: 20px;
            padding: 30px;
            margin: 20px;
            text-align: center;
            max-width: 350px;
            position: relative;
        }
        
        .modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        
        .modal h2 {
            margin-bottom: 15px;
            font-size: 24px;
        }
        
        .passive-income {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .passive-income .amount {
            font-size: 36px;
            font-weight: bold;
            color: #4caf50;
            margin-bottom: 10px;
        }
        
        .claim-btn {
            background: linear-gradient(135deg, #ff4081, #e91e63);
            border: none;
            color: white;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
        }
        
        /* Page Content */
        .page-content {
            display: none;
            padding: 20px 15px 100px;
        }
        
        .page-content.active {
            display: block;
        }
        
        /* Upgrades Page */
        .upgrade-categories {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            padding: 0 5px;
        }
        
        .category-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .category-btn.active {
            background: linear-gradient(135deg, #ff4081, #e91e63);
        }
        
        .upgrades-list {
            display: grid;
            gap: 12px;
        }
        
        .upgrade-item {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .upgrade-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #7b1fa2, #8e24aa);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        
        .upgrade-info {
            flex: 1;
        }
        
        .upgrade-info h3 {
            font-size: 16px;
            margin-bottom: 4px;
        }
        
        .upgrade-info .level {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 4px;
        }
        
        .upgrade-info .cost {
            font-size: 14px;
            color: #4caf50;
            font-weight: bold;
        }
        
        .purchase-btn {
            background: rgba(76, 175, 80, 0.8);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
        }
        
        /* Tasks Page */
        .tasks-header {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .tasks-btn {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 12px;
            border-radius: 12px;
            cursor: pointer;
        }
        
        .tasks-btn.active {
            background: linear-gradient(135deg, #ff4081, #e91e63);
        }
        
        .achievement-progress {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .progress-ring {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: conic-gradient(#ff4081 0deg 90deg, rgba(255, 255, 255, 0.1) 90deg 360deg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 24px;
            font-weight: bold;
        }
        
        .task-item {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .task-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ff8f00, #ff6f00);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .task-info {
            flex: 1;
        }
        
        .task-info h4 {
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .task-progress {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 4px;
        }
        
        .task-reward {
            font-size: 12px;
            color: #4caf50;
        }
        
        /* Chat Page */
        .chat-header {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .chat-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff4081, #e91e63);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .chat-info h3 {
            font-size: 18px;
            margin-bottom: 4px;
        }
        
        .chat-status {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .chat-actions {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .chat-action-btn {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 12px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .chat-action-btn.active {
            background: linear-gradient(135deg, #ff4081, #e91e63);
        }
        
        /* Admin Panel */
        .admin-modal {
            background: rgba(0, 0, 0, 0.95);
            border-radius: 20px;
            padding: 30px;
            margin: 20px;
            max-width: 380px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .admin-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }
        
        .admin-tab {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
        }
        
        .admin-tab.active {
            background: linear-gradient(135deg, #7b1fa2, #8e24aa);
        }
        
        .admin-section {
            display: none;
            margin-bottom: 20px;
        }
        
        .admin-section.active {
            display: block;
        }
        
        .admin-character {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 12px;
        }
        
        .character-controls {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        
        .control-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 10px;
            cursor: pointer;
        }
        
        .floating-lp {
            position: absolute;
            font-size: 18px;
            font-weight: bold;
            color: #4caf50;
            pointer-events: none;
            animation: floatUp 2s ease-out forwards;
            z-index: 50;
        }
        
        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-80px); }
        }
    </style>
</head>
<body>
    <!-- Loading Screen -->
    <div class="loading-screen" id="loadingScreen">
        <div class="logo">CL</div>
        <div class="app-title">ClassikLust</div>
        <div class="subtitle">🚀 New Auto-Authentication</div>
        <div class="subtitle">Featured Click/start in Telegram<br>for instant login!</div>
        <div class="version">v2.0.0</div>
        <div class="loading-text">Loading user data... <span id="loadingPercent">0</span>%</div>
        <div class="loading-bar">
            <div class="loading-fill" id="loadingFill"></div>
        </div>
        <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    </div>

    <!-- Main Game Container -->
    <div class="main-container" id="mainContainer" style="display: none;">
        <!-- Game Header -->
        <div class="game-header">
            <div class="user-section">
                <div class="user-avatar"></div>
                <div class="user-info">
                    <h3>ShadyLTDx</h3>
                    <div class="level">Level: <span id="userLevel">1</span></div>
                </div>
            </div>
            
            <div class="currency-section">
                <div class="currency-row">
                    <span style="color: #ff4081;">💎</span>
                    <span>LustPoints: <span id="lustPoints">5026</span></span>
                </div>
                <div class="currency-row">
                    <span style="color: #9c27b0;">💜</span>
                    <span>Lust Gems: <span id="lustGems">0</span></span>
                </div>
            </div>
            
            <div class="lp-per-hour-section">
                <div class="lp-hour-title">LP per Hour</div>
                <div class="lp-hour-value">🔥 ∞ 🔥</div>
                <div class="lp-hour-amount">250</div>
            </div>
            
            <div class="energy-section">
                <div style="color: #4fc3f7;">⚡ Energy: <span id="energy">987</span>/<span id="maxEnergy">1000</span></div>
                <div class="energy-booster">
                    Boosters<br>
                    +20% LP [2:30]
                </div>
            </div>
            
            <button class="settings-btn" onclick="toggleAdminPanel()">⚙️</button>
        </div>

        <!-- Main Game Content -->
        <div class="page-content active" id="mainPage">
            <div class="character-section">
                <div class="character-card">
                    <div class="character-name">Luna</div>
                    <div class="character-description">An enigmatic character with deep knowledge</div>
                    <div class="character-image" onclick="tapCharacter()"></div>
                </div>
            </div>
        </div>

        <!-- Upgrades Page -->
        <div class="page-content" id="upgradesPage">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="font-size: 24px;">⭐</div>
                <div>
                    <h2>Upgrades</h2>
                    <div style="font-size: 14px; opacity: 0.7;">Enhance your character's abilities</div>
                </div>
                <div style="margin-left: auto; font-size: 18px; color: #4caf50;">💎 <span id="upgradeLP">0</span> LP</div>
            </div>
            
            <div class="upgrade-categories">
                <button class="category-btn active">⭐ All</button>
                <button class="category-btn">💎 LP per Hour</button>
                <button class="category-btn">⚡ Energy</button>
                <button class="category-btn">✨ Special</button>
            </div>
            
            <div class="upgrades-list">
                <div class="upgrade-item">
                    <div class="upgrade-icon">🔧</div>
                    <div class="upgrade-info">
                        <h3>Increase Charm</h3>
                        <div class="level">🔼 150</div>
                        <div class="cost">💎 1500 LP</div>
                    </div>
                    <button class="purchase-btn" onclick="buyUpgrade('charm')">Purchase</button>
                </div>
                
                <div class="upgrade-item">
                    <div class="upgrade-icon">🔧</div>
                    <div class="upgrade-info">
                        <h3>Physical Appeal</h3>
                        <div class="level">🔼 1</div>
                        <div class="cost">💎 2500 LP</div>
                    </div>
                    <button class="purchase-btn" onclick="buyUpgrade('appeal')">Purchase</button>
                </div>
                
                <div class="upgrade-item">
                    <div class="upgrade-icon">⚡</div>
                    <div class="upgrade-info">
                        <h3>Personal Magnetism</h3>
                        <div class="level">🔼 100</div>
                        <div class="cost">💎 1500 LP</div>
                    </div>
                    <button class="purchase-btn" onclick="buyUpgrade('magnetism')">Purchase</button>
                </div>
            </div>
        </div>

        <!-- Tasks Page -->
        <div class="page-content" id="tasksPage">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="font-size: 24px;">⚡</div>
                <div>
                    <h2>Tasks & Achievements</h2>
                    <div style="font-size: 14px; opacity: 0.7;">Complete tasks and unlock achievements</div>
                </div>
            </div>
            
            <div class="tasks-header">
                <button class="tasks-btn active">⚡ Tasks</button>
                <button class="tasks-btn">🏆 Achievements</button>
            </div>
            
            <div class="achievement-progress">
                <div class="progress-ring">25%</div>
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">ACHIEVEMENTS UNLOCKED</div>
                <div style="font-size: 14px; opacity: 0.7;">Milestone Rewards<br>Unlock chests as you progress</div>
            </div>
            
            <div class="task-item">
                <div class="task-icon">🏆</div>
                <div class="task-info">
                    <h4>First Steps</h4>
                    <div class="task-progress">Progress: 1/1</div>
                    <div class="task-reward">Reward: 100 LP</div>
                </div>
                <button class="purchase-btn" style="background: #4caf50;">Claim</button>
            </div>
            
            <div class="task-item">
                <div class="task-icon">💬</div>
                <div class="task-info">
                    <h4>Chat Enthusiast</h4>
                    <div class="task-progress">Progress: 7/10</div>
                    <div class="task-reward">Reward: 200 LP</div>
                </div>
                <button class="purchase-btn" style="background: rgba(255,193,7,0.8);">In Progress</button>
            </div>
        </div>

        <!-- Chat Page -->
        <div class="page-content" id="chatPage">
            <div class="chat-header">
                <div class="chat-avatar">L</div>
                <div class="chat-info">
                    <h3>Luna</h3>
                    <div class="chat-status">Online • Loves to chat</div>
                    <div style="font-size: 12px; margin-top: 4px;">Have conversations with your favorite character.</div>
                </div>
            </div>
            
            <div class="chat-actions">
                <button class="chat-action-btn active">💬 Chat</button>
                <button class="chat-action-btn">😊 Moods</button>
                <button class="chat-action-btn">🎁 Gifts</button>
            </div>
            
            <div style="background: rgba(0,0,0,0.2); border-radius: 15px; padding: 20px; margin-bottom: 20px; min-height: 200px;">
                <div style="text-align: center; opacity: 0.7; padding: 40px;">
                    Start a conversation with Luna!
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <input type="text" placeholder="Message Luna..." style="flex: 1; background: rgba(255,255,255,0.1); border: none; color: white; padding: 12px 15px; border-radius: 25px;">
                <button style="background: #ff4081; border: none; color: white; padding: 12px 20px; border-radius: 25px; cursor: pointer;">Send</button>
            </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-nav">
            <div class="nav-item active" onclick="showPage('main')">
                <div class="icon">❤️</div>
                <div class="label">Main</div>
            </div>
            <div class="nav-item" onclick="showPage('levelup')">
                <div class="icon">⭐</div>
                <div class="label">Level Up</div>
            </div>
            <div class="nav-item" onclick="showPage('upgrades')">
                <div class="icon">📈</div>
                <div class="label">Upgrades</div>
            </div>
            <div class="nav-item" onclick="showPage('tasks')">
                <div class="icon">⚡</div>
                <div class="label">Tasks</div>
            </div>
            <div class="nav-item" onclick="showPage('chat')">
                <div class="icon">💬</div>
                <div class="label">Chat</div>
            </div>
        </div>
    </div>

    <!-- Welcome Back Modal -->
    <div class="modal" id="welcomeModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('welcomeModal')">&times;</button>
            <h2>Welcome Back!</h2>
            <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin: 15px 0;">
                <div style="font-size: 24px;">⏰</div>
                <div>You were away for <strong>99h 42m</strong></div>
            </div>
            <div class="passive-income">
                <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 10px;">
                    <div style="font-size: 24px;">🎁</div>
                    <div style="font-size: 16px;">Passive Income Earned</div>
                </div>
                <div class="amount">+750 LP</div>
                <div style="font-size: 12px; opacity: 0.7; margin-top: 10px;">⚠️ You must claim this to resume passive income collection!</div>
            </div>
            <button class="claim-btn" onclick="claimPassiveIncome()">❤️ Claim Passive Income</button>
        </div>
    </div>

    <!-- Admin Panel Modal -->
    <div class="modal" id="adminModal">
        <div class="admin-modal">
            <button class="modal-close" onclick="closeModal('adminModal')">&times;</button>
            <h2 style="margin-bottom: 15px;">⚙️ Admin Control Panel</h2>
            <div style="font-size: 14px; opacity: 0.7; margin-bottom: 20px;">Manage characters, debug, and system tools</div>
            
            <div class="admin-tabs">
                <button class="admin-tab active" onclick="showAdminTab('characters')">👥 Characters</button>
                <button class="admin-tab" onclick="showAdminTab('gameplay')">🎮 Gameplay</button>
                <button class="admin-tab" onclick="showAdminTab('debug')">🔧 Debug Tools</button>
                <button class="admin-tab" onclick="showAdminTab('system')">💾 System</button>
            </div>
            
            <div class="admin-section active" id="adminCharacters">
                <h3 style="margin-bottom: 15px;">Character Management</h3>
                <div class="admin-character">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <div><strong>Luna</strong></div>
                        <button style="background: #ff4081; border: none; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px;">+ Create Character</button>
                    </div>
                    <div style="font-size: 12px; opacity: 0.7; margin-bottom: 8px;">playful • Level 1+ • ID: 550e8400...</div>
                    <div class="character-controls">
                        <button class="control-btn" style="background: linear-gradient(135deg, #ff8f00, #ff6f00);">👑 VIP</button>
                        <button class="control-btn" style="background: linear-gradient(135deg, #f44336, #d32f2f);">🔞 NSFW</button>
                        <div style="font-size: 10px; margin-left: auto; padding: 4px 8px;">Enabled</div>
                    </div>
                </div>
            </div>
            
            <div class="admin-section" id="adminGameplay">
                <h3 style="margin-bottom: 15px;">Level System</h3>
                <button style="background: linear-gradient(135deg, #ff8f00, #ff6f00); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 15px;">⚡ Admin Level Manager</button>
                
                <h3 style="margin-bottom: 15px;">Upgrades</h3>
                <button style="background: linear-gradient(135deg, #2196f3, #1976d2); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 15px;">⚡ Upgrade Manager</button>
                
                <h3 style="margin-bottom: 15px;">Tasks</h3>
                <button style="background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%;">⚡ Task Manager</button>
            </div>
            
            <div class="admin-section" id="adminDebug">
                <h3 style="margin-bottom: 15px;">Debug Tools</h3>
                <button style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px;" onclick="addLP(1000)">💎 Add 1000 LP</button>
                <button style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px;" onclick="fillEnergy()">⚡ Fill Energy</button>
                <button style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); border: none; color: white; padding: 12px; border-radius: 8px; width: 100%;" onclick="levelUp()">⭐ Level Up</button>
            </div>
            
            <div class="admin-section" id="adminSystem">
                <h3 style="margin-bottom: 15px;">System Status</h3>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Server:</span>
                        <span style="color: #4caf50;">Online</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Database:</span>
                        <span style="color: #4caf50;">Connected</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Characters:</span>
                        <span>2</span>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 15px;">Quick Actions</h3>
                <button style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 8px;">💾 Backup Database</button>
                <button style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 8px;">🗑️ Clear Cache</button>
                <button style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 10px; border-radius: 8px; width: 100%;">📋 View Logs</button>
            </div>
        </div>
    </div>

    <script>
        console.log('🎮 ClassikLust loaded!');
        
        // Game State
        let gameState = {
            lustPoints: 5026,
            lustGems: 0,
            energy: 987,
            maxEnergy: 1000,
            level: 1,
            passiveIncome: 750,
            character: {
                name: 'Luna',
                level: 1
            }
        };

        // Initialize game
        function initGame() {
            // Show loading screen
            let progress = 0;
            const loadingInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 100) progress = 100;
                
                document.getElementById('loadingPercent').textContent = Math.floor(progress);
                document.getElementById('loadingFill').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(loadingInterval);
                    setTimeout(() => {
                        document.getElementById('loadingScreen').classList.add('hidden');
                        document.getElementById('mainContainer').style.display = 'block';
                        showWelcomeBack();
                    }, 500);
                }
            }, 100);
        }

        function showWelcomeBack() {
            setTimeout(() => {
                document.getElementById('welcomeModal').classList.add('active');
            }, 1000);
        }

        function claimPassiveIncome() {
            gameState.lustPoints += gameState.passiveIncome;
            updateUI();
            closeModal('welcomeModal');
            createFloatingLP(gameState.passiveIncome);
        }

        function tapCharacter() {
            if (gameState.energy <= 0) return;
            
            const lpGain = 10;
            gameState.lustPoints += lpGain;
            gameState.energy = Math.max(0, gameState.energy - 5);
            
            updateUI();
            createFloatingLP(lpGain);
            
            // Character animation
            const charImg = document.querySelector('.character-image');
            charImg.style.transform = 'scale(0.95)';
            setTimeout(() => charImg.style.transform = 'scale(1)', 150);
        }

        function createFloatingLP(amount) {
            const floating = document.createElement('div');
            floating.className = 'floating-lp';
            floating.textContent = '+' + amount + ' LP';
            floating.style.left = Math.random() * 200 + 100 + 'px';
            floating.style.top = '400px';
            document.querySelector('.main-container').appendChild(floating);
            setTimeout(() => floating.remove(), 2000);
        }

        function updateUI() {
            document.getElementById('lustPoints').textContent = gameState.lustPoints.toLocaleString();
            document.getElementById('lustGems').textContent = gameState.lustGems;
            document.getElementById('energy').textContent = gameState.energy;
            document.getElementById('maxEnergy').textContent = gameState.maxEnergy;
            document.getElementById('userLevel').textContent = gameState.level;
            document.getElementById('upgradeLP').textContent = gameState.lustPoints;
        }

        function showPage(page) {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            // Show selected page
            if (page === 'main') {
                document.getElementById('mainPage').classList.add('active');
            } else if (page === 'upgrades') {
                document.getElementById('upgradesPage').classList.add('active');
            } else if (page === 'tasks') {
                document.getElementById('tasksPage').classList.add('active');
            } else if (page === 'chat') {
                document.getElementById('chatPage').classList.add('active');
            }
            
            // Update nav
            event.target.closest('.nav-item').classList.add('active');
        }

        function buyUpgrade(type) {
            const costs = { charm: 1500, appeal: 2500, magnetism: 1500 };
            const cost = costs[type];
            
            if (gameState.lustPoints >= cost) {
                gameState.lustPoints -= cost;
                updateUI();
                createFloatingLP(-cost);
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function toggleAdminPanel() {
            document.getElementById('adminModal').classList.add('active');
        }

        function showAdminTab(tab) {
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
            event.target.classList.add('active');
        }

        // Admin Functions
        function addLP(amount) {
            gameState.lustPoints += amount;
            updateUI();
            createFloatingLP(amount);
        }

        function fillEnergy() {
            gameState.energy = gameState.maxEnergy;
            updateUI();
        }

        function levelUp() {
            gameState.level++;
            updateUI();
        }

        // Auto energy regeneration
        setInterval(() => {
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy = Math.min(gameState.energy + 3, gameState.maxEnergy);
                updateUI();
            }
        }, 10000);

        // Initialize the game
        initGame();
        updateUI();
        
        console.log('🎯 ClassikLust ready!');
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