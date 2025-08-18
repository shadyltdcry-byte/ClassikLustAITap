Project README – Character Tap Game

1. Project Overview

This is a modular tap-based character game with dynamic AI chat, character customization, rewards, and NSFW/VIP gated content. Players interact with characters to earn points, unlock rewards, and receive random media gifts based on interactions, Charisma, and progression.

Core Features:

AI-powered character chat

Character creation and customization (moods, personality, backstory)

Flipbook-style animations for character media

Tap-based LP (Lust Points) system with offline/online calculations

Upgrades, level-ups, boosters, tasks, achievements

Wheel rewards and random media gifting

Admin/debug tools

NSFW/VIP gated content



---

2. Folder Structure

/src
 ├─ /components
 │    ├─ CharacterDisplay.tsx
 │    ├─ CharacterCreation.tsx
 │    ├─ CharacterEditor.tsx
 │    ├─ NewsTicker.tsx
 │    ├─ GameGUI.tsx
 │    └─ AdminMenu.tsx
 │
 ├─ /plugins
 │    ├─ /gameplay
 │    │    ├─ Boosters.tsx
 │    │    ├─ Wheel.tsx
 │    │    ├─ LevelUp.tsx
 │    │    ├─ Upgrades.tsx
 │    │    ├─ Tasks.tsx
 │    │    └─ Achievements.tsx
 │    ├─ /aicore
 │    │    ├─ AIChat.tsx
 │    │    └─ MistralDebugger.tsx
 │    └─ /admin
 │         └─ AdminMenu.tsx
 │
 ├─ /managers
 │    ├─ ImageManager.tsx
 │    ├─ GameManagerDB.tsx 
 │    └─ GameManagerCore.tsx
 │    ├─ FileManagerCore.tsx
 │    └─ FileManagerDB.tsx
 │
 ├─ /pages
 │    └─ Game.tsx
 │
 └─ /utils
      ├─ helperFunctions.ts
      └─ constants.ts


---

3. Plugins / Features

Character Plugins

CharacterCreation.tsx – Create new characters, upload avatar/video/GIF, NSFW/VIP toggle, moods, personality, backstory, level requirements.

CharacterEditor.tsx – Edit existing characters: backstory, moods, custom triggers, NSFW/VIP toggle, level fields.


AI Chat

AIChat.tsx – Main chat interface, supports Charisma points, mood-based dynamic responses, random media gifting.

MistralDebugger.tsx – Debug AI conversation responses, optional floating overlay.


Media / File Management

FileManagerCore.tsx – Handles media upload, preview, GIF/video playback, automatic folder creation, sorting by character/mood/level/VIP/NSFW.

FileManagerDB.tsx – Backend CRUD operations for all media files and assignments.


Gameplay Features

Wheel.tsx – Spin rewards, connects to Bonuses plugin.

Upgrades.tsx – Three-section upgrade system, handles LP/energy gain, no “giving” mechanics.

LevelUp.tsx – Tracks XP, triggers bonuses.

Tasks.tsx / Achievements.tsx – Tracks milestones and triggers Bonuses plugin.

Boosters.tsx – Temporary stat boosts, activation, duration tracking.


Bonuses

Bonuses.tsx – Handles all “giving” mechanics: rewards from level-ups, achievements, wheel, AI gifts.

BonusesDB.tsx – Optional backend helper to track all bonuses in DB.



---

4. Database / Schema Overview

Table	Purpose

users	Stores user info, LP, energy, VIP/NSFW status, Charisma, tick timestamps
characters	Character metadata: moods, personality, unlocks, NSFW/VIP, level requirements, triggers
media_files	Stores all images/videos/GIFs, character association, NSFW/VIP, mood tags, animation sequence
upgrades	Upgrade options, LP/energy cost, stat effects
boosters	Tracks active boosters, durations, and effects
wheelRewards	Spin reward outcomes
gameStats	Cumulative LP, taps, energy usage
userCharacters	Player-character ownership, Charisma points
chatStats	Tracks Charisma points and history
events/userVip	Event triggers, VIP plans, rewards
bonuses	Central table for all “giving” rewards



---

5. Gameplay Mechanics

Tick System

