
import { Debug } from './debug';

export interface Trait {
    name: string;
    die: string;
}
export interface Weapon {
    name: string;
    attack?: string;
    damage?: string;
    range?: string;
    reach?: string;
    parry?: string;
    rof?: string;
    ap?: string;
    thrownAttack?: string;
}

export interface Armor {
    name: string;
    value: number;
}

export interface Power {
    name: string;
    book?: string;
    page?: string;
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
    attributes: Trait[];
    skills: Trait[];
    pace?: number;
    parry?: number;
    toughness?: number;
    armor?: Armor[];
    edges?: string[];
    hindrances?: string[];
    weapons?: Weapon[];
    gear?: string[];
    languages?: string[];
    wealth?: string;
    arcaneBackground?: string;
    arcaneSkill?: string;
    powerPoints?: number;
    powers?: Power[];
    specialAbilities?: string[];
    advances?: string[];
}

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

export class Savaged {
    static PROXY_BASE = "https://owlbearproxy.vercel.app/api/proxy";
    static proxy_url_base = "https://owlbearproxy.vercel.app/url/proxy";
    static API_KEY: string = '12271xNGRlMzAyYTctMzJkMy00NzhhLThiYmUtZTQ1NDU2YWIyNWY0';
/*
"/auth/get-saves"
"/campaigns/get-setting-from-session-id"
"/wc/bestiary-export-json-generic/"
"/wc/bestiary-fantasy-grounds/"
*/
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
        const character: Character = { name: 'name', description: '', attributes: [], skills: [] };
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

            const getSkillDie = (name: string) => character.skills.find(t => t.name === name)?.die || 'd4-2';

