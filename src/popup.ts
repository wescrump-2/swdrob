import OBR from "@owlbear-rodeo/sdk";
import { Util } from "./util";
import { Character, Savaged, Trait } from "./savaged";
import { Debug } from "./debug";

const DEFAULT_STATBLOCK: Character = Character.getDefaultCharacter();

let currentItemId: string | null = null;

OBR.onReady(async () => {
  Debug.log("Popup onReady called");
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('itemId');
  Debug.log("Item ID from URL:", itemId);
  if (!itemId) {
    Debug.error("No itemId in URL params");
    return; // Can't proceed without itemId
  }
  currentItemId = itemId;

  const urlInput = document.getElementById("url-input") as HTMLInputElement;
  const statBlockTextArea = document.getElementById("statblock-text") as HTMLTextAreaElement;

  // Load existing data from item metadata
  const items = await OBR.scene.items.getItems([itemId!]);
  const item = items[0];
  const metadata = item.metadata[Util.StatBlockMkey] as { url?: string, character?: Character, timestamp?: number, statBlockText?: string };
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

  // Populate stat block text if available
  if (metadata?.statBlockText) {
    statBlockTextArea.value = metadata.statBlockText;
  }

  // Populate form
  populateForm(storedChar);
  addRollHandlers();

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

  // Parse stat block from text
  document.getElementById("parse-statblock")!.onclick = async () => {
    try {
      const textArea = document.getElementById("statblock-text") as HTMLTextAreaElement;
      const statBlockText = textArea.value.trim();

      if (!statBlockText) {
        alert("Please paste stat block text first");
        return;
      }
      Debug.log("Parsing stat block text:", statBlockText);
      const parsedCharacter = Savaged.parseCharacterFromText(statBlockText);
      Debug.log("Parsed character:", parsedCharacter);

      if (!currentItemId) {
        Debug.error("No current item ID available");
        alert("No item ID available for saving parsed data");
        return;
      }

      // Save character and stat block text to item metadata
      await OBR.scene.items.updateItems([currentItemId], (items) => {
        for (const item of items) {
          const existing = item.metadata[Util.StatBlockMkey] as any;
          item.metadata[Util.StatBlockMkey] = {
            ...existing,
            character: parsedCharacter,
            statBlockText: statBlockText,
            timestamp: Date.now()
          };
        }
      });

      // Update the form with parsed data
      await applyData(currentItemId, parsedCharacter);

      // Scroll to top after loading
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

    } catch (e) {
      Debug.error("Failed to parse stat block text:", e);
      alert("Failed to parse stat block text. Please check the format and try again.");
    }
  };

});


