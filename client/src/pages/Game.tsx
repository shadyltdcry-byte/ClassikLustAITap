/**
 * Game.tsx - Central Hub
 * Last Edited: 2025-08-18 by Assistant
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
          <div className="text-center">
            <div className="w-48 h-48 bg-card rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-6xl">👤</span>
            </div>
            <h3 className="text-lg font-bold text-white">Seraphina</h3>
            <p className="text-sm text-gray-400">Playful & Flirty</p>
            <Button className="mt-4" size="lg">TAP</Button>
          </div>
        );
    }
  };

  // For non-game plugins, show full screen with back button
  if (activePlugin !== 'game') {
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

  // Main game view - just the character display with navigation
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-white text-2xl font-bold">ClassikLust</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setActivePlugin('upgrades')} variant="outline">
            Upgrades
          </Button>
          <Button size="sm" onClick={() => setActivePlugin('fileManager')} variant="outline">
            Media
          </Button>
          <Button size="sm" onClick={() => setActivePlugin('aiChat')} variant="outline">
            Chat
          </Button>
          <Button size="sm" onClick={() => setActivePlugin('gameManager')} variant="outline">
            Manager
          </Button>
          <Button size="sm" onClick={() => setActivePlugin('adminMenu')} variant="outline">
            Admin
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[80vh]">
        {renderPlugin()}
      </div>
    </div>
  );
}