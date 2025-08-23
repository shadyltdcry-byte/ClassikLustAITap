DO Not use any other DB, but Supabase. Supabase is heavily intergraded into my core. I will update all the correct .env information needed to get it running.

DO NOT place any GUI code anywhere other then "GameGUI.tsx (solely non-admin related functions only)

ALL admin related functions and GUI goes into" AdminMenu.tsx ONLY - this is a separate standalone floating menu "

Please read the README in main directory for game core structure and information 

Please read the README in the debugger folder in the main directory. This is a new backend debugger system that can provide real time diagnosis and debugging. This debugging system works along side MistralAI, but still needs individual plugin functions created for full implementation. 


CURRENT BUGS / ERRORS THAT ARE KNOWN

Warning: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.%s /uploads/undefined 


My player stats are still glitched at 0 0 0 0 and default name "player" from when a mock character was created to fix a bug and ended up getting stuck.

The new debugger GUI needs some love. It's literally barebone (adminGUI we're adminmenu is). Also it needs updated to show the "bug or eye" icon and displayed next to the "settings gear cog" icon at top.

Creating a new character doesn't seem to save, nor does the image uploader fully function nor display the preview pictures correctly (maybe something with mock data once again)

Also unable to open the levelup admin menu, the upgrades, task and achievements buttons don't open or route correctly. 
