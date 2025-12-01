import OBR from "@owlbear-rodeo/sdk";
import { Util } from "./util";
import { Character, Savaged, Trait } from "./savaged";

const DEFAULT_STATBLOCK: Character = {
  name: "default",
  attributes: [
    { name: "agility", die: "d6" },
    { name: "smarts", die: "d6" },
    { name: "spirit", die: "d6" },
    { name: "strength", die: "d6" },
    { name: "vigor", die: "d6" }
  ],
  skills: [
    { name: "unskilled", die: "d4-2" },
    { name: "athletics", die: "d4" },
    { name: "common knowledge", die: "d4" },
    { name: "notice", die: "d4" },
    { name: "persuasion", die: "d4" },
    { name: "stealth", die: "d4" },
  ],
  weapons: [],
  pace: 6,
  parry: 5,
  toughness: 6,
  edges: [],
  hindrances: [],
  gear: [],
};

OBR.onReady(async () => {
  console.log("Popup onReady called");
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('itemId');
  console.log("Item ID from URL:", itemId);
  if (!itemId) {
    console.error("No itemId in URL params");
    return; // Can't proceed without itemId
  }

  //const form = document.getElementById("statblock-form") as HTMLFormElement;
  const urlInput = document.getElementById("url-input") as HTMLInputElement;

  // Load existing data from item metadata
  const items = await OBR.scene.items.getItems([itemId!]);
  const item = items[0];
  const metadata = item.metadata[Util.StatBlockMkey] as { url?: string, character?: Character, timestamp?: number };
  let storedChar: Character;

  if (metadata?.character && metadata.timestamp) {
    const age = Date.now() - metadata.timestamp;
    const isStale = age > 24 * 60 * 60 * 1000; // 24 hours

    if (isStale) {
      // Check if we have a URL to refresh from
      if (metadata.url) {
        try {
          console.log('Stored data is stale, refreshing from URL...');
          const freshCharacter = await Savaged.parseCharacterFromURL(metadata.url);
          // Update metadata with fresh data
          await OBR.scene.items.updateItems([itemId], (items) => {
            for (const item of items) {
              item.metadata[Util.StatBlockMkey] = { url: metadata.url, character: freshCharacter, timestamp: Date.now() };
            }
          });
          storedChar = freshCharacter;
        } catch (e) {
          console.warn('Failed to refresh stale data, using cached:', e);
          storedChar = metadata.character;
        }
      } else {
        storedChar = metadata.character;
      }
    } else {
      storedChar = metadata.character;
    }
  } else {
    storedChar = DEFAULT_STATBLOCK;
  }

  // Populate URL input if available
  if (metadata?.url) {
    urlInput.value = metadata.url;
  }

  // Populate form
  populateForm(storedChar);
  addRollHandlers();

  // Debug: Check for inputs without proper labels
  const allInputs = document.querySelectorAll('input');
  allInputs.forEach(input => {
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label) {
        console.log('Input without explicit label association:', input);
      }
    } else {
      console.log('Input without id:', input);
    }
  });

  // // Save on change
  // form.addEventListener("change", async () => {
  //   const data = extractFormData(saved);
  //   await OBR.scene.items.updateItems([itemId], (items) => {
  //     for (const item of items) {
  //       const existing = item.metadata[Util.StatBlockMkey] as any;
  //       item.metadata[Util.StatBlockMkey] = { ...existing, character: data, timestamp: Date.now() };
  //     }
  //   });
  // });

  // Import from URL
  document.getElementById("import-url")!.onclick = async () => {
    try {
      storedChar = await Savaged.parseCharacterFromURL(urlInput.value);
      // Save URL and character to item metadata
      await OBR.scene.items.updateItems([itemId], (items) => {
        for (const item of items) {
          item.metadata[Util.StatBlockMkey] = { url: urlInput.value, character: storedChar, timestamp: Date.now() };
        }
      });
      storedChar = await applyData(itemId, storedChar);
      // Scroll to top after loading
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      //urlInput.value = "";
    } catch (e) {
      alert("Failed to load from URL");
      storedChar = await applyData(itemId, DEFAULT_STATBLOCK);
      // Scroll to top after loading default
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };


});

