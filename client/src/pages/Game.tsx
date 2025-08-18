/**
 * Game.tsx - Central Hub
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * ⚠️ DO NOT ADD FEATURE LOGIC HERE
 * Use plugins only. This is a hub for navigation and plugin dispatch.
 */

import React, { useState } from 'react';
import CharacterCreation from '../components/CharacterCreation';
import CharacterEditor from '../components/CharacterEditor';
import AIChat from '../plugins/aicore/AIChat';
import MistralDebugger from '../plugins/aicore/MistralDebugger';
import FileManagerCore from '../plugins/manager/FileManagerCore';
import Wheel from '../plugins/gameplay/Wheel';
import Upgrades from '../plugins/gameplay/Upgrades';
import Boosters from '../plugins/gameplay/Boosters';
import LevelUp from '../plugins/gameplay/LevelUp';
import Task from '../plugins/gameplay/Task';
import Achievements from '../plugins/gameplay/Achievements';
import AdminMenu from '../plugins/admin/AdminMenu';
import GameManagerCore from '../plugins/manager/GameManagerCore';
import { Button } from '@/components/ui/button';

export default function Game() {
  const [activePlugin, setActivePlugin] = useState<string | null>('game');
  const [activeTab, setActiveTab] = useState('upgrades');

  const renderPlugin = () => {
    switch (activePlugin) {
      case 'characterCreation': return <CharacterCreation />;
      case 'characterEditor': return <CharacterEditor />;
      case 'aiChat': return <AIChat />;
      case 'mistralDebugger': return <MistralDebugger />;
      case 'fileManager': return <FileManagerCore />;
      case 'wheel': return <Wheel />;
      case 'upgrades': return <Upgrades />;
      case 'boosters': return <Boosters />;
      case 'levelUp': return <LevelUp />;
      case 'tasks': return <Task />;
      case 'achievements': return <Achievements />;
      case 'adminMenu': return <AdminMenu />;
      case 'gameManager': return <GameManagerCore />;
      case 'game': 
      default: 
        return (
          <div className="game-gui-container">
            {/* Top Section */}
            <div className="top-left">
              <div className="p-4 bg-card rounded-lg">
                <h3 className="font-bold">Player Stats</h3>
                <p className="text-sm">Level: 1</p>
                <p className="text-sm">LP: 5,000</p>
              </div>
            </div>
            <div className="top-middle">
              <div className="text-center p-4">
                <h2 className="text-xl font-bold">Character Tap Game</h2>
                <p className="text-sm text-muted-foreground">Tap to earn LP!</p>
              </div>
            </div>
            <div className="top-right">
              <div className="p-4 space-y-2">
                <p className="text-sm">Energy: 800/1000</p>
                <Button size="sm" onClick={() => setActivePlugin('wheel')}>Wheel</Button>
                <Button size="sm" onClick={() => setActivePlugin('boosters')}>Boosters</Button>
              </div>
            </div>

            {/* Middle - Character Display */}
            <div className="middle">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-48 h-48 bg-card rounded-lg flex items-center justify-center mb-4">
                    <span className="text-6xl">👤</span>
                  </div>
                  <h3 className="text-lg font-bold">Seraphina</h3>
                  <p className="text-sm text-muted-foreground">Playful & Flirty</p>
                  <Button className="mt-4" size="lg">TAP</Button>
                </div>
              </div>
            </div>

            {/* Right Side - Game Utilities */}
            <div className="right">
              <div className="p-4 space-y-2">
                <Button size="sm" onClick={() => setActivePlugin('fileManager')} className="w-full">Media</Button>
                <Button size="sm" onClick={() => setActivePlugin('aiChat')} className="w-full">Chat</Button>
                <Button size="sm" onClick={() => setActivePlugin('gameManager')} className="w-full">Manager</Button>
                <Button size="sm" onClick={() => setActivePlugin('adminMenu')} className="w-full">Admin</Button>
              </div>
            </div>

            {/* Bottom - Tabbed Content */}
            <div className="bottom">
              <div className="p-4">
                <div className="bottom-tabs">
                  {['upgrades', 'levelUp', 'tasks', 'achievements'].map(tab => (
                    <Button 
                      key={tab} 
                      variant={activeTab === tab ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setActiveTab(tab);
                        setActivePlugin(tab);
                      }}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="bottom-content mt-4">
                  {activeTab === 'upgrades' && <Upgrades />}
                  {activeTab === 'levelUp' && <LevelUp />}
                  {activeTab === 'tasks' && <Task />}
                  {activeTab === 'achievements' && <Achievements />}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (activePlugin !== 'game' && !['upgrades', 'levelUp', 'tasks', 'achievements'].includes(activePlugin)) {
    return (
      <div className="min-h-screen p-4">
        <div className="mb-4">
          <Button onClick={() => setActivePlugin('game')} variant="outline">
            ← Back to Game
          </Button>
          <h1 className="text-2xl font-bold mt-2 capitalize">{activePlugin}</h1>
        </div>
        {renderPlugin()}
      </div>
    );
  }

  return renderPlugin();
}