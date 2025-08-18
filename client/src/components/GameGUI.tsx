/**
 * GameGUI.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 * Modular Game Interface
 * Zones: TopLeft, TopMiddle, TopRight, UnderTop, Middle, Right, Bottom
 * ⚠️ Middle is restricted to CharacterDisplay only
 */


import React, { useState } from "react";
import Upgrade from "./Upgrade";


/** MOCK SKELETON FOR UPGRADES GUI DISPLAY
 * 
const GameGUI = () => {
  const [activePlugin, setActivePlugin] = useState<string | null>(null);

  const renderPlugin = () => {
    switch (activePlugin) {
      case "upgrade":
        return <Upgrade />;
      // Add cases for other plugins...
      default:
        return <div>Welcome to the Game Hub! Select a plugin.</div>;
    }
  };

  return (
    <div>
      <h1>Game Hub</h1>
      <nav>
        <button onClick={() => setActivePlugin("upgrade")}>Upgrades</button>
      "ADD OTHER BUTTONS"
      </nav>
      <main>{renderPlugin()}</main>
    </div>
  );
};
*/

export default GameGUI;
//  CSS GRID SKELETON 

.game-gui-container {
  display: grid;
  grid-template-areas:
    "top-left top-middle top-right"
    "under-top under-top under-top"
    "middle middle right"
    "bottom bottom bottom";
  grid-template-rows: auto auto 1fr auto;
  grid-template-columns: 250px 1fr 250px;
  height: 100vh;
  width: 100vw;
  gap: 10px;
}

.top-left { grid-area: top-left; }
.top-middle { grid-area: top-middle; }
.top-right { grid-area: top-right; }
.under-top { grid-area: under-top; }
.middle { grid-area: middle; }
.right { grid-area: right; }
.bottom { grid-area: bottom; }

.bottom-tabs {
  display: flex;
  gap: 5px;
}
.bottom-tabs button.active-tab {
  font-weight: bold;
  border-bottom: 2px solid #fff;
}
.bottom-content {
  margin-top: 5px;
}