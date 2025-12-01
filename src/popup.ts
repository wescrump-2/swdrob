import OBR from "@owlbear-rodeo/sdk";
import { Util } from "./util";
import { Character, Savaged, Trait } from "./savaged";
import { Debug } from "./debug";

const DEFAULT_STATBLOCK: Character = {
  name: "",
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
  parry: 2,
  toughness: 5,
  edges: [],
  hindrances: [],
  gear: [],
};

OBR.onReady(async () => {
  Debug.log("Popup onReady called");
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('itemId');
  Debug.log("Item ID from URL:", itemId);
  if (!itemId) {
    Debug.error("No itemId in URL params");
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
          Debug.log('Stored data is stale, refreshing from URL...');
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
        Debug.log('Input without explicit label association:', input);
      }
    } else {
      Debug.log('Input without id:', input);
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
  if (character.arcaneBackground) {
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
  Debug.log(`parseDie called with: "${dieStr}"`);
  const match = dieStr.match(/^([d\d]+)([+-]\d+)?$/);
  if (match) {
    const result = { die: match[1], modifier: match[2] ? parseInt(match[2]) : 0 };
    Debug.log(`parseDie result: ${JSON.stringify(result)}`);
    return result;
  }
  Debug.log(`parseDie no match, returning: { die: "${dieStr}", modifier: 0 }`);
  return { die: dieStr, modifier: 0 };
}

// Parse complex weapon damage string like "d6+d8+2" or "2d6" into { dice: ["d6", "d8"], modifier: 2 }
function parseWeaponDamage(damageStr: string): { dice: string[], modifier: number } {
  Debug.log(`parseWeaponDamage called with: "${damageStr}"`);

  // First, try to extract a final modifier (like +2 from "d6+d8+2")
  const finalModifierMatch = damageStr.match(/([+-]\d+)$/);
  let finalModifier = 0;
  let damageWithoutModifier = damageStr;

  if (finalModifierMatch) {
    finalModifier = parseInt(finalModifierMatch[1]);
    damageWithoutModifier = damageStr.slice(0, finalModifierMatch.index).trim();
    Debug.log(`Extracted final modifier: ${finalModifier}, remaining: "${damageWithoutModifier}"`);
  }

  // Handle quantity notation like "2d6" - expand to ["d6", "d6"]
  const quantityMatch = damageWithoutModifier.match(/^(\d+)(d\d+)$/);
  if (quantityMatch) {
    const quantity = parseInt(quantityMatch[1]);
    const dieType = quantityMatch[2];
    const expandedDice = Array(quantity).fill(dieType);
    Debug.log(`Expanded quantity notation: ${quantity}${dieType} → ${JSON.stringify(expandedDice)}`);
    return { dice: expandedDice, modifier: finalModifier };
  }

  // Split the remaining string by "+" to get individual dice
  const diceParts = damageWithoutModifier.split('+').map(part => part.trim()).filter(part => part);

  // If we didn't find any dice, try splitting by other separators
  if (diceParts.length === 1 && diceParts[0] === damageWithoutModifier) {
    // Try to find individual dice patterns
    const diceMatches = damageWithoutModifier.match(/[dD]\d+/g);
    if (diceMatches) {
      Debug.log(`Found dice matches: ${JSON.stringify(diceMatches)}`);
      return { dice: diceMatches, modifier: finalModifier };
    }
  }

  Debug.log(`Parsed weapon damage: dice=${JSON.stringify(diceParts)}, modifier=${finalModifier}`);
  return { dice: diceParts, modifier: finalModifier };
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

      let dice, modifier;

      if (rollType === 'damage') {
        // For weapon damage, use the new parser that handles complex expressions
        const weaponDamage = parseWeaponDamage(dieStr);
        dice = weaponDamage.dice;
        modifier = weaponDamage.modifier;
        Debug.log(`Weapon roll - dice: ${JSON.stringify(dice)}, modifier: ${modifier}`);
      } else {
        // For regular trait rolls, use the simple parser but convert to array format
        const parsed = parseDie(dieStr);
        dice = [parsed.die]; // Convert single die to array
        modifier = parsed.modifier;
        Debug.log(`Trait roll - dice: ${JSON.stringify(dice)}, modifier: ${modifier}`);
      }

      // Get player ID and send roll request to room metadata
      const playerId = await OBR.player.getId();
      await OBR.room.setMetadata({ rollRequest: { dice, rollType, modifier, playerId } });
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

  // Test the weapon damage parsing
  testWeaponDamageParsing();
  return data;
}

// Test function to validate weapon damage parsing
function testWeaponDamageParsing() {
  Debug.log("=== Testing Weapon Damage Parsing ===");

  // Test case 1: Simple die with modifier
  const test1 = parseWeaponDamage("d6+2");
  Debug.log(`Test 1 - "d6+2": dice=${JSON.stringify(test1.dice)}, modifier=${test1.modifier}`);

  // Test case 2: Multiple dice with final modifier
  const test2 = parseWeaponDamage("d6+d8+2");
  Debug.log(`Test 2 - "d6+d8+2": dice=${JSON.stringify(test2.dice)}, modifier=${test2.modifier}`);

  // Test case 3: Multiple dice without final modifier
  const test3 = parseWeaponDamage("d6+d8");
  Debug.log(`Test 3 - "d6+d8": dice=${JSON.stringify(test3.dice)}, modifier=${test3.modifier}`);

  // Test case 4: Complex case with negative modifier
  const test4 = parseWeaponDamage("d6+d8-1");
  Debug.log(`Test 4 - "d6+d8-1": dice=${JSON.stringify(test4.dice)}, modifier=${test4.modifier}`);

  // Test case 5: Simple die without modifier (like "d6")
  const test5 = parseWeaponDamage("d6");
  Debug.log(`Test 5 - "d6": dice=${JSON.stringify(test5.dice)}, modifier=${test5.modifier}`);

  // Test case 6: Quantity notation (like "2d6")
  const test6 = parseWeaponDamage("2d6");
  Debug.log(`Test 6 - "2d6": dice=${JSON.stringify(test6.dice)}, modifier=${test6.modifier}`);

  // Test case 7: Quantity notation with modifier (like "2d6+1")
  const test7 = parseWeaponDamage("2d6+1");
  Debug.log(`Test 7 - "2d6+1": dice=${JSON.stringify(test7.dice)}, modifier=${test7.modifier}`);

  Debug.log("=== End Weapon Damage Parsing Tests ===");
}