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
import CharacterCreation from '../plugins/character/CharacterCreation';
import CharacterEditor from '../plugins/character/CharacterEditor';
import AIChat from '../plugins/aicore/AIChat';
import MistralDebugger from '../plugins/aicore/MistralDebugger';
import FileManagerCore from '../plugins/manager/FileManagerCore';
import Wheel from '../plugins/gameplay/Wheel';
import Upgrades from '../plugins/gameplay/Upgrades';
import Boosters from '../plugins/gameplay/Boosters';
import AdminMenu from '../plugins/admin/AdminMenu';

export default function Game() {
  const [activePlugin, setActivePlugin] = useState<string | null>(null);

  const renderPlugin = () => {
    switch (activePlugin) {
      case 'characterCreation': return <CharacterCreation onDone={() => setActivePlugin(null)} />;
      case 'characterEditor': return <CharacterEditor onDone={() => setActivePlugin(null)} />;
      case 'aiChat': return <AIChat />;
      case 'mistralDebugger': return <MistralDebugger />;
      case 'fileManager': return <FileManagerCore />;
      case 'wheel': return <Wheel />;
      case 'upgrades': return <Upgrades />;
      case 'boosters': return <Boosters />;
      case 'adminMenu': return <AdminMenu />;
      default: return <div>Welcome to AITapChatGame! Select a plugin.</div>;
    }
  };

  return (
    <div>
      <h1>AITapChatGame Hub</h1>
      <nav>
        {['characterCreation','characterEditor','aiChat','mistralDebugger','fileManager','wheel','upgrades','boosters','adminMenu'].map(p => (
          <button key={p} onClick={() => setActivePlugin(p)}>{p}</button>
        ))}
      </nav>
      <main>{renderPlugin()}</main>
    </div>
  );
}