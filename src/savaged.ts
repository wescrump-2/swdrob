
import { Debug } from './debug';

function splitIgnoringParentheses(str: string, separator: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (depth === 0 && str.substr(i, separator.length) === separator) {
            result.push(current.trim());
            current = '';
            i += separator.length - 1;
        } else {
            current += char;
        }
    }
    if (current.trim()) result.push(current.trim());
    return result;
}

function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // remove non-alphanumeric except spaces
        .split(' ')
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

export interface Character {
    name: string;
    description?: string;
    race?: string;
    rank?: string;
    gender?: string;
    profession?: string;
    background?: string;
    experience?: number;
    bennies?: number;
    rolls: Record<string, string>;
    pace?: number;
    parry?: number;
    toughness?: number;
    armor?: string;
    edges?: string[];
    hindrances?: string[];
    weapons?: { name: string; attack?: string; damage?: string }[];
    gear?: string[];
    languages?: string[];
    wealth?: string;
    arcaneBackground?: string;
    powerPoints?: number;
    powers?: string[];
    specialAbilities?: string[];
    advances?: string[];
}

export class Savaged {
    static PROXY_BASE = "https://owlbearproxy.vercel.app/api/proxy";
    static proxy_url_base = "https://owlbearproxy.vercel.app/url/proxy";
    static API_KEY: string = '12271xNGRlMzAyYTctMzJkMy00NzhhLThiYmUtZTQ1NDU2YWIyNWY0';

    static async checkProxyStatus(): Promise<number> {
        Debug.log("Checking proxy server status...");
        try {
            const proxyResponse = await fetch(Savaged.PROXY_BASE, { method: 'HEAD' });
            Debug.log(`Proxy server status: ${proxyResponse.statusText}`);
            return proxyResponse.status
        } catch (e) {
            Debug.error(`Proxy server unreachable: ${e}`);
        }
        return 0;
    }