function populateForm(character: Character) {
  // Title
  const characterName = character.name || "Savage Worlds Stat Block";
  document.getElementById("title")!.textContent = characterName;
  document.title = characterName;

  // Attributes
  const attributesDiv = document.getElementById("attributes")!;
  attributesDiv.innerHTML = "";
  (character.attributes || [] as Trait[]).forEach((trait: Trait) => {
    const button = document.createElement("button");
    const displayName = trait.name.charAt(0).toUpperCase() + trait.name.slice(1);
    button.textContent = `${displayName} ${trait.die}`;
    button.type = "button";
    button.className = "popup-roll-btn popup-attribute-btn";
    button.dataset.die = trait.die;
    button.dataset.type = "attribute";
    button.id = trait.name;
    attributesDiv.appendChild(button);
  });

  // Skills
  const skillsDiv = document.getElementById("skills")!;
  skillsDiv.innerHTML = "";
  (character.skills || [] as Trait[]).forEach((trait: Trait) => {
    const button = document.createElement("button");
    const displayName = trait.name.charAt(0).toUpperCase() + trait.name.slice(1);
    button.textContent = `${displayName} ${trait.die}`;
    button.type = "button";
    button.className = "popup-roll-btn popup-skill-btn";
    button.dataset.die = trait.die;
    button.dataset.skill = trait.name;
    skillsDiv.appendChild(button);
  });

  // Weapons
  const weaponsDiv = document.getElementById("weapons")!;
  weaponsDiv.innerHTML = "";
  (character.weapons || []).forEach((weapon) => {
    if (weapon.damage) {
      const button = document.createElement("button");
      button.textContent = `${weapon.name} ${weapon.damage}`;
      button.type = "button";
      button.className = "popup-roll-btn popup-weapon-btn";
      button.dataset.die = weapon.damage;
      button.dataset.weapon = weapon.name;
      weaponsDiv.appendChild(button);
    }
  });

  // Powers
  const powersDiv = document.getElementById("powers")!;
  powersDiv.innerHTML = "";
  (character.powers || []).forEach((power) => {
    if (!power || !power.name) return;
    const button = document.createElement("button");
    const displayText = power.name;
    button.title = power.book && power.page ? `${power.book} p${power.page}` : '';
    button.textContent = displayText;
    button.type = "button";
    button.className = "popup-roll-btn popup-power-btn";
    button.dataset.die = character.skills.find(t => t.name === character.arcaneSkill)?.die;
    button.dataset.skill = character.arcaneSkill;
    powersDiv.appendChild(button);
  });

  // Arcane Info
  const arcaneInfoDiv = document.getElementById("arcane-info")!;
  arcaneInfoDiv.innerHTML = "";
  if (character.powers && character.powers.length > 0 && character.arcaneBackground) {
    const p = document.createElement("p");
    p.className = "popup-arcane-info";
    p.textContent = `${character.arcaneBackground} (Skill: ${character.arcaneSkill || 'unknown'})`;
    arcaneInfoDiv.appendChild(p);
  }

  // Other fields
  if (character.pace !== undefined) (document.getElementById("pace") as HTMLSpanElement).textContent = String(character.pace);
  if (character.parry !== undefined) (document.getElementById("parry") as HTMLSpanElement).textContent = String(character.parry);
  if (character.toughness !== undefined) (document.getElementById("toughness") as HTMLSpanElement).textContent = String(character.toughness);
  if (character.edges) (document.getElementById("edges") as HTMLTextAreaElement).value = character.edges.join("\n");
  if (character.hindrances) (document.getElementById("hindrances") as HTMLTextAreaElement).value = character.hindrances.join("\n");
  if (character.gear) (document.getElementById("gear") as HTMLTextAreaElement).value = character.gear.join("\n");
  if (character.specialAbilities) (document.getElementById("specialAbilities") as HTMLTextAreaElement).value = character.specialAbilities.join("\n");
  if (character.advances) (document.getElementById("advances") as HTMLTextAreaElement).value = character.advances.join("\n");
}

// Parse die string like "d4-2" into { die: "d4", modifier: -2 }
function parseDie(dieStr: string): { die: string, modifier: number } {
  const match = dieStr.match(/^([d\d]+)([+-]\d+)?$/);
  if (match) {
    return { die: match[1], modifier: match[2] ? parseInt(match[2]) : 0 };
  }
  return { die: dieStr, modifier: 0 };
}

// Function to add click handlers for rolling
function addRollHandlers() {
  document.querySelectorAll('.popup-roll-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const target = e.target as HTMLButtonElement;
      let dieStr = target.dataset.die || 'd6';
      // Remove (us) indicator for dice parsing
      dieStr = dieStr.replace(/ \(us\)$/g, '');
      const rollType = target.dataset.weapon ? 'damage' : 'trait';
      const { die, modifier } = parseDie(dieStr);
      // Get player ID and send roll request to room metadata
      const playerId = await OBR.player.getId();
      await OBR.room.setMetadata({ rollRequest: { die, rollType, modifier, playerId } });
    });
  });
}

// function extractFormData(character:Character): Character {
//   const attributes: { name: string; die: string }[] = [];
//   const skills: { name: string; die: string }[] = [];

//   // Attributes
//   const attributeIds = ['agility', 'smarts', 'spirit', 'strength', 'vigor'];
//   attributeIds.forEach(id => {
//     const btn = document.getElementById(id) as HTMLButtonElement;
//     const parts = btn?.textContent?.split(' ') || [];
//     attributes.push({ name: id, die: parts[1] || 'd6' });
//   });

//   // Skills
//   Array.from(document.querySelectorAll("#skills .popup-skill-btn")).forEach(btn => {
//     const b = btn as HTMLButtonElement;
//     const parts = b.textContent?.split(' ') || [];
//     if (parts.length >= 2) {
//       skills.push({ name: parts[0], die: parts[1] });
//     }
//   });

//   return {
//     name: document.getElementById("title")!.textContent || "",
//     attributes,
//     skills,
//     pace: saved.pace,
//     parry: saved.parry,
//     toughness: saved.toughness,
//     edges: (document.getElementById("edges") as HTMLTextAreaElement).value.split("\n").filter(Boolean),
//     hindrances: (document.getElementById("hindrances") as HTMLTextAreaElement).value.split("\n").filter(Boolean),
//     gear: (document.getElementById("gear") as HTMLTextAreaElement).value.split("\n").filter(Boolean),
//     specialAbilities: (document.getElementById("specialAbilities") as HTMLTextAreaElement).value.split("\n").filter(Boolean),
//     advances: (document.getElementById("advances") as HTMLTextAreaElement).value.split("\n").filter(Boolean),
//   };
// }

async function applyData(itemId: string, data: Character): Promise<Character> {
  //let saved = { ...DEFAULT_STATBLOCK, ...data };
  await OBR.scene.items.updateItems([itemId!], (items) => {
    for (const item of items) {
      const existing = item.metadata[Util.StatBlockMkey] as any;
      item.metadata[Util.StatBlockMkey] = { ...existing, character: data, timestamp: Date.now() };
    }
  });
  // Re-populate form
  populateForm(data);
  addRollHandlers();
  return data;
}