LP per Hour: Offline capped (e.g., 2 hours max), online uncapped. Configurable later.

LP per Tap: Dynamic/constant, affected by upgrades/boosters.

Energy regeneration: Configurable rates (e.g., 1 energy per 3s or 5 per 8s).

Purchases / Shop: Deduct LP, apply effects from upgrades, level-ups, boosters.


Charisma System

Tracks interaction points from AI chat.

Triggers unlocked responses, images, or bonuses based on Charisma thresholds.

Affects random media gifts from AI chat or gameplay rewards.


NSFW/VIP Gating

All gated media is checked before sending/displaying.

VIP status or NSFW consent verified in DB.




---

6. GUI Layout / Zones

Top-Left: Player identity & avatar, level, stats

Top-Middle: Core LP info (LP/hour, total)

Top-Right: Resources, energy, boosters, temporary indicators

Middle: CharacterDisplay only (animations, GIFs)

Right Side: Extra gameplay utilities (Wheel, Boosters, mini-games)

Bottom: Tabbed panels (LevelUp, Upgrades, Tasks, Achievements, Shop)

Under Top: News/Event ticker (optional, animated scroll)

Floating Components: AdminMenu, DebuggerPanel, ImageManager overlay



---

7. Media & Flipbook Management

Automatic folder creation per character on upload.

Images/videos sorted by pose, mood, VIP/NSFW.

Dynamic preview in FileManager.

Flipbook sequences generated via sorted animation sequences.

Random gifting: filters images based on Charisma, mood, NSFW/VIP eligibility.

Optional AI embeddings for semantic image matching (future enhancement).



---

8. Development Notes / Guidelines

Game.tsx – Hub only, no feature logic. Manages global state and plugin selection.

Plugins – Contain all feature logic; UI + DB operations split appropriately.

FileManager – Core handles UI; DB handles backend operations.

Utils – Shared helper functions (timers, formatting, randomization).

Logging – Header comments in every TSX file for last edit date/editor.

Adding Features – New plugin = new folder + TSX + optional DB helper; register in Game.tsx.



---

9. Future Enhancements

AIChat advanced responses based on Charisma and mood.

Automatic flipbook clustering using AI embeddings for large media libraries.

Drag & drop multi-upload in FileManager.

GIF autoplay, video playback controls, and advanced tag filtering.

Dynamic shop events and global gifts.

More modular floating overlays for debugging and admin control.



---

10. Summary

Game.tsx: Layout, global state, plugin switching

GameGUI: Dynamic rendering of plugins in grid layout

Plugins: Self-contained gameplay modules (upgrades, tasks, wheel, AIChat)

FileManager: Handles media upload, previews, and organization

Bonuses: Central reward “giving” system

Database: Centralized tables for users, characters, media, stats, and bonuses


> Goal: Modular, easily maintainable, and extendable. New features can be added without breaking core gameplay.


Players will have a permanent Upgrade menu that will be split into 3 sections. LP per Hour, Increased Energy, LP per Tap.

-- LP per Hour will have the most to upgrade. Example would be, "Increase Intellect Lv. 1 | LP per Hour:	 150 | LP Cost: 1500", then level 2 of that same upgrade would go like, 
| Increase Intellect Lv. 2 |
| LP per Hour: 193 |
| LP Cost: 1950 | 
*Each upgrade will have a different amount and increase (with a setting in admin to create/edit as needed).

-- Increased Energy will be the next hardest to level, still not decided on how to structure the increases on this yet, but will look similar to the following example, 
| Book Smarts Lv. 1 |
| Energy Increase: 100 |
| LP Cost: 1500 |
*Same as previous upgrades, increasing progressively harder each level.

-- LP per Tap will be the hardest and longest, but will be required to be a certain level at specific stages in order to progress your character level.
| Dexterity Lv. 1 |
| LP Increase : 1x |
| LP Cost: 2500 |

## Leveling System

-- The Upgrades and leveling system will work hand in hand. To progress to level 2, all level 2 upgrades are required. Level 3, all upgrades but Increased Energy and LP per Tap aren't a requirement until level 5..Then they are required to be level 3 and 2 for example to progress past 5. The leveling cost will be factored in later when the other systems are implemented.