    static async testApiConnection(api_key: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/whoami`;
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: `apikey=${encodeURIComponent(api_key)}`
        };
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (response.ok && data.name && data.name.length > 2) {
                Debug.log(`Connected as ${data.name}! API key valid.`, "SUCCESS");
                return true;
            } else {
                Debug.log("Invalid API key.", "ERROR");
                return false;
            }
        } catch (e) {
            Debug.error(`Connection failed`);
            return false;
        }
    }

    static async fetchUserData(api_key: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/get-user-data`;
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: `apikey=${encodeURIComponent(api_key)}`
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const ptext = await response.text();
                Debug.error(`HTTP ${response.status} ${ptext}`);
                return JSON.stringify(response);
            } else {
                const data = await response.json();
                Debug.log(`Successfully fetched user data`);
                return data;
            }
        } catch (e) {
            Debug.error(`Failed to load user data`);
            return null;
        }
    }

    static async fetchCharacters(api_key: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/get-characters-generic-json`;
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: `apikey=${encodeURIComponent(api_key)}`
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const ptext = await response.text();
                Debug.error(`HTTP ${response.status} ${ptext}`);
                return JSON.stringify(response);
            } else {
                const data = await response.json();
                Debug.log(`Successfully fetched ${data.length} characters`);
                return data;
            }
        } catch (e) {
            Debug.error(`Failed to load characters`);
            return JSON.stringify(e);
        }
    }

    static async fetchSaved(api_key: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/get-saves`;
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: `apikey=${encodeURIComponent(api_key)}`
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const ptext = await response.text();
                Debug.error(`HTTP ${response.status} ${ptext}`);
                return JSON.stringify(response);
            } else {
                const data = await response.json();
                Debug.log(`Successfully fetched ${data.length} saves`);
                return data;
            }
        } catch (e) {
            Debug.error(`Failed to load saves`);
            return JSON.stringify(e);
        }
    }

    static async fetchThisCharacter(api_key: string, uuid: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/get-character-by-uuid-generic-json`;
        const bodyData = { apikey: api_key, search: uuid };
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: JSON.stringify(bodyData)
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const ptext = await response.text();
                Debug.error(`HTTP ${response.status} ${ptext}`);
                return JSON.stringify(response);
            } else {
                const data = await response.json();
                Debug.log(`Successfully fetched character`);
                return data;
            }
        } catch (e) {
            Debug.error(`Failed to load character`);
            return JSON.stringify(e);
        }
    }

    static async searchBestiary(api_key: string, searchString: string) {
        const url = `${Savaged.PROXY_BASE}/_api/auth/search-bestiary-generic-json`;
        const bodyData = { apikey: api_key, search: searchString };
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(bodyData)
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const ptext = await response.text();
                Debug.error(`HTTP ${response.status} ${ptext}`);
                return JSON.stringify(response);
            } else {
                const data = await response.json();
                Debug.log(`Successfully fetched ${data.length} beasts`);
                return data;
            }
        } catch (e) {
            Debug.error(`Bestiary search failed`);
            return JSON.stringify(e);
        }
    }

    static async parseCharacterFromURL(url: string): Promise<Character> {
        try {
            const proxyUrl = `${Savaged.proxy_url_base}`;
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            };
            const response = await fetch(proxyUrl, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            Debug.log(`Fetched HTML from ${url} via proxy, length: ${html.length}`);
            return this.parseCharacterFromHTML(html);
        } catch (e) {
            Debug.error(`Failed to fetch character from ${url}: ${e}`);
            throw e;
        }
    }

    static parseCharacterFromHTML(html: string): Character {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.content span');
        const character: Character = { name: 'name', description: '', rolls: {} };
        if (!content) {
            Debug.error('Character content not found');
        } else {
            const text = content.innerHTML;
            const nameMatch = text.match(/<h1>([^<]*)<\/h1>/);
            const name = nameMatch ? nameMatch[1] : '';
            character.name = name;

            const h1 = doc.querySelector('h1');
            if (h1) {
                const nextDiv = h1.nextElementSibling;
                if (nextDiv && nextDiv.tagName === 'DIV') {
                    const quickText = nextDiv.textContent || '';
                    const parts = quickText.split(', ').map(p => p.trim());
                    parts.forEach(part => {
                        const [key, value] = part.split(': ').map(s => s.trim());
                        if (key === 'Rank') character.rank = value;
                        else if (key === 'Gender') character.gender = value;
                        else if (key === 'Race') character.race = value;
                        else if (key === 'Profession') character.profession = value;
                    });
                    if (!character.race) character.race = 'Human';
                }
            }

            // Parse description
            const descH2 = Array.from(doc.querySelectorAll('h2')).find(h2 => h2.textContent.trim().includes('Description'));
            if (descH2 && descH2.nextElementSibling) {
                character.description = descH2.nextElementSibling.textContent?.trim();
            }
            const rolls: Record<string, string> = {};
            character.rolls = rolls;

            // Attributes
            const attributesMatch = text.match(/<strong>Attributes<\/strong>: ([^<]*)/);
            if (attributesMatch) {
                attributesMatch[1].split(', ').forEach(attr => {
                    const [n, d] = attr.split(' ');
                    rolls[n.toLowerCase()] = d;
                });
                //Debug.log(`Parsed ${attributesMatch[1].split(', ').length} attributes`);
            }
            // Skills
            const skillsMatch = text.match(/<strong>Skills<\/strong>: ([^<]*)/);
            if (skillsMatch) {
                //Debug.log(`Skills string: "${skillsMatch[1]}"`);
                skillsMatch[1].split(', ').forEach(skill => {
                    //Debug.log(`Processing skill: "${skill}"`);
                    const parts = skill.trim().split(' ');
                    if (parts.length >= 2) {
                        const d = parts.pop()!;
                        const n = parts.join(' ');
                        rolls[toCamelCase(n)] = d;
                        //Debug.log(`Parsed skill: "${n}" -> "${d}"`);
                    } else {
                        Debug.log(`Skipping invalid skill: "${skill}"`);
                    }
                });
                //Debug.log(`Parsed ${skillsMatch[1].split(', ').length} skills`);
            }
            // Weapons
            const weaponsMatch = text.match(/<strong>Weapons<\/strong>: ([^<]*)/);
            if (weaponsMatch) {
                const weaponsStr = weaponsMatch[1];
                //Debug.log(`Weapons string: "${weaponsStr}"`);
                const weaponParts = weaponsStr.split('), ');
                character.weapons = [];
                weaponParts.forEach(part => {
                    part = part.replace(/\)$/g, '');
                    const [name, details] = part.split(' (Range ');
                    //Debug.log(`Processing weapon: "${name}", details: "${details}"`);
                    if (details) {
                        const [_range, damagePart] = details.split(', Damage ');
                        let damage = damagePart.replace('<sup>us<\/sup>', '');
                        // Substitute attribute abbreviations with actual dice
                        damage = damage.replace(/Str/gi, rolls.strength || 'd4');
                        damage = damage.replace(/Agi/gi, rolls.agility || 'd4');
                        damage = damage.replace(/Sma/gi, rolls.smarts || 'd4');
                        damage = damage.replace(/Spi/gi, rolls.spirit || 'd4');
                        damage = damage.replace(/Vig/gi, rolls.vigor || 'd4');
                        const attackKey = `${name.toLowerCase().replace(/[^a-z]/g, '')}_attack`;
                        const damageKey = `${name.toLowerCase().replace(/[^a-z]/g, '')}_damage`;
                        rolls[attackKey] = rolls.fighting || 'd4';
                        rolls[damageKey] = damage;
                        character.weapons!.push({ name: name.trim(), attack: rolls[attackKey], damage });
                        //Debug.log(`Parsed ranged weapon: "${name}" -> attack: "${rolls[attackKey]}", damage: "${damage}"`);
                    } else {
                        // Melee weapon, damage is 'Str' or similar
                        let damage = 'Str'; // assuming it's 'Str' as per user
                        damage = damage.replace(/Str/gi, rolls.strength || 'd4');
                        const damageKey = `${name.toLowerCase()}_damage`;
                        rolls[damageKey] = damage;
                        character.weapons!.push({ name: name.trim(), damage });
                        //Debug.log(`Parsed melee weapon: "${name}" -> damage: "${damage}"`);
                    }
                });
                //Debug.log(`Parsed ${weaponParts.length} weapons`);
            }
            // Arcane Background
            const arcaneMatch = text.match(/<strong>Arcane Background<\/strong>: ([^<]*)/);
            if (arcaneMatch) {
                rolls.arcane = rolls.smarts || 'd4';
                character.arcaneBackground = arcaneMatch[1].trim();
                //Debug.log(`Parsed arcane background: "${character.arcaneBackground}"`);
            }
            // Powers
            const powersMatch = text.match(/<strong>Powers<\/strong>: ([^<]*)/);
            if (powersMatch) {
                character.powers = [];
                powersMatch[1].split(', ').forEach(power => {
                    const p = power.split(' (')[0];
                    rolls[p.toLowerCase()] = rolls.arcane;
                    character.powers!.push(p.trim());
                });
                //Debug.log(`Parsed ${character.powers.length} powers`);
            }
            // Modifiers
            if (text.includes('Subtract 2 from all Persuasion rolls')) {
                //Debug.log(`Persuasion before modifier: "${rolls.persuasion}"`);
                if (!rolls.persuasion || !rolls.persuasion.includes('-')) {
                    rolls.persuasion = (rolls.persuasion || 'd4') + '-2';
                    //Debug.log('Applied persuasion modifier');
                } else {
                    //Debug.log('Persuasion already has modifier, skipping additional -2');
                }
            }

            // Additional fields
            // Pace
            const paceMatch = text.match(/<strong>Pace<\/strong>: (\d+)/);
            if (paceMatch) {
                character.pace = parseInt(paceMatch[1]);
                //Debug.log(`Parsed pace: ${character.pace}`);
            }
            // Parry
            const parryMatch = text.match(/<strong>Parry<\/strong>: (\d+)/);
            if (parryMatch) {
                character.parry = parseInt(parryMatch[1]);
                //Debug.log(`Parsed parry: ${character.parry}`);
            }
            // Toughness
            const toughnessMatch = text.match(/<strong>Toughness<\/strong>: (\d+)/);
            if (toughnessMatch) {
                character.toughness = parseInt(toughnessMatch[1]);
                //Debug.log(`Parsed toughness: ${character.toughness}`);
            }
            // Armor
            const armorMatch = text.match(/<strong>Armor<\/strong>: ([^<]*)/);
            if (armorMatch) {
                character.armor = armorMatch[1].trim();
                //Debug.log(`Parsed armor: "${character.armor}"`);
            }
            // Edges
            const edgesMatch = text.match(/<strong>Edges<\/strong>: ([^<]*)/);
            if (edgesMatch) {
                character.edges = splitIgnoringParentheses(edgesMatch[1], ', ');
                //Debug.log(`Parsed ${character.edges!.length} edges`);
            }
            // Hindrances
            const hindrancesMatch = text.match(/<strong>Hindrances<\/strong>: ([^<]*)/);
            if (hindrancesMatch) {
                character.hindrances = splitIgnoringParentheses(hindrancesMatch[1], ', ');
                //Debug.log(`Parsed ${character.hindrances!.length} hindrances`);
            }
            // Gear
            const gearMatch = text.match(/<strong>Gear<\/strong>: ([^<]*)/);
            if (gearMatch) {
                character.gear = [];
                splitIgnoringParentheses(gearMatch[1], ', ').forEach(g => {
                    g = g.trim();
                    const containerMatch = g.match(/^(.+?)\s*\(Contains:?\s*(.+)\)$/);
                    if (containerMatch) {
                        const container = containerMatch[1].trim();
                        const contentsStr = containerMatch[2].replace(/\)$/, '');
                        character.gear!.push(container);
                        const contents = splitIgnoringParentheses(contentsStr, ', ');
                        contents.forEach(c => character.gear!.push(c.trim()));
                    } else {
                        character.gear!.push(g);
                    }
                });
                //Debug.log(`Parsed ${character.gear.length} gear items`);
            }
            // Languages
            const languagesMatch = text.match(/<strong>Languages<\/strong>: ([^<]*)/);
            if (languagesMatch) {
                character.languages = languagesMatch[1].split(', ').map(l => l.trim());
                //Debug.log(`Parsed ${character.languages.length} languages`);
            }
            // Wealth
            const wealthMatch = text.match(/<strong>Wealth<\/strong>: ([^<]*)/);
            if (wealthMatch) {
                character.wealth = wealthMatch[1].trim();
                //Debug.log(`Parsed wealth: "${character.wealth}"`);
            }
            // Power Points
            const ppMatch = text.match(/<strong>Power Points<\/strong>: (\d+)/);
            if (ppMatch) {
                character.powerPoints = parseInt(ppMatch[1]);
                //Debug.log(`Parsed power points: ${character.powerPoints}`);
            }
            // Special Abilities
            const saMatch = text.match(/<strong>Special Abilities<\/strong>: ([^<]*)/);
            if (saMatch) {
                character.specialAbilities = saMatch[1].split(', ').map(s => s.trim());
                //Debug.log(`Parsed ${character.specialAbilities.length} special abilities`);
            }
            // Advances
            const advancesMatch = text.match(/<strong>Advances<\/strong>: ([^<]*)/);
            if (advancesMatch) {
                character.advances = advancesMatch[1].split(', ').map(a => a.trim());
                //Debug.log(`Parsed ${character.advances.length} advances`);
            }
            // Parse background
            const bgH2 = Array.from(doc.querySelectorAll('h2')).find(h2 => h2.textContent.trim().includes('Background'));
            if (bgH2 && bgH2.nextElementSibling) {
                character.background = bgH2.nextElementSibling.textContent?.trim();
            }
            // Experience
            const expMatch = text.match(/<strong>Experience<\/strong>: (\d+)/);
            if (expMatch) {
                character.experience = parseInt(expMatch[1]);
                //Debug.log(`Parsed experience: ${character.experience}`);
            }
            // Bennies
            const benniesMatch = text.match(/<strong>Bennies<\/strong>: (\d+)/);
            if (benniesMatch) {
                character.bennies = parseInt(benniesMatch[1]);
                //Debug.log(`Parsed bennies: ${character.bennies}`);
            }

            // Add default unskilled roll
            rolls.unskilled = 'd4-2';
            //Debug.log('Added default unskilled roll: d4-2');

            //Debug.log(`Total rolls parsed: ${Object.keys(rolls).length}`);
            Debug.log('Character parsed successfully', character);
        }
        return character;
    }
}