            // Attributes
            const attributesMatch = text.match(/<strong>Attributes<\/strong>: ([^<]*)/);
            if (attributesMatch) {
                attributesMatch[1].split(', ').forEach(attr => {
                    const [n, d] = attr.split(' ');
                    character.attributes.push({ name: n.toLowerCase(), die: d });
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
                        character.skills.push({ name: toCamelCase(n), die: d });
                        //Debug.log(`Parsed skill: "${n}" -> "${d}"`);
                    } else {
                        Debug.log(`Skipping invalid skill: "${skill}"`);
                    }
                });
                //Debug.log(`Parsed ${skillsMatch[1].split(', ').length} skills`);
            }
            // Weapons
            const weaponsStrong = Array.from(doc.querySelectorAll('strong')).find(strong => strong.textContent?.trim() === 'Weapons');
            if (weaponsStrong) {
                let weaponsStr = '';
                let current = weaponsStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        weaponsStr += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'SUP') {
                            // include sup text with parentheses
                            weaponsStr += ' (' + el.textContent + ')';
                        } else if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (weaponsStr.startsWith(': ')) {
                    weaponsStr = weaponsStr.substring(2);
                }
                //Debug.log(`Weapons string: "${weaponsStr}"`);
                const weaponParts = weaponsStr.split('), ');
                character.weapons = [];
                weaponParts.forEach(part => {
                    part = part.replace(/\)$/g, '');
                    const [name, detailsStr] = part.split(' (');
                    if (detailsStr) {
                        const detailParts = detailsStr.split(', ');
                        const detailMap: Record<string, string> = {};
                        detailParts.forEach(p => {
                            p = p.trim();
                            if (p.match(/^[-+]\d+ Parry$/)) {
                                const value = p.replace(' Parry', '');
                                detailMap['parry'] = value;
                            } else {
                                let key: string, value: string;
                                if (p.includes(': ')) {
                                    [key, value] = p.split(': ');
                                } else {
                                    const spaceIndex = p.indexOf(' ');
                                    if (spaceIndex !== -1) {
                                        key = p.substring(0, spaceIndex);
                                        value = p.substring(spaceIndex + 1);
                                    } else {
                                        return; // invalid part
                                    }
                                }
                                detailMap[key.toLowerCase().replace(':', '')] = value.trim();
                            }
                        });
                        let damage = detailMap['damage'];
                        if (damage) {
                            // Substitute attribute abbreviations with actual dice
                            const getAttributeDie = (name: string) => character.attributes.find(t => t.name === name)?.die || 'd4';
                            damage = damage.replace(/Str/gi, getAttributeDie('strength'));
                            damage = damage.replace(/Agi/gi, getAttributeDie('agility'));
                            damage = damage.replace(/Sma/gi, getAttributeDie('smarts'));
                            damage = damage.replace(/Spi/gi, getAttributeDie('spirit'));
                            damage = damage.replace(/Vig/gi, getAttributeDie('vigor'));
                        }
                        const thrownWeapons = ['axe, hand', 'axe, throwing', 'dagger', 'knife', 'net', 'sling', 'spear', 'javelin', 'trident', 'starknife', 'shuriken', 'bolas', 'hammer', 'warhammer'];
                        const onlyThrownWeapons = ['net', 'sling', 'shuriken', 'bolas'];
                        const weaponNameLower = name.toLowerCase();
                        const isThrown = thrownWeapons.some(tw => weaponNameLower.includes(tw));
                        const isOnlyThrown = onlyThrownWeapons.some(tw => weaponNameLower.includes(tw));
                        const isMelee = !detailMap['range'] || detailMap['range'].toLowerCase() === 'melee';
                        const isShooting = !isMelee && !isThrown;
                        let attack: string | undefined;
                        let thrownAttack: string | undefined;
                        const getSkillDie = (name: string) => character.skills.find(t => t.name === name)?.die || 'd4-2';
                        if (isMelee && !isThrown) {
                            attack = getSkillDie('fighting');
                        } else if (isThrown) {
                            if (isOnlyThrown) {
                                attack = getSkillDie('athletics');
                            } else {
                                attack = getSkillDie('fighting');
                                thrownAttack = getSkillDie('athletics');
                            }
                        } else if (isShooting) {
                            attack = getSkillDie('shooting');
                        }
                        const weapon = {
                            name: name.trim(),
                            attack,
                            damage,
                            range: (detailMap['range'] || 'melee').toLowerCase(),
                            reach: detailMap['reach'] || (isMelee ? '1' : undefined),
                            parry: detailMap['parry'] || (isMelee ? '0' : undefined),
                            rof: detailMap['rof'] || (!isMelee ? '1' : undefined),
                            ap: detailMap['ap'],
                            thrownAttack
                        };
                        character.weapons!.push(weapon);
                        //Debug.log(`Parsed weapon: "${name}" -> attack: "${weapon.attack}", damage: "${damage}", reach: "${weapon.reach}", parry: "${weapon.parry}", rof: "${weapon.rof}"`);
                    }
                });
                //Debug.log(`Parsed ${weaponParts.length} weapons`);
            }
            // Arcane Background
            const arcaneStrong = Array.from(doc.querySelectorAll('strong')).find(strong => strong.textContent?.trim() === 'Arcane Background');
            if (arcaneStrong) {
                let arcaneStr = '';
                let current = arcaneStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        arcaneStr += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'UL' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (arcaneStr.startsWith(': ')) {
                    arcaneStr = arcaneStr.substring(2);
                }
                const bgName = arcaneStr.trim().split(' (')[0]; // e.g., "Cleric" or "Arcane"
                const skillMap: { [key: string]: string } = {
                    'Bard': 'performance',
                    'Cleric': 'faith',
                    'Druid': 'faith',
                    'Miracles': 'faith',
                    'Alchemist': 'alchemy',
                    'Oracle': 'faith',
                    'Gifted': 'focus',
                    'Psionics': 'psionics',
                    'Weird Science': 'weird science'
                };
                const skillName = skillMap[bgName] || 'spellcasting';
                const arcaneDie = getSkillDie(skillName) || getSkillDie('unskilled');
                character.skills.push({ name: 'arcane', die: arcaneDie });
                character.arcaneBackground = arcaneStr.trim();
                character.arcaneSkill = skillName;
                //Debug.log(`Parsed arcane background: "${character.arcaneBackground}", skill: "${skillName}", die: "${arcaneDie}"`);
            }
            // Powers
            const powersMatch = text.match(/Powers: ([^<]*)/i);
            if (powersMatch) {
                character.powers = [];
                //const arcaneDie = getSkillDie(character.arcaneSkill);
                powersMatch[1].split(', ').forEach(power => {
                    const match = power.trim().match(/(.*?) \((.*?) p(\d+)\)/);
                    let name: string, book: string | undefined, page: string | undefined;
                    if (match) {
                        name = match[1].trim();
                        book = match[2].trim();
                        page = match[3].trim();
                    } else {
                        name = power.split(' (')[0].trim();
                        book = undefined;
                        page = undefined;
                    }
                    character.powers!.push({ name, book, page});
                });
                //Debug.log(`Parsed ${character.powers.length} powers`);
            }
            // Modifiers
            if (text.includes('Subtract 2 from all Persuasion rolls')) {
                const persuasionTrait = character.skills.find(t => t.name === 'persuasion');
                if (persuasionTrait && !persuasionTrait.die.includes('-')) {
                    persuasionTrait.die = (persuasionTrait.die || 'd4') + '-2';
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
                character.armor = [];
                armorMatch[1].split(', ').forEach(a => {
                    const match = a.trim().match(/^(.+?)\s*\(Armor\s*(\d+)\)$/);
                    if (match) {
                        character.armor!.push({ name: match[1].trim(), value: parseInt(match[2]) });
                    }
                });
                //Debug.log(`Parsed ${character.armor.length} armor items`);
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
            const gearStrong = Array.from(doc.querySelectorAll('strong')).find(strong => strong.textContent?.trim() === 'Gear');
            if (gearStrong) {
                let gearStr = '';
                let current = gearStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        gearStr += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (gearStr.startsWith(': ')) {
                    gearStr = gearStr.substring(2);
                }
                character.gear = [];
                splitIgnoringParentheses(gearStr, ', ').forEach(g => {
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
                //Debug.log(`Parsed ${character.gear?.length} gear items`);
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
            const saH3 = Array.from(doc.querySelectorAll('h3')).find(h3 => h3.textContent?.trim() === 'Special Abilities');
            if (saH3 && saH3.nextElementSibling && saH3.nextElementSibling.tagName === 'UL') {
                const ul = saH3.nextElementSibling as HTMLUListElement;
                const lis = ul.querySelectorAll('li');
                character.specialAbilities = Array.from(lis).map(li => li.textContent?.trim() || '').filter(Boolean);
                //Debug.log(`Parsed ${character.specialAbilities?.length} special abilities`);
            }
            // Advances
            const advancesH3 = Array.from(doc.querySelectorAll('h3')).find(h3 => h3.textContent?.trim() === 'Advances');
            if (advancesH3) {
                const advances: string[] = [];
                let current = advancesH3.nextElementSibling;
                let currentRank = '';
                while (current) {
                    if (current.tagName === 'STRONG' && current.textContent?.includes('Advances')) {
                        const rankMatch = current.textContent.match(/^(.+?) Advances$/);
                        if (rankMatch) {
                            currentRank = rankMatch[1] + ': ';
                        }
                    } else if (current.tagName === 'UL') {
                        const lis = current.querySelectorAll('li');
                        Array.from(lis).forEach(li => {
                            const text = li.textContent?.trim();
                            if (text) advances.push(currentRank + text);
                        });
                    }
                    current = current.nextElementSibling;
                    if (current && current.tagName === 'H3') break; // stop at next h3
                }
                character.advances = advances;
                //Debug.log(`Parsed ${character.advances?.length} advances`);
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
            character.skills.push({ name: 'unskilled', die: 'd4-2' });
            //Debug.log('Added default unskilled roll: d4-2');

            //Debug.log(`Total rolls parsed: ${Object.keys(rolls).length}`);
            Debug.log('Character parsed successfully', character);
        }
        return character;
    }
}