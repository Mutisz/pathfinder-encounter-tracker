We are currently in a nearly empty repo within VSCode devcontainer. It only has some bootstrap files corresponding to vite, prettier, npm and TS. We are going to be developing the app I called pathfinder-encounter-tracker. It's going to be a helper for a GM for tracking encounters in Pathfinder 2E remastered. It's MVP version will need to

- Define reusable NPCs with statblocks modeled after Archives of Nethys (ex. https://2e.aonprd.com/NPCs.aspx?ID=3427)
  - You can also find full statblock descriptions taken directly from monster core and npc core in attached screenshots
- Add players (should use the same statblocks as NPCS)
- Create an encounter
- manually add NPCs to the encounter
  - select from a list of predefined ones with ability to set their number
  - additional checkbox "Batch initiative" That will treat added enemy of the same type with number >1 as a group for initiative rolls (they will share one roll)
- Automatically add players to the encounter
- Input for players initiative
- Ability to roll initiative for each enemy (or multiple NPCs of the same type if batch initiative marked)
  - This must follow the initiative rules, ie. it should add skill modifier to the roll result
    - Allow for a choice of skill used for initiative (only from skills listed in Skills section of the statblock)
    - By default use perception
- Automatically order encounter participants by initiative results
- Currently active participant should be highlighted on the list with "End turn" button that moves active marker to the next participant
- Handle Delay action (https://2e.aonprd.com/Actions.aspx?ID=2294)
  - A "Delay" button next to "End turn" that moves that participant to the separate list from where it can be moved back to initiative order after currently active participant
  - If multiple participants are on that separate list, their order matters if they would want to resume initiative after the same participant
- Handle tracking damage/healing received by the participant
  - Add "Damage" button that removes from the HP (but never below 0)
  - If HP reaches 0 do not automatically remove the participant from the encounter
    - For NPCs ask if the NPC should be removed from the encounter (dead)
    - For players do nothing (in next versions we will be adding conditions and such player will receive automatically the Dying condition)
  - Add "Heal" button that adds to the HP (but never over max HP)
- A button to remove the participant from the encounter
  - Add 3 options - dead (default), ran away, surrendered
  - Removed NPCs should not be deleted, keep them in separate list viewable in a popup
- A button to end the encounter
  - Warn if there are still NPCs in the encounter
  - After encounter show a summary of all participants with their status (survived, surrendered, dead, ran away)
- If you need guidance on rules regarding any calculation consult https://2e.aonprd.com/
  - Make sure you are using remastered rules on https://2e.aonprd.com/
  - If in doubt DO NOT GUESS, ask
    In the future I will want:
- Data dump from archives of Nethys for entries from NPC Core and Monster Core
- NPCs selectable from the dump
- NPC actions (strike rolls against selected participant or other actions)
- Condition tracking and reminders on start-of-turn actions (ex. persistent dmg)
- Player imports from Pathbuilder
- Data exports
  Tech stack used:
- SPA with React + TS
- store all data in browser cache
- Vite builder
- published on ghpages
- All developed within VScode devcontainer
  Verify the above design and report any possible issues with my assumptions. Create a plan for implementation. Use brainstorming.