function populateForm(character: Character) {
  const defaultname = "Savage Worlds Stat Block"
  // Title - use clean name without special characters
  const characterName = character.name.trim() || defaultname;
  const titleElement = document.getElementById("statblock-title")!;

  if (characterName && characterName !== "" && characterName !== defaultname) {
    // If character has a real name, show the character name
    titleElement.textContent = characterName;
  } else {
    titleElement.textContent = defaultname;
  }

  // Fill in description element if it exists
  const descriptionElement = document.getElementById("description");
  if (descriptionElement) {
    if (character.description) {
      descriptionElement.textContent = character.description;
      descriptionElement.style.display = "block";
    } else {
      descriptionElement.style.display = "none";
    }
  }
  if (document.title) {
    document.title = characterName;
  }

  // Show/hide wildcard symbol based on character.isWildCard field
  const wildcardSymbol = document.getElementById("wildcard-symbol");
  if (wildcardSymbol) {
    if (character.isWildCard) {
      wildcardSymbol.style.display = "inline";
    } else {
      wildcardSymbol.style.display = "none";
    }
  }

  // Attributes
  const attributesDiv = document.getElementById("attributes")!;
  attributesDiv.innerHTML = "";
  (character.attributes || [] as Trait[]).forEach((trait: Trait) => {
    const button = document.createElement("button");
    const displayName = Util.toTitleCase(trait.name);
    button.textContent = `${displayName} ${trait.die}${trait.info ? trait.info : ''}`;
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
    const displayName = Util.toTitleCase(trait.name);
    button.textContent = `${displayName} ${trait.die}`;
    button.type = "button";
    button.className = "popup-roll-btn popup-skill-btn";
    button.dataset.die = trait.die;
    button.dataset.skill = trait.name;
    skillsDiv.appendChild(button);

    // Add Frenzy button after Fighting skill if character has Frenzy edge
    if (trait.name === 'fighting' && character.edges && character.edges.some(edge =>
      edge.toLowerCase().includes('frenzy')
    )) {
      const frenzyButton = document.createElement("button");
      // Extract the die from the fighting skill (e.g., "d8" from "Fighting d8")
      //const dieMatch = trait.die.match(/d\d+/i);
      //const dieType = dieMatch ? dieMatch[0] : 'd6';
      frenzyButton.textContent = `Frenzy 2${trait.die}`;
      frenzyButton.type = "button";
      frenzyButton.className = "popup-roll-btn popup-skill-btn popup-frenzy-btn";
      frenzyButton.style.backgroundColor = "#ff6b6b"; // Reddish color for Frenzy
      frenzyButton.style.color = "white";
      // Set dataset for 2 dice of the fighting skill type
      frenzyButton.dataset.die = `${trait.die}+${trait.die}`;
      frenzyButton.dataset.skill = 'frenzy';
      skillsDiv.appendChild(frenzyButton);
    }

    // Add ROF buttons after Shooting skill if character has weapons with ROF > 1
    if (trait.name === 'shooting' && character.weapons && character.weapons.length > 0) {
      // Calculate max ROF from all weapons
      let maxROF = 1;

      // Check for rapid fire and Improved rapid fire feats
      const hasRapidShot = character.edges && character.edges.some(edge =>
        edge.toLowerCase().includes('rapid fire')
      );

      // Find maximum ROF from weapons
      character.weapons.forEach(weapon => {
        if (weapon.rof) {
          const rofValue = parseInt(weapon.rof);
          if (!isNaN(rofValue) && rofValue > maxROF) {
            maxROF = rofValue;
          }
        }
      });

      // Apply rapid fire feats to increase max ROF (only +1 total, regardless of which feats)
      if ((hasRapidShot) && maxROF > 1) {
        maxROF += 1;
      }

      // Only add ROF buttons if maxROF > 1
      if (maxROF > 1) {
        // Add ROF buttons from 2 up to maxROF
        for (let rofLevel = 2; rofLevel <= maxROF; rofLevel++) {
          const rofButton = document.createElement("button");
          rofButton.textContent = `ROF ${rofLevel}`;
          rofButton.type = "button";
          rofButton.className = "popup-roll-btn popup-skill-btn popup-rof-btn";
          rofButton.style.backgroundColor = "#4CAF50"; // Green color for ROF
          rofButton.style.color = "white";

          // Create dice string with multiple shooting dice (e.g., "d6+d6" for ROF 2)
          const diceParts = [];
          for (let i = 0; i < rofLevel; i++) {
            diceParts.push(trait.die);
          }
          rofButton.dataset.die = diceParts.join('+');
          rofButton.dataset.skill = `rof-${rofLevel}`;
          skillsDiv.appendChild(rofButton);
        }
      }
    }
  });

  // Weapons
  const weaponsDiv = document.getElementById("weapons")!;
  weaponsDiv.innerHTML = "";
  (character.weapons || []).forEach((weapon) => {
    const button = document.createElement("button");
    button.textContent = `${Util.toTitleCase(weapon.name)} ${weapon.damage ? weapon.damage : '?d?'}`;
    button.type = "button";
    button.className = "popup-roll-btn popup-weapon-btn";
    button.dataset.die = weapon.damage;
    button.dataset.weapon = weapon.name;
    weaponsDiv.appendChild(button);
  });

  // Powers
  const powersDiv = document.getElementById("powers")!;
  powersDiv.innerHTML = "";
  (character.powers || []).forEach((power) => {
    if (!power || !power.name) return;
    const button = document.createElement("button");
    const displayText = Util.toTitleCase(power.name);
    button.title = power.book && power.page ? `${power.book} p${power.page}` : '';
    button.textContent = displayText;
    button.type = "button";
    button.className = "popup-roll-btn popup-power-btn";

    // Check if power has damage property (from damagePowers enhancement)
    if (power.damage) {
      // Power has damage - treat it like a weapon with damage dice
      button.dataset.die = power.damage;
      button.dataset.weapon = power.name;
      button.classList.add("popup-power-damage-btn");
      Debug.log(`Created damage power button for ${power.name} with damage: ${power.damage}`);
    } else {
      // Power has no damage - treat it as a regular arcane skill roll
      button.dataset.die = character.skills.find(t => t.name === character.arcaneSkill)?.die;
      button.dataset.skill = character.arcaneSkill;
      Debug.log(`Created regular power button for ${power.name} with arcane skill`);
    }

    powersDiv.appendChild(button);
  });

  // Arcane Info
  const arcaneInfoDiv = document.getElementById("arcane-info")!;
  arcaneInfoDiv.innerHTML = "";
  if (character.arcaneBackground) {
    const p = document.createElement("p");
    p.className = "popup-arcane-info";
    p.textContent = `Arcane Background: ${character.arcaneBackground} (Skill: ${character.arcaneSkill || '-'})`;
    arcaneInfoDiv.appendChild(p);
  }

  // Other fields
  if (character.pace !== undefined) (document.getElementById("pace") as HTMLSpanElement).textContent = String(character.pace);
  if (character.parry !== undefined) (document.getElementById("parry") as HTMLSpanElement).textContent = String(character.parry);
  if (character.toughness !== undefined) {
    const toughnessElement = document.getElementById("toughness") as HTMLSpanElement;
    // Show toughness with armor value if available, otherwise use original format or just the number
    if (character.armorValue !== undefined && character.armorValue > 0) {
      toughnessElement.textContent = `${character.toughness} (${character.armorValue})`;
    } else {
      toughnessElement.textContent = String(character.toughness);
    }
  }
  if (character.rank !== undefined) (document.getElementById("rank") as HTMLSpanElement).textContent = String(character.rank);

  // Set textarea values and hide empty sections
  const edgesTextarea = document.getElementById("edges") as HTMLTextAreaElement;
  const hindrancesTextarea = document.getElementById("hindrances") as HTMLTextAreaElement;
  const gearTextarea = document.getElementById("gear") as HTMLTextAreaElement;
  const specialAbilitiesTextarea = document.getElementById("specialAbilities") as HTMLTextAreaElement;
  const advancesTextarea = document.getElementById("advances") as HTMLTextAreaElement;

  if (character.edges && character.edges.length > 0) {
    if (edgesTextarea.rows >= character.edges.length) edgesTextarea.rows = character.edges.length
    else edgesTextarea.rows = 3;
    edgesTextarea.value = character.edges.join("\n");
    document.getElementById("edges-section")?.classList.remove("hidden");
  } else {
    document.getElementById("edges-section")?.classList.add("hidden");
  }

  if (character.hindrances && character.hindrances.length > 0) {
    if (hindrancesTextarea.rows >= character.hindrances.length) hindrancesTextarea.rows = character.hindrances.length
    else hindrancesTextarea.rows = 3;
    hindrancesTextarea.value = character.hindrances.join("\n");
    document.getElementById("hindrances-section")?.classList.remove("hidden");
  } else {
    document.getElementById("hindrances-section")?.classList.add("hidden");
  }

  if (character.gear && character.gear.length > 0) {
    if (gearTextarea.rows >= character.gear.length) gearTextarea.rows = character.gear.length
    else gearTextarea.rows = 3;
    gearTextarea.value = character.gear.join("\n");
    document.getElementById("gear-section")?.classList.remove("hidden");
  } else {
    document.getElementById("gear-section")?.classList.add("hidden");
  }

  if (character.specialAbilities && character.specialAbilities.length > 0) {
    if (specialAbilitiesTextarea.rows >= character.specialAbilities.length) specialAbilitiesTextarea.rows = character.specialAbilities.length
    else specialAbilitiesTextarea.rows = 3;
    specialAbilitiesTextarea.value = character.specialAbilities.join("\n");
    document.getElementById("special-abilities-section")?.classList.remove("hidden");
  } else {
    document.getElementById("special-abilities-section")?.classList.add("hidden");
  }

  if (character.advances && character.advances.length > 0) {
    if (advancesTextarea.rows >= character.advances.length) advancesTextarea.rows = character.advances.length
    else advancesTextarea.rows = 3;
    advancesTextarea.value = character.advances.join("\n");
    document.getElementById("advances-section")?.classList.remove("hidden");
  } else {
    document.getElementById("advances-section")?.classList.add("hidden");
  }

  // Hide powers section if no powers or arcane background
  const powersSection = document.getElementById("powers-section");
  const hasPowers = character.powers && character.powers.length > 0;
  const hasArcaneBackground = character.arcaneBackground && character.arcaneBackground.trim() !== '';

  if (hasPowers || hasArcaneBackground) {
    powersSection?.classList.remove("hidden");
  } else {
    powersSection?.classList.add("hidden");
  }
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

  // Handle complex cases like "d12+6+d8" where there are modifiers in the middle
  // First, extract all dice patterns and modifiers separately
  const diceMatches = damageWithoutModifier.match(/[dD]\d+/g) || [];
  const modifierMatches = damageWithoutModifier.match(/[+-]\d+/g) || [];

  if (diceMatches.length > 0) {
    // If we have both dice and modifiers in the middle (like "d12+6+d8")
    // Check if we have modifiers and the total count makes sense
    if (modifierMatches.length > 0) {
      // Count the actual components by splitting and filtering out empty/duplicate separators
      const components = damageWithoutModifier.split(/([+-]\d+)|([dD]\d+)/).filter(Boolean);
      // Filter out standalone +/- signs that aren't part of modifiers
      const validComponents = components.filter(comp => comp.match(/[dD]\d+/) || comp.match(/[+-]\d+/));

      if (diceMatches.length + modifierMatches.length === validComponents.length) {
        Debug.log(`Found complex damage pattern: dice=${JSON.stringify(diceMatches)}, middleModifiers=${JSON.stringify(modifierMatches)}`);

        // Sum all the middle modifiers
        const middleModifiersSum = modifierMatches.reduce((sum, mod) => sum + parseInt(mod), 0);
        const totalModifier = finalModifier + middleModifiersSum;

        Debug.log(`Complex damage parsed: dice=${JSON.stringify(diceMatches)}, totalModifier=${totalModifier}`);
        return { dice: diceMatches, modifier: totalModifier };
      }
    }

    // Simple case with just dice
    Debug.log(`Found dice matches: ${JSON.stringify(diceMatches)}`);
    return { dice: diceMatches, modifier: finalModifier };
  }

  // Split the remaining string by "+" to get individual dice (fallback for simple cases)
  const diceParts = damageWithoutModifier.split('+').map(part => part.trim()).filter(part => part);

  // If we didn't find any dice, try splitting by other separators
  if (diceParts.length === 1 && diceParts[0] === damageWithoutModifier) {
    // Try to find individual dice patterns
    const fallbackDiceMatches = damageWithoutModifier.match(/[dD]\d+/g);
    if (fallbackDiceMatches) {
      Debug.log(`Found fallback dice matches: ${JSON.stringify(fallbackDiceMatches)}`);
      return { dice: fallbackDiceMatches, modifier: finalModifier };
    }
  }

  //Debug.log(`Parsed weapon damage: dice=${JSON.stringify(diceParts)}, modifier=${finalModifier}`);
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

        // Apply ROF modifier: -2 for ROF rolls unless character has "rock and roll" edge
        const skillName = target.dataset.skill || '';
        if (skillName.startsWith('rof-')) {
          // Check if character has "rock and roll" edge
          let hasRockAndRoll = false;
          if (currentItemId) {
            try {
              const items = await OBR.scene.items.getItems([currentItemId]);
              const item = items[0];
              const metadata = item.metadata[Util.StatBlockMkey] as { character?: Character };
              if (metadata?.character?.edges) {
                hasRockAndRoll = metadata.character.edges.some(edge =>
                  edge.toLowerCase().includes('rock and roll')
                );
              }
            } catch (e) {
              Debug.log("Failed to check for rock and roll edge:", e);
            }
          }

          // Apply -2 modifier if character doesn't have rock and roll edge
          if (!hasRockAndRoll) {
            modifier -= 2;
            Debug.log(`Applied ROF -2 modifier. Final modifier: ${modifier}`);
          } else {
            Debug.log(`Character has rock and roll edge, skipping ROF modifier`);
          }
        }
      }

      // Get player ID and send roll request to room metadata
      const playerId = await OBR.player.getId();

      // Get the current character's isWildCard flag from the stored metadata
      // We need to get this from the item metadata since we're not storing it in the DOM
      let isWildCard = false;
      if (currentItemId) {
        try {
          const items = await OBR.scene.items.getItems([currentItemId]);
          const item = items[0];
          const metadata = item.metadata[Util.StatBlockMkey] as { character?: Character };
          if (metadata?.character?.isWildCard) {
            isWildCard = metadata.character.isWildCard;
          }
        } catch (e) {
          Debug.log("Failed to get isWildCard from metadata, defaulting to false");
        }
      }

      // Include isWildCard in the roll request for trait rolls
      const rollRequest = {
        dice,
        rollType,
        modifier,
        playerId,
        ...(rollType === 'trait' && { isWildCard })
      };

      // Use scene metadata only
      try {
        const isSceneReady = await OBR.scene.isReady();
        if (!isSceneReady) {
          Debug.log("Scene not ready, waiting for scene to be ready");
          // Wait for scene to be ready
          while (!await OBR.scene.isReady()) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        await OBR.scene.setMetadata({ [Util.SceneRollRequestMkey]: rollRequest });
        Debug.log("Roll request saved to scene metadata");
      } catch (error) {
        console.error("Failed to save roll request to scene metadata:", error);
        // No fallback to room metadata - only use scene metadata
      }
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