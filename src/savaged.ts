
import { Debug } from './debug';
import { Util } from './util';

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
    armorValue?: number;
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
    isWildCard?: boolean;
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

/**
 * Extracts all lines for a section into one string separated by spaces.
 * Each section ends when the next line has the start marker for the next section.
 * Handles multi-line content and special abilities that may span multiple lines.
 *
 * @param lines Array of text lines to process
 * @param startIndex Starting line index
 * @param sectionHeaders Array of section header patterns to detect section boundaries
 * @returns Object containing the extracted section content and the ending line index
 */
function extractSectionContent(lines: string[], startIndex: number, sectionHeaders: string[]): { content: string, endIndex: number } {
    let content = '';
    let currentIndex = startIndex;
    const sectionHeaderPatterns = sectionHeaders.map(header => new RegExp(`^${header}:?`, 'i'));

    // Check if current line is a section header
    const isSectionHeader = (line: string): boolean => {
        return sectionHeaderPatterns.some(pattern => pattern.test(line));
    };

    // Start from the given index and collect content until we hit another section header
    while (currentIndex < lines.length) {
        const line = lines[currentIndex].trim();

        // If the line is not empty, add it to the content
        if (line.length > 0) {
            if (content.length > 0) {
                content += ' ';
            }
            content += line;
        }

        currentIndex++;

        // After adding the current line, check if the next line is a new section header
        if (currentIndex < lines.length) {
            const nextLine = lines[currentIndex].trim();
            // If we encounter a new section header, stop collecting
            if (isSectionHeader(nextLine)) {
                break;
            }
        }
    }

    return {
        content: content.trim(),
        endIndex: currentIndex
    };
}

/**
 * Extracts special ability content, handling multi-line abilities.
 * Each special ability ends when the next line starts with a bullet point or section header.
 *
 * @param lines Array of text lines to process
 * @param startIndex Starting line index
 * @param sectionHeaders Array of section header patterns to detect section boundaries
 * @returns Object containing the extracted ability content and the ending line index
 */
function extractSpecialAbilityContent(lines: string[], startIndex: number, sectionHeaders: string[]): { content: string, endIndex: number } {
    let content = '';
    let currentIndex = startIndex;
    const sectionHeaderPatterns = sectionHeaders.map(header => new RegExp(`^${header}:?`, 'i'));

    // Check if current line is a section header
    const isSectionHeader = (line: string): boolean => {
        return sectionHeaderPatterns.some(pattern => pattern.test(line));
    };

    // Check if line starts a new ability (bullet point or capital letter with colon)
    const isNewAbility = (line: string): boolean => {
        return Boolean(line.match(/^[•\-*]\s/)) ||
               (Boolean(line.match(/^[A-Z]/)) && line.includes(':'));
    };

    // Start from the given index and collect content until we hit another ability or section header
    while (currentIndex < lines.length) {
        const line = lines[currentIndex].trim();

        // If the line is not empty, add it to the content
        if (line.length > 0) {
            if (content.length > 0) {
                content += ' ';
            }
            content += line;
        }

        currentIndex++;

        // After adding the current line, check if the next line is a new section header or ability
        if (currentIndex < lines.length) {
            const nextLine = lines[currentIndex].trim();
            // If we encounter a new section header or new ability, stop collecting
            if (isSectionHeader(nextLine) || isNewAbility(nextLine)) {
                break;
            }
        }
    }

    return {
        content: content.trim(),
        endIndex: currentIndex
    };
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
            Debug.enabled = true;
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
        const content = doc.querySelector('.content');
        const character: Character = { name: 'name', description: '', attributes: [], skills: [], isWildCard: true };
        if (!content) {
            Debug.error('Character content not found');
        } else {
            const text = content.innerHTML;
            const nameMatch = text.match(/<h1>([^<]*)<\/h1>/);
            const name = nameMatch ? nameMatch[1] : '';
            character.name = Util.toTitleCase(name);

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
                        else if (key === 'Race' || key === 'Type') character.race = value;
                        else if (key === 'Profession') character.profession = value;
                    });

                    // Additional rank parsing for formats like "Rank Veteran" or "Rank:Veteran" (no space after colon)
                    if (!character.rank) {
                        const rankMatch = quickText.match(/Rank[:]?\s*(\w+)/i);
                        if (rankMatch) {
                            character.rank = rankMatch[1];
                        }
                    }

                    // Additional rank parsing for standalone rank lines like "Veteran" or "Novice"
                    if (!character.rank) {
                        const standaloneRankMatch = quickText.match(/\b(Veteran|Novice|Seasoned|Heroic|Legendary)\b/i);
                        if (standaloneRankMatch) {
                            character.rank = standaloneRankMatch[1];
                        }
                    }

                    // Debug logging for rank parsing
                    if (character.rank) {
                        Debug.log(`Parsed rank: ${character.rank}`);
                    } else {
                        Debug.log('No rank found in quick text');
                    }

                    // Additional rank parsing for formats like "Rank: Veteran (something)" with parentheses
                    if (!character.rank) {
                        const rankWithParensMatch = quickText.match(/Rank[:]?\s*(\w+)\s*\([^)]*\)/i);
                        if (rankWithParensMatch) {
                            character.rank = rankWithParensMatch[1];
                            Debug.log(`Parsed rank with parentheses: ${character.rank}`);
                        }
                    }
                    if (!character.race) character.race = 'Human';
                }
            }


        // NEW: Parse description using the 3 patterns
        // Pattern 1: Immediately after the name (for creatures like Baku)
        // Pattern 2: After "Description:" prefix
        // Pattern 3: After "Description" header (like for character Ingrid)

        // Try Pattern 1 first: text immediately after name in the quick info section
        if (!character.description && h1) {
            const nextDiv = h1.nextElementSibling;
            if (nextDiv && nextDiv.tagName === 'DIV') {
                const quickText = nextDiv.textContent || '';
                // Look for multi-line descriptive text that comes right after the name
                // This should be before any section headers like "Rank:", "Attributes:", etc.
                const lines = quickText.split('\n');
                let descriptionLines: string[] = [];
                let foundSectionHeader = false;

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    // Check if this line is a section header
                    if (trimmedLine.match(/^(Rank|Gender|Race|Type|Profession|Attributes|Skills|Weapons|Arcane Background|Powers|Gear|Special Abilities|Advances|Background|Experience|Bennies):/i)) {
                        foundSectionHeader = true;
                        break;
                    }

                    // If we haven't found a section header yet, this might be description text
                    if (!foundSectionHeader) {
                        // Skip lines that look like they contain structured data (key: value pairs)
                        if (!trimmedLine.includes(':') && trimmedLine.length > 10 && !trimmedLine.match(/\b(Veteran|Novice|Seasoned|Heroic|Legendary)\b/i)) {
                            descriptionLines.push(trimmedLine);
                        }
                    }
                }

                if (descriptionLines.length > 0) {
                    character.description = descriptionLines.join(' ').trim();
                }
            }
        }

        // Try Pattern 2: Look for "Description:" prefix
        if (!character.description) {
            const descPrefixMatch = text.match(/Description:\s*([\s\S]*?)(?=\n\n|\n<strong>|<\/p>|<h[2-6]>|<ul>|<ol>|$)/i);
            if (descPrefixMatch && descPrefixMatch[1]) {
                const descText = descPrefixMatch[1].trim();
                if (descText.length > 0) {
                    character.description = descText;
                }
            }
        }

        // Try Pattern 3: Look for "Description" header (h2)
        if (!character.description) {
            const descH2 = Array.from(doc.querySelectorAll('h2')).find(h2 => h2.textContent?.trim().toLowerCase() === 'description');
            if (descH2) {
                let descriptionText = '';
                let current: ChildNode | null = descH2.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        descriptionText += current.textContent?.trim() + ' ';
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR') {
                            descriptionText += '\n';
                        } else if (el.tagName === 'P' || el.tagName === 'DIV') {
                            descriptionText += el.textContent?.trim() + ' ';
                        } else if (el.tagName === 'STRONG' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'UL' || el.tagName === 'OL') {
                            break; // Stop at section headers or lists
                        } else {
                            descriptionText += el.textContent?.trim() + ' ';
                        }
                    }
                    current = current.nextSibling;
                }
                if (descriptionText.trim().length > 0) {
                    character.description = descriptionText.trim();
                }
            }
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
                Debug.log(`Weapons string: "${weaponsStr}"`);
                const weaponParts = weaponsStr.split('), ');
                character.weapons = [];
                Debug.log(`Found ${weaponParts.length} weapon parts to process`);
                weaponParts.forEach((part, index) => {
                    Debug.log(`Processing weapon part ${index + 1}: "${part}"`);
                    part = part.replace(/\)$/g, '').trim();

                    // NEW: Handle nested parentheses in weapon names
                    // Find the last occurrence of "(" that starts the weapon details section
                    // This should be the one that contains "Range", "Damage", etc.
                    const lastDetailsParenIndex = part.lastIndexOf('(Range');
                    if (lastDetailsParenIndex === -1) {
                        Debug.log(`  No weapon details found for: "${part}"`);
                        return; // Skip weapons without proper details
                    }

                    // Extract weapon name (everything before the last details parenthesis)
                    const name = part.substring(0, lastDetailsParenIndex).trim();
                    // Extract details (everything from the last details parenthesis onwards)
                    const detailsStr = part.substring(lastDetailsParenIndex + 1).trim();

                    Debug.log(`  Name: "${name}", Details: "${detailsStr}"`);
                    if (detailsStr) {
                        const detailParts = detailsStr.split(', ');
                        Debug.log(`  Detail parts: ${JSON.stringify(detailParts)}`);
                        const detailMap: Record<string, string> = {};
                        detailParts.forEach(p => {
                            p = p.trim();
                            Debug.log(`    Processing detail part: "${p}"`);
                            if (p.match(/^[-+]\d+ Parry$/)) {
                                const value = p.replace(' Parry', '');
                                detailMap['parry'] = value;
                                Debug.log(`    Found parry modifier: "${value}"`);
                            } else {
                                let key: string, value: string;
                                if (p.includes(': ')) {
                                    [key, value] = p.split(': ');
                                    Debug.log(`    Split by ': ' -> key: "${key}", value: "${value}"`);
                                } else {
                                    const spaceIndex = p.indexOf(' ');
                                    if (spaceIndex !== -1) {
                                        key = p.substring(0, spaceIndex);
                                        value = p.substring(spaceIndex + 1);
                                        Debug.log(`    Split by space -> key: "${key}", value: "${value}"`);
                                    } else {
                                        Debug.log(`    Invalid part (no space): "${p}"`);
                                        return; // invalid part
                                    }
                                }
                                detailMap[key.toLowerCase().replace(':', '')] = value.trim();
                                Debug.log(`    Mapped: "${key.toLowerCase().replace(':', '')}" -> "${value.trim()}"`);
                            }
                        });
                        Debug.log(`  Final detail map: ${JSON.stringify(detailMap)}`);
                        let damage = detailMap['damage'];
                        if (damage) {
                            // Substitute attribute abbreviations with actual dice
                            const getAttributeDie = (name: string) => character.attributes.find(t => t.name.toLowerCase() === name.toLowerCase())?.die || 'd4';
                            const strDie = getAttributeDie('strength');
                            Debug.log(`Weapon damage parsing - Original: "${damage}", Str die: "${strDie}"`);

                            // NEW: Handle complex damage patterns like "(1-3)d6" first
                            // Extract the base damage pattern and handle variable dice counts
                            const complexDamageMatch = damage.match(/^\((\d+)-(\d+)\)(d\d+)$/i);
                            if (complexDamageMatch) {
                                const minDice = parseInt(complexDamageMatch[1]);
                                const maxDice = parseInt(complexDamageMatch[2]);
                                const dieType = complexDamageMatch[3];
                                // For now, use the average: (min+max)/2 rounded up
                                const avgDice = Math.ceil((minDice + maxDice) / 2);
                                damage = `${avgDice}${dieType}`;
                                Debug.log(`Complex damage pattern converted: "${complexDamageMatch[0]}" -> "${damage}"`);
                            }

                            // NEW: Handle standalone attribute references (like "Str" alone)
                            // First pass: replace standalone attributes
                            damage = damage.replace(/\bStr\b(?!\s*[+-]?\s*d\d+)/gi, strDie);

                            // Second pass: replace attributes followed by dice notation
                            damage = damage.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                            Debug.log(`Weapon damage parsing - After substitution: "${damage}"`);
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
                        Debug.log(`Weapon attack determination - Name: "${name}", isMelee: ${isMelee}, isThrown: ${isThrown}, isShooting: ${isShooting}`);
                        Debug.log(`Available skills: ${JSON.stringify(character.skills.map(s => `${s.name}:${s.die}`))}`);

                        // Special handling for Unarmed weapons - they should use fighting skill if available
                        const isUnarmed = name.toLowerCase().includes('unarmed');
                        if (isUnarmed && isMelee && !isThrown) {
                            attack = getSkillDie('fighting');
                            Debug.log(`Unarmed weapon using fighting skill: ${attack}`);
                        } else if (isMelee && !isThrown) {
                            attack = getSkillDie('fighting');
                            Debug.log(`Melee weapon using fighting skill: ${attack}`);
                        } else if (isThrown) {
                            if (isOnlyThrown) {
                                attack = getSkillDie('athletics');
                                Debug.log(`Thrown-only weapon using athletics skill: ${attack}`);
                            } else {
                                attack = getSkillDie('fighting');
                                thrownAttack = getSkillDie('athletics');
                                Debug.log(`Thrown weapon using fighting skill: ${attack}, thrown attack: ${thrownAttack}`);
                            }
                        } else if (isShooting) {
                            attack = getSkillDie('shooting');
                            Debug.log(`Ranged weapon using shooting skill: ${attack}`);
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
                        Debug.log(`  Created weapon: ${JSON.stringify(weapon)}`);
                        character.weapons!.push(weapon);
                        Debug.log(`Parsed weapon: "${name}" -> attack: "${weapon.attack}", damage: "${damage}", reach: "${weapon.reach}", parry: "${weapon.parry}", rof: "${weapon.rof}"`);
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
                    character.powers!.push({ name, book, page });
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
            // Pace - look for it in strong tags or anywhere in the text
            let paceMatch = text.match(/<strong>Pace<\/strong>: (\d+)/);
            if (!paceMatch) {
                paceMatch = text.match(/Pace:\s*(\d+)/i);
            }
            if (paceMatch) {
                character.pace = parseInt(paceMatch[1]);
                //Debug.log(`Parsed pace: ${character.pace}`);
            }

            // Parry - look for it in strong tags or anywhere in the text
            let parryMatch = text.match(/<strong>Parry<\/strong>: (\d+)/);
            if (!parryMatch) {
                parryMatch = text.match(/Parry:\s*(\d+)/i);
            }
            if (parryMatch) {
                character.parry = parseInt(parryMatch[1]);
                //Debug.log(`Parsed parry: ${character.parry}`);
            }

            // Toughness - look for it in strong tags or anywhere in the text, handle "7(2)" format
            let toughnessMatch = text.match(/<strong>Toughness<\/strong>: (\d+)\s*\((\d+)\)/);
            if (!toughnessMatch) {
                toughnessMatch = text.match(/Toughness:\s*(\d+)\s*\((\d+)\)/i);
            }
            if (toughnessMatch) {
                character.toughness = parseInt(toughnessMatch[1]);
                character.armorValue = parseInt(toughnessMatch[2]);
                //Debug.log(`Parsed toughness: ${character.toughness} (${character.armorValue})`);
            } else {
                // Fallback for toughness without armor
                toughnessMatch = text.match(/<strong>Toughness<\/strong>: (\d+)/);
                if (!toughnessMatch) {
                    toughnessMatch = text.match(/Toughness:\s*(\d+)/i);
                }
                if (toughnessMatch) {
                    character.toughness = parseInt(toughnessMatch[1]);
                    //Debug.log(`Parsed toughness: ${character.toughness} (no armor)`);
                }
            }

            // Also check for pace/parry/toughness in combined sections (e.g., quick stats)
            if (!character.pace || !character.parry || !character.toughness) {
                // Look in the quick stats section after the name
                const h1 = doc.querySelector('h1');
                if (h1) {
                    const nextDiv = h1.nextElementSibling;
                    if (nextDiv && nextDiv.tagName === 'DIV') {
                        const quickText = nextDiv.textContent || '';
                        if (!character.pace) {
                            const paceQuickMatch = quickText.match(/Pace:\s*(\d+)/i);
                            if (paceQuickMatch) character.pace = parseInt(paceQuickMatch[1]);
                        }
                        if (!character.parry) {
                            const parryQuickMatch = quickText.match(/Parry:\s*(\d+)/i);
                            if (parryQuickMatch) character.parry = parseInt(parryQuickMatch[1]);
                        }
                        if (!character.toughness) {
                            // Handle toughness with optional armor in parentheses: "Toughness: 7(2)"
                            const toughnessQuickMatch = quickText.match(/Toughness:\s*(\d+)\s*\((\d+)\)/i);
                            if (toughnessQuickMatch) {
                                character.toughness = parseInt(toughnessQuickMatch[1]);
                                character.armorValue = parseInt(toughnessQuickMatch[2]);
                            } else {
                                // Fallback for toughness without armor
                                const toughnessNoArmorMatch = quickText.match(/Toughness:\s*(\d+)/i);
                                if (toughnessNoArmorMatch) {
                                    character.toughness = parseInt(toughnessNoArmorMatch[1]);
                                }
                            }
                        }
                    }
                }
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
                const edgesStr = edgesMatch[1].trim();
                // Skip if edges are just a dash, em dash, or empty
                if (edgesStr && edgesStr !== '—' && edgesStr !== '-' && edgesStr !== '–' && edgesStr.trim() !== '') {
                    character.edges = splitIgnoringParentheses(edgesStr, ', ');
                    //Debug.log(`Parsed ${character.edges!.length} edges`);
                }
            }
            // Hindrances
            const hindrancesMatch = text.match(/<strong>Hindrances<\/strong>: ([^<]*)/);
            if (hindrancesMatch) {
                const hindStr = hindrancesMatch[1].trim();
                if (hindStr && hindStr !== '—' && hindStr !== '-' && hindStr !== '–' && hindStr.trim() !== '') {
                    character.hindrances = splitIgnoringParentheses(hindrancesMatch[1], ', ');
                    //Debug.log(`Parsed ${character.hindrances!.length} hindrances`);
                }
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

            // Parse attacks from special abilities in HTML parser (e.g., "Bite: Str+d8")
            if (character.specialAbilities && character.specialAbilities.length > 0) {
                const attackPattern = /^(.+?):\s*(.+)$/i; // Pattern like "Bite: Str+d8"
                const weaponsFromSpecialAbilities: Weapon[] = [];

                // Helper function to substitute attribute abbreviations with actual dice
                const getAttributeDie = (name: string) => character.attributes.find(t => t.name.toLowerCase() === name.toLowerCase())?.die || 'd4';

                // List of known weapon attack names to be more precise
                const weaponAttackNames = [
                    'bite', 'claw', 'slam', 'strike', 'punch', 'kick', 'gore', 'trample', 'antler',
                    'crush', 'rend', 'maul', 'rake', 'peck', 'sting', 'lash', 'swipe', 'tusks', 'trunk',
                    'touch', 'tongue', 'tendrils','swarm', 'sting or bite', 'bite or sting',
                    'slam', 'chomp', 'snap', 'slash', 'stab', 'pierce', 'bludgeon', 'tail', 'horn', 'vines',
                    'tentacle', 'fang', 'talon', 'hoof', 'pincer', 'mandible', 'beak' , 'wings'
                ];

                // Process special abilities in reverse order to avoid index issues when removing
                for (let i = character.specialAbilities.length - 1; i >= 0; i--) {
                    const ability = character.specialAbilities[i];
                    const match = ability.match(attackPattern);
                    if (match) {
                        const weaponName = match[1].trim().toLowerCase();
                        let damageStr = match[2].trim();

                        // More precise detection: must be a known weapon attack name
                        const isWeaponAttackName = weaponAttackNames.some(name => weaponName.includes(name));
                        
                        // Check for clean damage patterns in the immediate text after colon
                        let immediateDamageMatch = damageStr.match(/(\d*d\d+[+-]?\d*|(?:Str)\s*[+-]?\s*\d*|(?:Str))/i);
                        
                        // If no immediate clean damage, search the entire ability text for damage patterns
                        let finalDamageStr = damageStr;
                        if (!immediateDamageMatch) {
                            const fullDamageMatch = ability.match(/(?:damage|causing)\s+(\d*d\d+[+-]?\d*)/i);
                            if (fullDamageMatch) {
                                finalDamageStr = fullDamageMatch[1];
                                Debug.log(`Found damage later in text: "${finalDamageStr}"`);
                            }
                        } else {
                            finalDamageStr = immediateDamageMatch[1];
                            Debug.log(`Found immediate damage: "${finalDamageStr}"`);
                        }

                        const hasDamage = finalDamageStr.match(/d\d+|(?:Str)\s*[+-]?\s*\d*|(?:Str)/i);

                        if (isWeaponAttackName && hasDamage) {
                            // Debug logging for attribute substitution
                            const strDie = getAttributeDie('strength');
                            Debug.log(`Special ability weapon parsing: ${match[1].trim()} - Original damage: "${finalDamageStr}", Str die: "${strDie}"`);

                            // Debug: Log all attributes to see what we're working with
                            Debug.log('Available attributes:', character.attributes);

                            // Extract AP value if present (e.g., "Str+d6 AP 2" or "Str+d6, AP 2" -> ap: "2")
                            let apValue: string | undefined;
                            const apMatch = finalDamageStr.match(/[, ]*AP\s*(\d+)/i) || ability.match(/[, ]*AP\s*(\d+)/i);
                            if (apMatch) {
                                apValue = apMatch[1];
                                finalDamageStr = finalDamageStr.replace(/,?\s*AP\s*\d+/i, '').trim();
                                Debug.log(`Extracted AP: ${apValue}, remaining damage: "${finalDamageStr}"`);
                            }

                            Debug.log(`Attribute dice values - Str: "${strDie}"`);

                            finalDamageStr = finalDamageStr.replace(/\bStr\b(?!\s*[+-]?\s*d\d+)/gi, strDie);

                            // Handle attributes followed by dice notation
                            finalDamageStr = finalDamageStr.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                            Debug.log(`After substitution: "${finalDamageStr}"`);

                            // Create a weapon from this special ability
                            const weapon: Weapon = {
                                name: match[1].trim(), // Use original case for display
                                damage: finalDamageStr,
                                range: 'melee', // Default to melee for natural attacks
                                reach: '1',     // Default reach for natural attacks
                                ap: apValue     // AP extracted from damage string
                            };
                            weaponsFromSpecialAbilities.push(weapon);

                            // Remove this from special abilities since it's now a weapon
                            character.specialAbilities.splice(i, 1);
                        }
                    }
                }

                // Add any weapons found in special abilities to the main weapons list
                if (weaponsFromSpecialAbilities.length > 0) {
                    if (!character.weapons) {
                        character.weapons = [];
                    }
                    character.weapons.push(...weaponsFromSpecialAbilities);
                }
            }

            // Add default unskilled roll
            character.skills.push({ name: 'unskilled', die: 'd4-2' });
            //Debug.log('Added default unskilled roll: d4-2');

            //Debug.log(`Total rolls parsed: ${Object.keys(rolls).length}`);
            Debug.log('Character parsed successfully', character);
        }
        return character;
    }


    static cleanText(text: string, which: number): string {
        if (!text) return text;
        let clean: string = '';
        // Regex patterns to replace Unicode characters with *
        const regexhyphen = /(?<=\p{L})-[\r\n]+(?=\p{L})/gu;
        // Option 1: Replace all non-ASCII characters (most common need)
        // This preserves ASCII letters, numbers, punctuation, and spaces
        const regex1 = /[^\x00-\x7F]/g;
        const xregex1 = /[\x00-\x7F]/g;

        // // Option 2: Replace all Unicode letters, numbers, and symbols (preserve basic punctuation)
        // const regex2 = /[^\p{L}\p{N}\p{M}\p{S}\s]/gu;
        // const xregex2 = /[\p{L}\p{N}\p{M}\p{S}\s]/gu;
        // // Option 3: Replace all Unicode characters except spaces and basic ASCII punctuation
        // const regex3 = /[^\x20-\x7E\s]/g;
        // const xregex3 = /[\x20-\x7E\s]/g;
        // // Option 4: Replace everything that isn't standard ASCII (most aggressive)
        // const regex4 = /[\u0080-\uFFFF]/g;
        // const xregex4 = /[^\u0080-\uFFFF]/g;

        // // Option 5: Match any character with code point above 255 (broader Unicode coverage)
        // const regex5 = /[^\x100-\xFFFF\s]/gu;
        // const xregex5 = /[\x100-\xFFFF\s]/gu;
        // Test each regex option
        const regexes = [
            { name: "Non-ASCII only", pattern: regex1, replace: "•", description: "Replaces everything outside ASCII range (0-127)" },
            { name: "Non-ASCII only-REMOVED", pattern: xregex1, replace: "", description: "Replaces everything outside ASCII range (0-127)" },

            // { name: "Unicode letters/numbers", pattern: regex2, replace: "•", description: "Replaces letters, numbers, marks, and symbols" },
            // { name: "Unicode letters/numbers-REMOVED", pattern: xregex2, replace: "", description: "Replaces letters, numbers, marks, and symbols" },

            // { name: "Non-ASCII except spaces", pattern: regex3, replace: "•", description: "Replaces non-ASCII except spaces and basic punctuation" },
            // { name: "Non-ASCII except spaces-REMOVED", pattern: xregex3, replace: "", description: "Replaces non-ASCII except spaces and basic punctuation" },

            // { name: "Unicode block range", pattern: regex4, replace: "•", description: "Replaces characters in Unicode ranges 128-65535" },
            // { name: "Unicode block range-REMOVED", pattern: xregex4, replace: "", description: "Replaces characters in Unicode ranges 128-65535" },

            // { name: "Extended Unicode", pattern: regex5, replace: "•", description: "Replaces characters with code points 256-65535" },
            // { name: "Extended Unicode-REMOVED", pattern: xregex5, replace: "", description: "Replaces characters with code points 256-65535" },

        ];
        console.log("Testing Unicode character replacement patterns:\n");
        //remove hyphenation
        let testString = text.replace(regexhyphen, '');
        const from = "—’″−";
        const to = "-'\"-";
        const map = new Map<string, string>(
            [...from].map((char, i) => [char, to[i] ?? char])
        );

        testString = testString.replace(/./g, ch => map.get(ch) ?? ch);


        console.log(`Test: "${testString}"`);
        console.log(`Length: ${testString.length} chars`);

        regexes.forEach(({ name, pattern, replace, description }, patcnt) => {
            try {
                const result = testString.replace(pattern, replace);
                console.log(description)
                console.log(`  ${name}: "${result}"`);
                if (patcnt === which - 1) clean = result
            } catch (e) {
                console.log(`  ${name}: ERROR - ${e}`);
            }

        });
        console.log('');

        return clean;
    }

    static
        parseCharacterFromText(text: string): Character {
        const character: Character = { name: 'name', description: '', attributes: [], skills: [] };
        const clean = this.cleanText(text, 1);
        const lines = clean.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Parse name from first line assuming it's the h1 equivalent
        let name = lines[0];

        character.isWildCard = /^\S\s/.test(name);
        if (character.isWildCard) name=name && name.length > 2 ? name.slice(2) : name ?? '';
        character.name = Util.toTitleCase(name);
        
        // Parse quick info after name (Rank, Gender, Race, Profession)
        let lineIndex = 1;
        let quickText = '';
        while (lineIndex < lines.length && !lines[lineIndex].match(/^(Attributes|Description|Special Abilities):?/i)) {
            quickText += (quickText ? ', ' : '') + lines[lineIndex];
            lineIndex++;
        }
        //const startLineIndex = lineIndex; // Save position after quick info
        const parts = quickText.split(', ').map(p => p.trim());
        parts.forEach(part => {
            const [key, value] = part.split(': ').map(s => s.trim());
            if (key === 'Rank') character.rank = value;
            else if (key === 'Gender') character.gender = value;
            else if (key === 'Race' || key === 'Type') character.race = value;
            else if (key === 'Profession') character.profession = value;
        });

        // Additional rank parsing for formats like "Rank Veteran" or "Rank:Veteran" (no space after colon)
        if (!character.rank) {
            const rankMatch = quickText.match(/Rank[:]?\s*(\w+)/i);
            if (rankMatch) {
                character.rank = rankMatch[1];
            }
        }

        // Additional rank parsing for standalone rank lines like "Veteran" or "Novice"
        if (!character.rank) {
            const standaloneRankMatch = quickText.match(/\b(Veteran|Novice|Seasoned|Heroic|Legendary)\b/i);
            if (standaloneRankMatch) {
                character.rank = standaloneRankMatch[1];
            }
        }

        // Additional rank parsing for formats like "Rank: Veteran (something)" with parentheses
        if (!character.rank) {
            const rankWithParensMatch = quickText.match(/Rank[:]?\s*(\w+)\s*\([^)]*\)/i);
            if (rankWithParensMatch) {
                character.rank = rankWithParensMatch[1];
                Debug.log(`Parsed rank with parentheses: ${character.rank}`);
            }
        }

        if (!character.race) character.race = 'Human';

        // Try Pattern 1 first: text immediately after name in the quick info section
        let descFound = false;
        let tempLineIndex = 1; 
        while (tempLineIndex < lines.length && !descFound) {
            const line = lines[tempLineIndex];
            // Look for descriptive text that comes right after the name
            // This should be before any section headers like "Attributes:", "Skills:", etc.
            if (!line.match(/^(Attributes|Skills|Weapons|Arcane Background|Powers|Gear|Special Abilities|Advances|Background|Experience|Bennies):?/i)) {
                // Skip lines that look like they contain structured data (key: value pairs)
                if (!line.includes(':') && line.length > 10 && !line.match(/\b(Veteran|Novice|Seasoned|Heroic|Legendary)\b/i)) {
                    if (!character.description) {
                        character.description = line.trim();
                    } else {
                        character.description += ' ' + line.trim();
                    }
                } else {
                    descFound = true; // Found a structured line, stop looking for pattern 1
                }
            } else {
                descFound = true; // Found a section header, stop looking for pattern 1
            }
            tempLineIndex++;
        }

        // Try Pattern 2: Look for "Description:" prefix
        if (!character.description) {
            let tempLineIndex2 = 0;
            while (tempLineIndex2 < lines.length) {
                const line = lines[tempLineIndex2];
                if (line.match(/^Description:\s*(.*)$/i)) {
                    let descriptionText = line.replace(/^Description:\s*/i, '').trim();
                    tempLineIndex2++;
                    // Collect all subsequent lines until next section header
                    while (tempLineIndex2 < lines.length) {
                        const nextLine = lines[tempLineIndex2];
                        // Stop if we hit a new section header
                        if (nextLine.match(/^(Attributes|Skills|Weapons|Arcane Background|Powers|Gear|Special Abilities|Advances|Background|Experience|Bennies):?/i)) {
                            break;
                        }
                        // Skip empty lines
                        if (nextLine.trim().length > 0) {
                            descriptionText += ' ' + nextLine.trim();
                        }
                        tempLineIndex2++;
                    }
                    if (descriptionText.trim().length > 0) {
                        character.description = descriptionText.trim();
                    }
                    break;
                }
                tempLineIndex2++;
            }
        }

        // Try Pattern 3: Look for "Description" header (without colon)
        if (!character.description) {
            let tempLineIndex3 = 0;
            while (tempLineIndex3 < lines.length) {
                const line = lines[tempLineIndex3];
                if (line.match(/^Description$/i)) {
                    tempLineIndex3++;
                    // Collect all subsequent lines until next section header
                    let descriptionText = '';
                    while (tempLineIndex3 < lines.length) {
                        const nextLine = lines[tempLineIndex3];
                        // Stop if we hit a new section header
                        if (nextLine.match(/^(Attributes|Skills|Weapons|Arcane Background|Powers|Gear|Special Abilities|Advances|Background|Experience|Bennies):?/i)) {
                            break;
                        }
                        // Skip empty lines
                        if (nextLine.trim().length > 0) {
                            if (descriptionText.length > 0) {
                                descriptionText += ' ';
                            }
                            descriptionText += nextLine.trim();
                        }
                        tempLineIndex3++;
                    }
                    if (descriptionText.trim().length > 0) {
                        character.description = descriptionText.trim();
                    }
                    break;
                }
                tempLineIndex3++;
            }
        }

        // Parse Background - improved to handle "Background:" and "Background" formats
        let bgFound = false;
        lineIndex = 0;
        while (lineIndex < lines.length && !bgFound) {
            if (lines[lineIndex].match(/Background[:]?/i)) {
                lineIndex++;
                // Collect all subsequent lines until next section header
                let backgroundText = '';
                while (lineIndex < lines.length) {
                    const line = lines[lineIndex];
                    // Stop if we hit a new section header
                    if (line.match(/^(Attributes|Skills|Weapons|Arcane Background|Powers|Gear|Special Abilities|Advances|Description|Experience|Bennies):?/i)) {
                        break;
                    }
                    // Skip empty lines
                    if (line.trim().length > 0) {
                        if (backgroundText.length > 0) {
                            backgroundText += ' ';
                        }
                        backgroundText += line.trim();
                    }
                    lineIndex++;
                }
                if (backgroundText.trim().length > 0) {
                    character.background = backgroundText.trim();
                }
                bgFound = true;
            } else {
                lineIndex++;
            }
        }

        const getSkillDie = (name: string) => character.skills.find(t => t.name === name)?.die || 'd4-2';

        // Define section headers for extraction functions
        const sectionHeaders = [
            "Attributes", "Skills", "Edges", "Hindrances", "Gear",
            "Special Abilities", "Advances", "Background",
            "Experience", "Bennies", "Pace", "Parry", "Toughness",
            "Arcane Background", "Powers", "Weapons", "Armor",
            "Languages", "Wealth", "Power Points"
        ];

        // Attributes - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];

            // Look for standard format: "Attributes: Agility d6, Smarts d6, Spirit d6, Strength d6, Vigor d6"
            if (line.match(/^Attributes:\s*(.*)$/i)) {
                // Use new extraction function to get all attribute content
                const attrsResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                const attrsStr = attrsResult.content.replace(/^Attributes:\s*/i, '').trim();
                Debug.log(`Parsing attributes: "${attrsStr}"`);
                attrsStr.split(', ').forEach(attr => {
                    const [n, d] = attr.split(' ');
                    if (n && d) {
                        character.attributes.push({ name: n.toLowerCase(), die: d });
                        Debug.log(`Parsed attribute: ${n.toLowerCase()} -> ${d}`);
                    }
                });
                lineIndex = attrsResult.endIndex;
            }
            // Look for alternative format where attributes are listed separately
            else if (line.match(/^(Agility|Smarts|Spirit|Strength|Vigor):\s*(.*)$/i)) {
                const attrMatch = line.match(/^(Agility|Smarts|Spirit|Strength|Vigor):\s*(.*)$/i);
                if (attrMatch) {
                    const attrName = attrMatch[1].toLowerCase();
                    const attrDie = attrMatch[2].trim();
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie });
                        Debug.log(`Parsed attribute (alternative format): ${attrName} -> ${attrDie}`);
                    }
                }
                lineIndex++;
            }
            // Look for compact format: "Agility d6 Smarts d6 Spirit d6 Strength d6 Vigor d6"
            // Also handle formats like "Strength: d12+2" which might appear in compact sections
            else if ((line.match(/(Agility|Smarts|Spirit|Strength|Vigor)\s+d\d+/i) ||
                line.match(/(Agility|Smarts|Spirit|Strength|Vigor):\s*(d\d+\+?\d*)/i)) &&
                character.attributes.length < 5) {
                // Handle both "Strength d12+2" and "Strength: d12+2" formats
                const attrMatches1 = line.matchAll(/(Agility|Smarts|Spirit|Strength|Vigor)\s+(d\d+\+?\d*)/gi);
                const attrMatches2 = line.matchAll(/(Agility|Smarts|Spirit|Strength|Vigor):\s*(d\d+\+?\d*)/gi);

                for (const match of attrMatches1) {
                    const attrName = match[1].toLowerCase();
                    const attrDie = match[2];
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie });
                        Debug.log(`Parsed attribute (compact format 1): ${attrName} -> ${attrDie}`);
                    }
                }

                for (const match of attrMatches2) {
                    const attrName = match[1].toLowerCase();
                    const attrDie = match[2];
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie });
                        Debug.log(`Parsed attribute (compact format 2): ${attrName} -> ${attrDie}`);
                    }
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }

        // Ensure we have all 5 standard attributes if none were found
        if (character.attributes.length === 0) {
            character.attributes = [
                { name: "agility", die: "d6" },
                { name: "smarts", die: "d6" },
                { name: "spirit", die: "d6" },
                { name: "strength", die: "d6" },
                { name: "vigor", die: "d6" }
            ];
            Debug.log('No attributes found, using defaults');
        } else {
            Debug.log(`Final attributes: ${character.attributes.map(a => `${a.name}: ${a.die}`).join(', ')}`);
        }

        // Reset for skills (using new extraction function)
        lineIndex = 0;
        let skillsStr = '';
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];

            // Look for Skills: line (start of skills section) - handle both "Skills:" and "Skills" followed by colon on next line
            if (line.match(/^Skills[:]?\s*(.*)$/i)) {
                // Use new extraction function to get all skills content
                const skillsResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                skillsStr = skillsResult.content.replace(/^Skills[:]?\s*/i, '').trim();
                // Handle case where skills start with ": " (like ": Academics d4, ...")
                if (skillsStr.startsWith(': ')) {
                    skillsStr = skillsStr.substring(2).trim();
                }
                Debug.log(`Found skills content: "${skillsStr}"`);
                lineIndex = skillsResult.endIndex;
                break;
            }
            // Handle the case where "Skills" is on one line and skills start with ":" on the next line
            else if (line.match(/^Skills$/i)) {
                // Use new extraction function to get all skills content
                const skillsResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                skillsStr = skillsResult.content.replace(/^Skills\s*/i, '').trim();
                // Handle case where skills start with ": " (skills continuation)
                if (skillsStr.startsWith(': ')) {
                    skillsStr = skillsStr.substring(2).trim();
                }
                Debug.log(`Found skills content (multi-line format): "${skillsStr}"`);
                lineIndex = skillsResult.endIndex;
                break;
            }
            else {
                lineIndex++;
            }
        }

        // Parse collected skills string
        if (skillsStr) {
            Debug.log(`Parsing skills string: "${skillsStr}"`);
            // Handle both comma-separated and space-separated skill lists
            const skillSeparators = [', ', '; ', '\t'];
            let skillsToParse = [skillsStr];

            // Try to split by common separators
            for (const separator of skillSeparators) {
                if (skillsStr.includes(separator)) {
                    skillsToParse = skillsStr.split(separator);
                    Debug.log(`Split skills by "${separator}": ${skillsToParse.length} items`);
                    break;
                }
            }

            // Improved skill parsing that handles multi-word skill names
            for (const skill of skillsToParse) {
                const trimmedSkill = skill.trim();
                if (!trimmedSkill) continue;

                Debug.log(`Processing skill: "${trimmedSkill}"`);

                // Handle format "SkillName dX" or "Skill Name dX"
                // Look for die pattern at the end (d4, d6, d8, d10, d12, d20, etc.)
                const diePattern = /\s(d\d+\+?\d*)$/i;
                const dieMatch = trimmedSkill.match(diePattern);

                if (dieMatch) {
                    const die = dieMatch[1];
                    // Remove the die from the end to get the skill name
                    const skillName = trimmedSkill.substring(0, dieMatch.index).trim();

                    if (skillName && die) {
                        Debug.log(`Parsed skill: "${skillName}" -> "${die}"`);
                        character.skills.push({ name: toCamelCase(skillName), die: die });
                    } else {
                        Debug.log(`Skipping invalid skill format: "${trimmedSkill}"`);
                    }
                } else {
                    // Handle format "SkillName: dX" (with colon)
                    const colonMatch = trimmedSkill.match(/^(.+?)\s*:\s*(d\d+\+?\d*)$/i);
                    if (colonMatch) {
                        const skillName = colonMatch[1].trim();
                        const die = colonMatch[2].trim();
                        Debug.log(`Parsed skill (colon format): "${skillName}" -> "${die}"`);
                        character.skills.push({ name: toCamelCase(skillName), die: die });
                    } else {
                        Debug.log(`Could not parse skill: "${trimmedSkill}" - no die found`);
                    }
                }
            }
        } else {
            Debug.log('No skills found in text');
        }

        // Weapons - find Weapons: line and collect until next section
        let weaponsStart = false;
        let weaponsStr = '';
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Weapons:/i)) {
                weaponsStart = true;
                weaponsStr = line.replace(/^Weapons:\s*/i, '').trim();
                lineIndex++;
                continue;
            }
            if (weaponsStart) {
                if (line.match(/^(Arcane Background|Powers|Gear|Special Abilities):?/i)) {
                    break;
                } else {
                    weaponsStr += ' ' + line;
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }
        if (weaponsStr) {
            // NEW: Improved weapon parsing that handles nested parentheses
            // Split weapons by comma that's followed by a space and then a word starting with capital letter
            // This handles the format: "Weapon1 (details), Weapon2 (details)"
            const weaponMatches = weaponsStr.matchAll(/([^,]+?(?:\([^)]+\))?(?:\([^)]+\))?)(?=,|$)/g);

            character.weapons = [];
            for (const match of weaponMatches) {
                const weaponText = match[1].trim();
                if (!weaponText) continue;

                // Extract weapon name (may include parentheses like ".45")
                let weaponName = weaponText;
                let detailsStr = '';

                // NEW: Handle nested parentheses in weapon names (same fix as HTML parser)
                // Find the last occurrence of "(" that starts the weapon details section
                // This should be the one that contains "Range", "Damage", etc.
                const lastDetailsParenIndex = weaponText.lastIndexOf('(Range');
                if (lastDetailsParenIndex === -1) {
                    Debug.log(`  No weapon details found for: "${weaponText}"`);
                    continue; // Skip weapons without proper details
                }

                // Extract weapon name (everything before the last details parenthesis)
                weaponName = weaponText.substring(0, lastDetailsParenIndex).trim();
                // Extract details (everything from the last details parenthesis onwards)
                detailsStr = weaponText.substring(lastDetailsParenIndex + 1).trim();

                if (weaponName && detailsStr) {
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
                                    return;
                                }
                            }
                            detailMap[key.toLowerCase().replace(':', '')] = value.trim();
                        }
                    });
                    let damage = detailMap['damage'];
                    if (damage) {
                        const getAttributeDie = (name: string) => character.attributes.find(t => t.name.toLowerCase() === name.toLowerCase())?.die || 'd4';
                        const strDie = getAttributeDie('strength');
                        Debug.log(`Weapon damage parsing (text) - Original: "${damage}", Str die: "${strDie}"`);

                        // NEW: Handle complex damage patterns like "(1-3)d6" first
                        // Extract the base damage pattern and handle variable dice counts
                        const complexDamageMatch = damage.match(/^\((\d+)-(\d+)\)(d\d+)$/i);
                        if (complexDamageMatch) {
                            const minDice = parseInt(complexDamageMatch[1]);
                            const maxDice = parseInt(complexDamageMatch[2]);
                            const dieType = complexDamageMatch[3];
                            // For now, use the average: (min+max)/2 rounded up
                            const avgDice = Math.ceil((minDice + maxDice) / 2);
                            damage = `${avgDice}${dieType}`;
                            Debug.log(`Complex damage pattern converted (text): "${complexDamageMatch[0]}" -> "${damage}"`);
                        }

                        // NEW: Handle standalone attribute references (like "Str" alone)
                        // First pass: replace standalone attributes
                        damage = damage.replace(/\bStr\b(?!\s*[+-]?\s*d\d+)/gi, strDie);

                        // Second pass: replace attributes followed by dice notation
                        damage = damage.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                        Debug.log(`Weapon damage parsing (text) - After substitution: "${damage}"`);
                    }
                    const thrownWeapons = ['axe, hand', 'axe, throwing', 'dagger', 'knife', 'net', 'sling', 'spear', 'javelin', 'trident', 'starknife', 'shuriken', 'bolas', 'hammer', 'warhammer'];
                    const onlyThrownWeapons = ['net', 'sling', 'shuriken', 'bolas'];
                    const weaponNameLower = weaponName.toLowerCase();
                    const isThrown = thrownWeapons.some(tw => weaponNameLower.includes(tw));
                    const isOnlyThrown = onlyThrownWeapons.some(tw => weaponNameLower.includes(tw));
                    const isMelee = !detailMap['range'] || detailMap['range'].toLowerCase() === 'melee';
                    const isShooting = !isMelee && !isThrown;
                    let attack: string | undefined;
                    let thrownAttack: string | undefined;
                    Debug.log(`Weapon attack determination (text) - Name: "${weaponName}", isMelee: ${isMelee}, isThrown: ${isThrown}, isShooting: ${isShooting}`);
                    Debug.log(`Available skills (text): ${JSON.stringify(character.skills.map(s => `${s.name}:${s.die}`))}`);

                    // Special handling for Unarmed weapons - they should use fighting skill if available
                    const isUnarmed = weaponName.toLowerCase().includes('unarmed');
                    if (isUnarmed && isMelee && !isThrown) {
                        attack = getSkillDie('fighting');
                        Debug.log(`Unarmed weapon using fighting skill (text): ${attack}`);
                    } else if (isMelee && !isThrown) {
                        attack = getSkillDie('fighting');
                        Debug.log(`Melee weapon using fighting skill (text): ${attack}`);
                    } else if (isThrown) {
                        if (isOnlyThrown) {
                            attack = getSkillDie('athletics');
                            Debug.log(`Thrown-only weapon using athletics skill (text): ${attack}`);
                        } else {
                            attack = getSkillDie('fighting');
                            thrownAttack = getSkillDie('athletics');
                            Debug.log(`Thrown weapon using fighting skill (text): ${attack}, thrown attack: ${thrownAttack}`);
                        }
                    } else if (isShooting) {
                        attack = getSkillDie('shooting');
                        Debug.log(`Ranged weapon using shooting skill (text): ${attack}`);
                    }
                    const weapon = {
                        name: weaponName.trim(),
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
                }
            }
        }

        // Arcane Background
        lineIndex = 0;
        let arcaneStr = '';
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Arcane Background:\s*(.*)$/i)) {
                arcaneStr = line.replace(/^Arcane Background:\s*/i, '').trim();
                const bgName = arcaneStr.split(' (')[0].trim();
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
                character.arcaneBackground = arcaneStr;
                character.arcaneSkill = skillName;
                break;
            }
            lineIndex++;
        }

        // Powers - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Powers:\s*(.*)$/i)) {
                // Use new extraction function to get all powers content
                const powersResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                const powersStr = powersResult.content.replace(/^Powers:\s*/i, '').trim();
                character.powers = [];
                powersStr.split(', ').forEach(power => {
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
                    character.powers!.push({ name, book, page });
                });
                lineIndex = powersResult.endIndex;
                break;
            }
            lineIndex++;
        }

        // // Modifiers (example for persuasion)
        // if (text.includes('Subtract 2 from all Persuasion rolls')) {
        //     const persuasionTrait = character.skills.find(t => t.name === 'persuasion');
        //     if (persuasionTrait && !persuasionTrait.die.includes('-')) {
        //         persuasionTrait.die = (persuasionTrait.die || 'd4') + '-2';
        //     }
        // }

        // Pace, Parry, Toughness - look for them anywhere in the text, not just at line start
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            // Look for pace, parry, toughness anywhere in the line, not just at start
            const paceMatch = line.match(/(^|\s)Pace:\s*(\d+)/i);
            if (paceMatch && !character.pace) {
                character.pace = parseInt(paceMatch[2]);
            }
            const parryMatch = line.match(/(^|\s)Parry:\s*(\d+)/i);
            if (parryMatch && !character.parry) {
                character.parry = parseInt(parryMatch[2]);
            }
            // Handle toughness in formats like "7" or "7(2)" where 7 is base and 2 is armor
            const toughnessMatch = line.match(/(^|\s)Toughness:\s*(\d+)\s*\((\d+)\)/i);
            if (toughnessMatch && !character.toughness) {
                character.toughness = parseInt(toughnessMatch[2]);
                character.armorValue = parseInt(toughnessMatch[3]);
                Debug.log(`Parsed toughness (text): ${character.toughness} (${character.armorValue})`);
            } else if (!character.toughness) {
                // Fallback for toughness without armor
                const toughnessNoArmorMatch = line.match(/(^|\s)Toughness:\s*(\d+)/i);
                if (toughnessNoArmorMatch) {
                    character.toughness = parseInt(toughnessNoArmorMatch[2]);
                    Debug.log(`Parsed toughness (text, no armor): ${character.toughness}`);
                }
            }
            lineIndex++;
        }

        // Also check for pace/parry/toughness in combined lines (e.g., "Charisma: +2, Pace: 6, Parry: 4, Toughness: 5")
        lineIndex = 0;
        while (lineIndex < lines.length && (!character.pace || !character.parry || !character.toughness)) {
            const line = lines[lineIndex];
            // Look for patterns like "Pace: 6" or "Pace 6" in lines that might have other data
            if (!character.pace) {
                const paceAltMatch = line.match(/(^|\s)Pace\s*[:]?\s*(\d+)/i);
                if (paceAltMatch) {
                    character.pace = parseInt(paceAltMatch[2]);
                }
            }
            if (!character.parry) {
                const parryAltMatch = line.match(/(^|\s)Parry\s*[:]?\s*(\d+)/i);
                if (parryAltMatch) {
                    character.parry = parseInt(parryAltMatch[2]);
                }
            }
            if (!character.toughness) {
                // Handle toughness with optional armor in parentheses: "Toughness: 7(2)"
                const toughnessAltMatch = line.match(/(^|\s)Toughness\s*[:]?\s*(\d+)\s*\((\d+)\)/i);
                if (toughnessAltMatch) {
                    character.toughness = parseInt(toughnessAltMatch[2]);
                    character.armorValue = parseInt(toughnessAltMatch[3]);
                } else {
                    // Fallback for toughness without armor
                    const toughnessNoArmorMatch = line.match(/(^|\s)Toughness\s*[:]?\s*(\d+)/i);
                    if (toughnessNoArmorMatch) {
                        character.toughness = parseInt(toughnessNoArmorMatch[2]);
                    }
                }
            }
            lineIndex++;
        }

        // Armor
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Armor:\s*(.*)$/i)) {
                const armorStr = line.replace(/^Armor:\s*/i, '').trim();
                character.armor = [];
                armorStr.split(', ').forEach(a => {
                    const match = a.trim().match(/^(.+?)\s*\(Armor\s*(\d+)\)$/);
                    if (match) {
                        character.armor!.push({ name: match[1].trim(), value: parseInt(match[2]) });
                    }
                });
                break;
            }
            lineIndex++;
        }

        // Edges - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Edges:\s*(.*)$/i)) {
                // Use new extraction function to get all edges content
                const edgesResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                const edgesStr = edgesResult.content.replace(/^Edges:\s*/i, '').trim();
                // Skip if edges are just a dash, em dash, or empty
                if (edgesStr && edgesStr !== '—' && edgesStr !== '-' && edgesStr !== '–' && edgesStr.trim() !== '') {
                    character.edges = splitIgnoringParentheses(edgesStr, ', ');
                }
                lineIndex = edgesResult.endIndex;
                break;
            }
            lineIndex++;
        }

        // Hindrances - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Hindrances:\s*(.*)$/i)) {
                // Use new extraction function to get all hindrances content
                const hindrancesResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                const hindrancesStr = hindrancesResult.content.replace(/^Hindrances:\s*/i, '').trim();
                if (hindrancesStr && hindrancesStr !== '—' && hindrancesStr !== '-' && hindrancesStr !== '–' && hindrancesStr.trim() !== '') {
                    character.hindrances = splitIgnoringParentheses(hindrancesStr, ', ');
                }
                lineIndex = hindrancesResult.endIndex;
                break;
            }
            lineIndex++;
        }

        // Gear - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Gear:/i)) {
                // Use new extraction function to get all gear content
                const gearResult = extractSectionContent(lines, lineIndex, sectionHeaders);
                const gearContent = gearResult.content.replace(/^Gear:\s*/i, '').trim();
                lineIndex = gearResult.endIndex;

                // NEW: Enhanced gear parsing to extract weapons and other proper sections
                if (gearContent) {
                    // Split gear by commas first to process individual items
                    const potentialGearItems = splitIgnoringParentheses(gearContent, ', ');
                    character.gear = [];

                    potentialGearItems.forEach(item => {
                        const trimmedItem = item.trim();
                        if (!trimmedItem) return;

                        // Check if this looks like a weapon pattern
                        const weaponFromGear = parseWeaponFromGearItem(trimmedItem, character);

                        if (weaponFromGear) {
                            // This is a weapon, add to weapons array
                            if (!character.weapons) character.weapons = [];
                            character.weapons.push(weaponFromGear);
                            Debug.log(`Extracted weapon from gear: ${weaponFromGear.name} -> damage: ${weaponFromGear.damage}, range: ${weaponFromGear.range}, ap: ${weaponFromGear.ap}`);
                        } else {
                            // Check if this looks like an edge list entry (common edge names)
                            const commonEdgeNames = ['Level Headed', 'Luck', 'Great Luck', 'Frenzy', 'Dodge', 'Combo', 'Improved', 'Alertness', 'Ambidextrous', 'Arcane', 'Artificer', 'Assassin', 'Berserker', 'Better', 'Quick', 'Marksman', 'Giant', 'McGyver', 'Muscle', 'Nerves', 'Rocket', 'Steely', 'Trademark'];
                            const isEdgeItem = commonEdgeNames.some(edge =>
                                trimmedItem.toLowerCase().includes(edge.toLowerCase())
                            );

                            // Check if this looks like a section header that shouldn't be in gear
                            const isSectionHeader = trimmedItem.match(/^(Edges|Hindrances|Advances|Background|Experience|Bennies):/i) ||
                                trimmedItem.match(/^(Pace|Parry|Toughness):/i) ||
                                trimmedItem.match(/^(Strength|Agility|Smarts|Spirit|Vigor):/i);

                            if (isEdgeItem || isSectionHeader) {
                                // Skip items that are clearly edges or section headers
                                Debug.log(`Skipping non-gear item: "${trimmedItem}"`);
                            } else {
                                // This appears to be legitimate gear
                                const containerMatch = trimmedItem.match(/^(.+?)\s*\(Contains:?\s*(.+)\)$/);
                                if (containerMatch) {
                                    const container = containerMatch[1].trim();
                                    const contentsStr = containerMatch[2].replace(/\)$/, '');
                                    character.gear!.push(container);
                                    const contents = splitIgnoringParentheses(contentsStr, ', ');
                                    contents.forEach(c => character.gear!.push(c.trim()));
                                } else {
                                    character.gear!.push(trimmedItem);
                                }
                            }
                        }
                    });
                }
                break;
            } else {
                lineIndex++;
            }
        }


        // Helper function to parse weapons from gear items
        function parseWeaponFromGearItem(gearItem: string, character: Character): Weapon | null {
            const trimmedItem = gearItem.trim();

            // NEW: More flexible weapon pattern matching
            // Handle cases like:
            // "spear (Str+d6, Reach 1, Parry+1)"
            // "bows (Range 12/24/48, Damage 2d6)"
            // "Masterwork greatsword (Str+d10, AP, 3)"
            // "longbow (Range 15/30/60, Damage 2d6, AP 1)"
            // "2x Javelin (Range 3/6/12, Damage Str+d6)"

            // First, try to find the weapon name and details
            // Look for patterns like "name (details)" or "name(details)"
            //const weaponPattern = /^(.+?)\s*\((.+)\)\s*$/;
            const weaponPattern = /^(.*?)\s*\(([^()]+)\)\s*\.?$/;
            const weaponMatch = trimmedItem.match(weaponPattern);

            let altWeaponMatch = null;
            if (!weaponMatch) {
                // Try alternative pattern for weapons without parentheses
                // Look for weapons with properties separated by commas
                const altWeaponPattern = /^(.+?)\s*,\s*(.+)$/;
                altWeaponMatch = trimmedItem.match(altWeaponPattern);
                if (!altWeaponMatch) {
                    return null; // Doesn't look like a weapon
                }
            }

            let weaponName = '';
            let detailsStr = '';

            if (weaponMatch) {
                weaponName = weaponMatch[1].trim();
                detailsStr = weaponMatch[2].trim();
            } else if (altWeaponMatch) {
                weaponName = altWeaponMatch[1].trim();
                detailsStr = altWeaponMatch[2].trim();
            }

            // Clean up weapon name by removing quantity indicators like "2x"
            weaponName = weaponName.replace(/^\d+x\s*/i, '').trim();

            // Parse the details to extract weapon information
            // Split by commas first, then handle semicolons within each part
            const detailParts = detailsStr.split(',').map(part => part.trim());
            const detailMap: Record<string, string> = {};

            detailParts.forEach(part => {
                // Skip empty parts
                if (!part || part.trim() === '') return;

                // Handle different detail formats
                if (part.match(/^[-+]\d+\s+Parry$/i)) {
                    // Format: "+1 Parry" or "-1 Parry"
                    const value = part.replace(/parry/i, '').trim();
                    detailMap['parry'] = value;
                } else if (part.includes(':')) {
                    // Format: "Range: 12/24/48" or "Damage: 2d6"
                    const [key, ...valueParts] = part.split(':');
                    const keyLower = key.toLowerCase().trim();
                    const value = valueParts.join(':').trim();
                    detailMap[keyLower] = value;
                } else if (part.includes(' ')) {
                    // Format: "Str+d6", "AP 2", "Reach 1", etc.
                    const spaceIndex = part.indexOf(' ');
                    const key = part.substring(0, spaceIndex).toLowerCase();
                    const value = part.substring(spaceIndex + 1).trim();

                    // Special handling for damage patterns
                    const isDamagePattern =
                        value.match(/^\d*d\d+[\+\-]?\d*$/i) || // 2d6, d8+2, etc.
                        value.match(/^(str|dex|agi)\s*[\+\-]?\s*d\d+[\+\-]?\d*/i) || // Str+d6, etc.
                        value.match(/^(str|dex|agi)$/i); // Just "Str" alone

                    if (isDamagePattern && (key === 'damage' || key === '')) {
                        detailMap['damage'] = value;
                    } else if (key === 'range' || key === 'reach' || key === 'ap' || key === 'rof') {
                        detailMap[key] = value;
                    } else if (value === 'melee' || value === 'ranged') {
                        detailMap['range'] = value;
                    } else {
                        // Handle cases like "AP 1" where key is "AP" and value is "1"
                        detailMap[key] = value;
                    }
                } else {
                    // Single word parts - could be damage like "2d6" or properties like "AP"
                    const isDamagePattern =
                        part.match(/^\d*d\d+[\+\-]?\d*$/i) || // 2d6, d8+2, etc.
                        part.match(/^(str|dex|agi)\s*[\+\-]?\s*d\d+[\+\-]?\d*/i) || // Str+d6, etc.
                        part.match(/^(str|dex|agi)$/i); // Just "Str" alone

                    if (isDamagePattern) {
                        detailMap['damage'] = part;
                    } else if (part.match(/^\d+$/)) {
                        // Could be AP value or other numeric property
                        if (!detailMap['ap']) {
                            detailMap['ap'] = part;
                        }
                    } else {
                        // Could be properties like "Throwing", "Shooting", etc.
                        detailMap[part.toLowerCase()] = 'true';
                    }
                }
            });

            // NEW: Handle cases where damage is specified without "Damage:" prefix
            // Look for patterns like "Str+d6" or "2d6" in the details
            if (!detailMap['damage']) {
                const damagePattern = /(?:^|\s)(str|dex|agi)\s*[\+\-]?\s*d\d+[\+\-]?\d*|(?:^|\s)\d*d\d+[\+\-]?\d*(?:$|\s)/i;
                const damageMatch = detailsStr.match(damagePattern);
                if (damageMatch) {
                    detailMap['damage'] = damageMatch[0].trim();
                }
            }

            // NEW: Handle range patterns like "Range 12/24/48" or "12/24/48"
            if (!detailMap['range'] || detailMap['range'] === 'melee') {
                const rangePattern = /\b(\d+\/\d+\/\d+)\b/;
                const rangeMatch = detailsStr.match(rangePattern);
                if (rangeMatch) {
                    detailMap['range'] = rangeMatch[0];
                }
            }

            // Determine if this is actually a weapon by checking for weapon-like details
            const isWeapon = detailMap['damage'] ||
                            detailMap['range'] ||
                            detailMap['ap'] ||
                            detailMap['reach'] ||
                            detailMap['parry'] ||
                            detailMap['rof'] ||
                            detailMap['throwing'] === 'true' ||
                            detailMap['shooting'] === 'true';

            if (!isWeapon) {
                return null;
            }

            // Build the weapon object
            const weapon: Weapon = {
                name: weaponName,
                range: (detailMap['range'] || 'melee').toLowerCase(),
                reach: detailMap['reach'],
                parry: detailMap['parry'],
                rof: detailMap['rof'],
                ap: detailMap['ap']
            };

            // Process damage string
            let damage = detailMap['damage'];
            if (damage) {
                const getAttributeDie = (name: string) => character.attributes.find(t => t.name.toLowerCase() === name.toLowerCase())?.die || 'd4';
                const strDie = getAttributeDie('strength');
                Debug.log(`Gear weapon damage parsing - Original: "${damage}", Str die: "${strDie}"`);

                // Handle complex damage patterns like "(1-3)d6" first
                const complexDamageMatch = damage.match(/^\((\d+)-(\d+)\)(d\d+)$/i);
                if (complexDamageMatch) {
                    const minDice = parseInt(complexDamageMatch[1]);
                    const maxDice = parseInt(complexDamageMatch[2]);
                    const dieType = complexDamageMatch[3];
                    const avgDice = Math.ceil((minDice + maxDice) / 2);
                    damage = `${avgDice}${dieType}`;
                    Debug.log(`Complex damage pattern converted: "${complexDamageMatch[0]}" -> "${damage}"`);
                }

                // Handle standalone attribute references (like "Str" alone)
                damage = damage.replace(/\bStr\b(?!\s*[+-]?\s*d\d+)/gi, strDie);

                // Handle attributes followed by dice notation
                damage = damage.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                Debug.log(`Gear weapon damage parsing - After substitution: "${damage}"`);
                weapon.damage = damage;
            }

            // Determine attack values based on weapon type and skills
            const getSkillDie = (name: string) => character.skills.find(t => t.name === name)?.die || 'd4-2';

            const weaponNameLower = weaponName.toLowerCase();
            const isThrown = ['axe', 'hand axe', 'throwing axe', 'dagger', 'knife', 'net', 'sling', 'spear', 'javelin', 'trident', 'starknife', 'shuriken', 'bolas', 'hammer', 'warhammer', 'rock'].some(tw => weaponNameLower.includes(tw));
            const isOnlyThrown = ['net', 'sling', 'shuriken', 'bolas', 'rock'].some(tw => weaponNameLower.includes(tw));

            // NEW: Better range detection
            const rangeValue = detailMap['range'] ? detailMap['range'].toLowerCase() : '';
            const isMelee = !rangeValue || rangeValue === 'melee' || rangeValue === '';
            const isShooting = !isMelee && !isThrown;

            // Special handling for Unarmed weapons
            const isUnarmed = weaponNameLower.includes('unarmed');
            if (isUnarmed && isMelee && !isThrown) {
                weapon.attack = getSkillDie('fighting');
            } else if (isMelee && !isThrown) {
                weapon.attack = getSkillDie('fighting');
            } else if (isThrown) {
                if (isOnlyThrown) {
                    weapon.attack = getSkillDie('athletics');
                } else {
                    weapon.attack = getSkillDie('fighting');
                    weapon.thrownAttack = getSkillDie('athletics');
                }
            } else if (isShooting) {
                weapon.attack = getSkillDie('shooting');
            }

            // Set default reach and parry for melee weapons
            if (isMelee && !weapon.reach) {
                weapon.reach = '1';
            }
            if (isMelee && !weapon.parry) {
                weapon.parry = '0';
            }
            if (!isMelee && !weapon.rof) {
                weapon.rof = '1';
            }

            Debug.log(`Parsed weapon from gear: ${weapon.name} -> attack: ${weapon.attack}, damage: ${weapon.damage}, range: ${weapon.range}`);
            return weapon;
        }

        // Languages
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Languages:\s*(.*)$/i)) {
                const languagesStr = line.replace(/^Languages:\s*/i, '').trim();
                character.languages = languagesStr.split(', ').map(l => l.trim());
                break;
            }
            lineIndex++;
        }

        // Wealth
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Wealth:\s*(.*)$/i)) {
                character.wealth = line.replace(/^Wealth:\s*/i, '').trim();
                break;
            }
            lineIndex++;
        }

        // Power Points
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            const ppMatch = line.match(/^Power Points:\s*(\d+)/i);
            if (ppMatch) {
                character.powerPoints = parseInt(ppMatch[1]);
                break;
            }
            lineIndex++;
        }

        // Special Abilities - assume after h3 equivalent, list until next section
        let saStart = false;
        character.specialAbilities = [];
        lineIndex = 0;
        let currentAbility = '';

        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Special Abilities/i)) {
                saStart = true;
                lineIndex++;
                continue;
            }
            if (saStart) {
                if (line.match(/^Advances|Background/i)) {
                    // Save any partially collected ability
                    if (currentAbility.trim()) {
                        character.specialAbilities.push(currentAbility.trim());
                    }
                    break;
                } else if (line.trim().length > 0) {
                    const trimmedLine = line.trim();

                    // Check if this line starts a new ability:
                    // 1. Starts with bullet points (•, -, *)
                    // 2. Starts with capital letter and contains a colon
                    const isNewAbility = trimmedLine.match(/^[•\-*]\s/) ||
                        (trimmedLine.match(/^[A-Z]/) && trimmedLine.includes(':'));

                    if (isNewAbility) {
                        // Save previous ability if exists
                        if (currentAbility.trim()) {
                            character.specialAbilities.push(currentAbility.trim());
                        }

                        // Start new ability
                        let cleanLine = trimmedLine;
                        if (cleanLine.match(/^[•\-*]\s/)) {
                            cleanLine = cleanLine.replace(/^[•\-*]\s/, '');
                        }
                        currentAbility = cleanLine;
                    } else {
                        // This line continues the current ability
                        if (currentAbility) {
                            currentAbility += ' ' + trimmedLine;
                        } else {
                            // No current ability, start one
                            currentAbility = trimmedLine;
                        }
                    }
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }

        // Don't forget the last ability
        if (currentAbility.trim()) {
            character.specialAbilities.push(currentAbility.trim());
        }

        // Advances
        let advancesStart = false;
        let currentRank = '';
        character.advances = [];
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Advances/i)) {
                advancesStart = true;
                const rankMatch = line.match(/^(.+?) Advances$/i);
                if (rankMatch) {
                    currentRank = rankMatch[1] + ': ';
                }
                lineIndex++;
                continue;
            }
            if (advancesStart) {
                if (line.match(/^Background|Experience/i)) {
                    break;
                } else if (line.startsWith('• ') || line.startsWith('- ')) {
                    character.advances.push(currentRank + line.replace(/^• |^- /, ''));
                    currentRank = ''; // reset after first
                } else if (line.includes(' Advances')) {
                    const rankMatch = line.match(/^(.+?) Advances$/i);
                    if (rankMatch) {
                        currentRank = rankMatch[1] + ': ';
                    }
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }


        // Experience
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            const expMatch = line.match(/^Experience:\s*(\d+)/i);
            if (expMatch) {
                character.experience = parseInt(expMatch[1]);
                break;
            }
            lineIndex++;
        }

        // Bennies
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            const benniesMatch = line.match(/^Bennies:\s*(\d+)/i);
            if (benniesMatch) {
                character.bennies = parseInt(benniesMatch[1]);
                break;
            }
            lineIndex++;
        }

        // Parse attacks from special abilities (e.g., "Bite: Str+d8")
        if (character.specialAbilities && character.specialAbilities.length > 0) {
            const attackPattern = /^(.+?):\s*(.+)$/i; // Pattern like "Bite: Str+d8"
            const weaponsFromSpecialAbilities: Weapon[] = [];

            // Helper function to substitute attribute abbreviations with actual dice
            const getAttributeDie = (name: string) => character.attributes.find(t => t.name === name)?.die || 'd4';

            // List of known weapon attack names to be more precise
            const weaponAttackNames = [
                'bite', 'claw', 'slam', 'strike', 'punch', 'kick', 'gore', 'trample',
                'crush', 'rend', 'maul', 'rake', 'peck', 'sting', 'lash', 'swipe',
                'chomp', 'snap', 'slash', 'stab', 'pierce', 'bludgeon', 'tail', 'horn',
                'tentacle', 'fang', 'talon', 'hoof', 'pincer', 'mandible', 'beak', 'sting or bite', 'bite or sting'
            ];

            // Process special abilities in reverse order to avoid index issues when removing
            for (let i = character.specialAbilities.length - 1; i >= 0; i--) {
                const ability = character.specialAbilities[i];
                const match = ability.match(attackPattern);
                if (match) {
                    const weaponName = match[1].trim().toLowerCase();
                    let damageStr = match[2].trim();

                    // More precise detection: must be a known weapon attack name
                    const isWeaponAttackName = weaponAttackNames.some(name => weaponName.includes(name));
                    
                    // Check for clean damage patterns in the immediate text after colon
                    // Fixed: Improved regex to correctly capture "Str+d6" and similar patterns
                    let immediateDamageMatch = damageStr.match(/(\d*d\d+[+-]?\d*|(?:Str)\s*[+-]?\s*d\d+[+-]?\d*|(?:Str)\s*[+-]?\s*\d*|(?:Str))/i);
                    
                    // If no immediate clean damage, search the entire ability text for damage patterns
                    let finalDamageStr = damageStr;
                    if (!immediateDamageMatch) {
                        const fullDamageMatch = ability.match(/(?:damage|causing)\s+(\d*d\d+[+-]?\d*)/i);
                        if (fullDamageMatch) {
                            finalDamageStr = fullDamageMatch[1];
                            Debug.log(`Found damage later in text: "${finalDamageStr}"`);
                        }
                    } else {
                        finalDamageStr = immediateDamageMatch[1];
                        Debug.log(`Found immediate damage: "${finalDamageStr}"`);
                    }

                    const hasDamage = finalDamageStr.match(/d\d+|(?:Str)\s*[+-]?\s*\d*|(?:Str)/i);

                    if (isWeaponAttackName && hasDamage) {
                        // Debug logging for attribute substitution
                        const strDie = getAttributeDie('strength');
                        Debug.log(`Special ability weapon parsing: ${match[1].trim()} - Original damage: "${finalDamageStr}", Str die: "${strDie}"`);

                        // Extract AP value if present (e.g., "Str+d6 AP 2" or "Str+d6, AP 2" -> ap: "2")
                        let apValue: string | undefined;
                        const apMatch = finalDamageStr.match(/[, ]*AP\s*(\d+)/i) || ability.match(/[, ]*AP\s*(\d+)/i);
                        if (apMatch) {
                            apValue = apMatch[1];
                            // Fixed: More precise regex to avoid removing the "d6" part
                            // Only remove "AP X" patterns, not "d6" or other damage components
                            finalDamageStr = finalDamageStr.replace(/[, ]*AP\s*\d+/i, '').trim();
                            Debug.log(`Extracted AP: ${apValue}, remaining damage: "${finalDamageStr}"`);
                        }

                        // Substitute attribute abbreviations with actual dice values
                        // Handle both dice notation (Str+d8) and simple modifiers (Str+2)
                        // Fixed: The issue was that the regex was incorrectly handling "Str+d6" format
                        // We need to replace "Str" with the actual strength die value while preserving the "+d6" part
                        finalDamageStr = finalDamageStr.replace(/\bStr\b(?=\s*[+-]?\s*(?:d\d+|\d+|$))/gi, strDie);
                        // Additional fix: Handle cases where "Str+d6" should become "d6+d6" (strength die + damage die)
                        // This ensures "Str+d6" is preserved as "d6+d6" instead of just "d6"
                        finalDamageStr = finalDamageStr.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                        Debug.log(`After substitution: "${finalDamageStr}"`);

                        // Create a weapon from this special ability
                        const weapon: Weapon = {
                            name: match[1].trim(), // Use original case for display
                            damage: finalDamageStr,
                            range: 'melee', // Default to melee for natural attacks
                            reach: '1',     // Default reach for natural attacks
                            ap: apValue     // AP extracted from damage string
                        };
                        weaponsFromSpecialAbilities.push(weapon);

                        // Remove this from special abilities since it's now a weapon
                        character.specialAbilities.splice(i, 1);
                    }
                }
            }

            // Add any weapons found in special abilities to the main weapons list
            if (weaponsFromSpecialAbilities.length > 0) {
                if (!character.weapons) {
                    character.weapons = [];
                }
                character.weapons.push(...weaponsFromSpecialAbilities);
            }
        }

        // Add default unskilled roll
        character.skills.push({ name: 'unskilled', die: 'd4-2' });

        Debug.log('Character parsed successfully', character);
        return character;
    }

    static extractTextFromHtml1(htmlString: string): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const content = doc.querySelector('.content');
        let extractedText = '';

        if (content) {
            // Extract text content similar to how we process it
            const h1 = content.querySelector('h1');
            if (h1) {
                extractedText += h1.textContent + '\n';

                // Add quick info
                const nextSibling = h1.nextSibling;
                if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
                    const nextDiv = nextSibling as Element;
                    if (nextDiv.tagName === 'DIV') {
                        extractedText += nextDiv.textContent + '\n\n';
                    }
                }
            }

            // Add description
            const descH2 = Array.from(content.querySelectorAll('h2')).find(h2 => h2.textContent.trim().includes('Description'));
            if (descH2 && descH2.nextElementSibling) {
                extractedText += 'Description: ' + descH2.nextElementSibling.textContent?.trim() + '\n\n';
            }

            // Add attributes
            const attributesStrong = Array.from(content.querySelectorAll('strong')).find(s => s.textContent?.includes('Attributes'));
            if (attributesStrong) {
                Debug.log(`Found attributes strong tag: "${attributesStrong.textContent}"`);
                // Also extract the actual attribute values that follow
                let current = attributesStrong.nextSibling;
                let attributesText = '';
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        attributesText += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        } else if (el.tagName === 'SUP' || el.tagName === 'SPAN') {
                            attributesText += el.textContent;
                        }
                    }
                    current = current.nextSibling;
                }
                if (attributesText.trim()) {
                    // Keep attributes label and values on the same line
                    extractedText += attributesStrong.textContent + ' ' + attributesText.trim() + '\n';
                    Debug.log(`Extracted attributes text: "${attributesText.trim()}"`);
                } else {
                    extractedText += attributesStrong.textContent + '\n';
                }
            }

            // Add skills
            const skillsStrong = Array.from(content.querySelectorAll('strong')).find(s => s.textContent?.includes('Skills'));
            if (skillsStrong) {
                Debug.log(`Found skills strong tag: "${skillsStrong.textContent}"`);
                // Also extract the actual skill values that follow
                let current = skillsStrong.nextSibling;
                let skillsText = '';
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        skillsText += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        } else if (el.tagName === 'SUP' || el.tagName === 'SPAN') {
                            skillsText += el.textContent;
                        }
                    }
                    current = current.nextSibling;
                }
                if (skillsText.trim()) {
                    // Keep skills label and values on the same line
                    extractedText += skillsStrong.textContent + ' ' + skillsText.trim() + '\n';
                    Debug.log(`Extracted skills text: "${skillsText.trim()}"`);
                } else {
                    extractedText += skillsStrong.textContent + '\n';
                }
            }

            // Add weapons
            const weaponsStrong = Array.from(content.querySelectorAll('strong')).find(s => s.textContent?.includes('Weapons'));
            if (weaponsStrong) {
                extractedText += weaponsStrong.textContent;
                let current = weaponsStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        extractedText += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'SUP') {
                            extractedText += ' (' + el.textContent + ')';
                        } else if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                extractedText += '\n\n';
            }

            // Add Pace, Parry, Toughness
            const paceMatch = htmlString.match(/<strong>Pace<\/strong>: (\d+)/);
            if (paceMatch) {
                extractedText += 'Pace: ' + paceMatch[1] + '\n';
            }

            const parryMatch = htmlString.match(/<strong>Parry<\/strong>: (\d+)/);
            if (parryMatch) {
                extractedText += 'Parry: ' + parryMatch[1] + '\n';
            }

            const toughnessMatch = htmlString.match(/<strong>Toughness<\/strong>: (\d+)\s*\((\d+)\)/);
            if (toughnessMatch) {
                extractedText += `Toughness: ${toughnessMatch[1]} (${toughnessMatch[2]})\n`;
            } else {
                // Fallback for toughness without armor
                const toughnessNoArmorMatch = htmlString.match(/<strong>Toughness<\/strong>: (\d+)/);
                if (toughnessNoArmorMatch) {
                    extractedText += 'Toughness: ' + toughnessNoArmorMatch[1] + '\n';
                }
            }

            // Add Hindrances
            const hindrancesStrong = Array.from(content.querySelectorAll('strong')).find(s => s.textContent?.includes('Hindrances'));
            if (hindrancesStrong) {
                extractedText += hindrancesStrong.textContent + '\n';
            }

            // Add Gear
            const gearStrong = Array.from(content.querySelectorAll('strong')).find(s => s.textContent?.includes('Gear'));
            if (gearStrong) {
                extractedText += gearStrong.textContent;
                let current = gearStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        extractedText += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                extractedText += '\n\n';
            }

            // Add Special Abilities
            const saH3 = Array.from(content.querySelectorAll('h3')).find(h3 => h3.textContent?.trim() === 'Special Abilities');
            if (saH3 && saH3.nextElementSibling && saH3.nextElementSibling.tagName === 'UL') {
                extractedText += 'Special Abilities\n';
                const ul = saH3.nextElementSibling as HTMLUListElement;
                const lis = ul.querySelectorAll('li');
                Array.from(lis).forEach(li => {
                    extractedText += '• ' + li.textContent?.trim() || '' + '\n';
                });
                extractedText += '\n';
            }

            // Add Advances
            const advancesH3 = Array.from(content.querySelectorAll('h3')).find(h3 => h3.textContent?.trim() === 'Advances');
            if (advancesH3) {
                extractedText += 'Advances\n';
                let current = advancesH3.nextElementSibling;
                while (current) {
                    if (current.tagName === 'STRONG' && current.textContent?.includes('Advances')) {
                        extractedText += current.textContent + '\n';
                    } else if (current.tagName === 'UL') {
                        const lis = current.querySelectorAll('li');
                        Array.from(lis).forEach(li => {
                            extractedText += '• ' + li.textContent?.trim() + '\n';
                        });
                    }
                    current = current.nextElementSibling;
                    if (current && current.tagName === 'H3') break;
                }
                extractedText += '\n';
            }

            // Add Background
            const bgH2 = Array.from(content.querySelectorAll('h2')).find(h2 => h2.textContent.trim().includes('Background'));
            if (bgH2 && bgH2.nextElementSibling) {
                extractedText += 'Background: ' + bgH2.nextElementSibling.textContent?.trim() + '\n';
            }
        }

        Debug.log("Extracted Text:", extractedText);
        return extractedText;
    }

    static extractTextFromHtml2(htmlString: string): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const content = doc.querySelector('.content');
        const extractedText = content?.textContent || '';
        Debug.log("Extracted Text Html2:", extractedText);
        return extractedText;
    }

    static ParserComparison(testHtml: string): Character {
        Debug.log("=== Comparing HTML and Text Parser Results ===");

        // Parse with HTML parser
        const htmlCharacter = this.parseCharacterFromHTML(testHtml);
        Debug.log("HTML Parser Result:", htmlCharacter);


        // Parse extracted text with text parser
        const chars = [
            this.parseCharacterFromText(this.extractTextFromHtml1(testHtml)),
            this.parseCharacterFromText(this.extractTextFromHtml2(testHtml))
        ]
        let i = 1;
        chars.forEach(textCharacter => {
            Debug.log(`Text ${i} Parser Result:`, textCharacter);
            i++;
            // Compare results
            const comparison = {
                name: htmlCharacter.name === textCharacter.name,
                description: htmlCharacter.description === textCharacter.description,
                rank: htmlCharacter.rank === textCharacter.rank,
                race: htmlCharacter.race === textCharacter.race,
                gender: htmlCharacter.gender === textCharacter.gender,
                profession: htmlCharacter.profession === textCharacter.profession,
                background: htmlCharacter.background === textCharacter.background,
                experience: htmlCharacter.experience === textCharacter.experience,
                bennies: htmlCharacter.bennies === textCharacter.bennies,
                pace: htmlCharacter.bennies === textCharacter.bennies,
                parry: htmlCharacter.bennies === textCharacter.bennies,
                toughness: htmlCharacter.bennies === textCharacter.bennies,
                toughnessDisplay: htmlCharacter.bennies === textCharacter.bennies,
                attributes: JSON.stringify(htmlCharacter.attributes) === JSON.stringify(textCharacter.attributes),
                attributesCount: (htmlCharacter.attributes?.length || 0) === (textCharacter.attributes?.length || 0),
                skills: JSON.stringify(htmlCharacter.skills) === JSON.stringify(textCharacter.skills),
                skillsCount: (htmlCharacter.skills?.length || 0) === (textCharacter.skills?.length || 0),
                weapons: JSON.stringify(htmlCharacter.weapons) === JSON.stringify(textCharacter.weapons),
                weaponsCount: (htmlCharacter.weapons?.length || 0) === (textCharacter.weapons?.length || 0),
                armor: JSON.stringify(htmlCharacter.armor) === JSON.stringify(textCharacter.armor),
                armorCount: (htmlCharacter.armor?.length || 0) === (textCharacter.armor?.length || 0),
                edges: JSON.stringify(htmlCharacter.edges) === JSON.stringify(textCharacter.edges),
                edgesCount: (htmlCharacter.edges?.length || 0) === (textCharacter.edges?.length || 0),
                hindrances: JSON.stringify(htmlCharacter.hindrances) === JSON.stringify(textCharacter.hindrances),
                hindrancesCount: (htmlCharacter.hindrances?.length || 0) === (textCharacter.hindrances?.length || 0),
                gear: JSON.stringify(htmlCharacter.gear) === JSON.stringify(textCharacter.gear),
                gearCount: (htmlCharacter.gear?.length || 0) === (textCharacter.gear?.length || 0),
                languages: JSON.stringify(htmlCharacter.languages) === JSON.stringify(textCharacter.languages),
                languagesCount: (htmlCharacter.languages?.length || 0) === (textCharacter.languages?.length || 0),
                wealth: htmlCharacter.bennies === textCharacter.bennies,
                arcaneBackground: htmlCharacter.bennies === textCharacter.bennies,
                arcaneSkill: htmlCharacter.bennies === textCharacter.bennies,
                powerPoints: htmlCharacter.bennies === textCharacter.bennies,
                powers: JSON.stringify(htmlCharacter.powers) === JSON.stringify(textCharacter.powers),
                powersCount: (htmlCharacter.powers?.length || 0) === (textCharacter.powers?.length || 0),
                specialAbilities: JSON.stringify(htmlCharacter.specialAbilities) === JSON.stringify(textCharacter.specialAbilities),
                specialAbilitiesCount: (htmlCharacter.specialAbilities?.length || 0) === (textCharacter.specialAbilities?.length || 0),
                advances: JSON.stringify(htmlCharacter.advances) === JSON.stringify(textCharacter.advances),
                advancesCount: (htmlCharacter.advances?.length || 0) === (textCharacter.advances?.length || 0),
                isWildCard: htmlCharacter.bennies === textCharacter.bennies,
            };

            Debug.log("Parser Comparison Results:", comparison);

            // Detailed weapon comparison
            if (htmlCharacter.weapons && textCharacter.weapons) {
                htmlCharacter.weapons.forEach((htmlWeapon, index) => {
                    const textWeapon = textCharacter.weapons?.[index];
                    if (textWeapon) {
                        const weaponComparison = {
                            nameMatch: htmlWeapon.name === textWeapon.name,
                            damageMatch: htmlWeapon.damage === textWeapon.damage,
                            rangeMatch: htmlWeapon.range === textWeapon.range,
                            attackMatch: htmlWeapon.attack === textWeapon.attack
                        };
                        Debug.log(`Weapon ${index + 1} (${htmlWeapon.name}) comparison:`, weaponComparison);
                    }
                });
            }
        })
        Debug.log("=== End Parser Comparison ===");
        return htmlCharacter;
    }

    // Test function for the new description parsing
    static testDescriptionParsing() {
        // Test Pattern 1: Description immediately after name
        const testHtml1 = `
        <div class="content">
            <h1>Baku</h1>
            <div>
                The baku looks like a floating animal with brown fur, tusks, and a trunk. It feeds on dreams and nightmares.
                Rank: Veteran
                Race: Spirit
            </div>
            <strong>Attributes</strong>: Agility d12+1, Smarts d8, Spirit d10, Strength d8, Vigor d12
        </div>
        `;

        // Test Pattern 2: Description with prefix
        const testHtml2 = `
        <div class="content">
            <h1>Ingrid</h1>
            <div>Sophomore Female, The Crusader</div>
            <strong>Description:</strong> wears glasses and has a determined look.
            <strong>Attributes</strong>: Agility d6, Smarts d6, Spirit d8, Strength d4, Vigor d6
        </div>
        `;

        // Test Pattern 3: Description header
        const testHtml3 = `
        <div class="content">
            <h1>Ingrid</h1>
            <div>Sophomore Female, The Crusader</div>
            <h2>Description</h2>
            <p>wears glasses and has a determined look.</p>
            <strong>Attributes</strong>: Agility d6, Smarts d6, Spirit d8, Strength d4, Vigor d6
        </div>
        `;

        console.log('Testing Pattern 1 (immediate description):');
        const char1 = this.parseCharacterFromHTML(testHtml1);
        console.log('Description:', char1.description);

        console.log('\nTesting Pattern 2 (Description: prefix):');
        const char2 = this.parseCharacterFromHTML(testHtml2);
        console.log('Description:', char2.description);

        console.log('\nTesting Pattern 3 (Description header):');
        const char3 = this.parseCharacterFromHTML(testHtml3);
        console.log('Description:', char3.description);

        // Test text parser patterns
        const testText1 = `Baku
        The baku looks like a floating animal with brown fur, tusks, and a trunk. It feeds on dreams and nightmares.
        Rank: Veteran
        Race: Spirit
        Attributes: Agility d12+1, Smarts d8, Spirit d10, Strength d8, Vigor d12`;

        const testText2 = `Ingrid
        Sophomore Female, The Crusader
        Description: wears glasses and has a determined look.
        Attributes: Agility d6, Smarts d6, Spirit d8, Strength d4, Vigor d6`;

        const testText3 = `Ingrid
        Sophomore Female, The Crusader
        Description
        wears glasses and has a determined look.
        Attributes: Agility d6, Smarts d6, Spirit d8, Strength d4, Vigor d6`;

        console.log('\nTesting Text Parser Pattern 1:');
        const textChar1 = this.parseCharacterFromText(testText1);
        console.log('Description:', textChar1.description);

        console.log('\nTesting Text Parser Pattern 2:');
        const textChar2 = this.parseCharacterFromText(testText2);
        console.log('Description:', textChar2.description);

        console.log('\nTesting Text Parser Pattern 3:');
        const textChar3 = this.parseCharacterFromText(testText3);
        console.log('Description:', textChar3.description);
    }

    /**
     * Test function to demonstrate section content extraction
     */
    static testSectionExtraction() {
        // Test data with various section formats
        const testLines = [
            "Character Name",
            "Rank: Veteran, Race: Human",
            "Attributes: Agility d8, Smarts d6, Spirit d6, Strength d8, Vigor d8",
            "Skills: Fighting d8, Shooting d6, Notice d6, Stealth d6, Persuasion d4",
            "Edges: Combat Reflexes, Quick Draw, Two-Fisted",
            "Hindrances: Mean, Vengeful (Minor)",
            "Gear: Sword (Damage Str+d8, Parry +1), Leather Armor (Armor 1), Backpack with rope and rations",
            "Special Abilities",
            "• Bite: Str+d6 damage, can be used as a natural weapon",
            "• Night Vision: Ignores attack penalties for Dim and Dark lighting",
            "• Fleet-Footed: Pace increases by 2 when running",
            "• Keen Senses: +2 to Notice rolls involving smell or hearing",
            "Advances: Novice: Improved Combat Reflexes, Seasoned: Improved Quick Draw",
            "Background: Former soldier turned adventurer",
            "Experience: 20",
            "Bennies: 3"
        ];

        // Common section headers in Savage Worlds
        const sectionHeaders = [
            "Attributes", "Skills", "Edges", "Hindrances", "Gear",
            "Special Abilities", "Advances", "Background",
            "Experience", "Bennies", "Pace", "Parry", "Toughness",
            "Arcane Background", "Powers", "Weapons", "Armor",
            "Languages", "Wealth", "Power Points"
        ];

        console.log("=== Testing Section Content Extraction ===");

        // Test extracting the Skills section
        const skillsStart = testLines.findIndex(line => line.startsWith("Skills:"));
        if (skillsStart !== -1) {
            const skillsResult = extractSectionContent(testLines, skillsStart, sectionHeaders);
            console.log(`Skills section content: "${skillsResult.content}"`);
            console.log(`Skills section ended at line: ${skillsResult.endIndex}`);
        }

        // Test extracting the Edges section
        const edgesStart = testLines.findIndex(line => line.startsWith("Edges:"));
        if (edgesStart !== -1) {
            const edgesResult = extractSectionContent(testLines, edgesStart, sectionHeaders);
            console.log(`Edges section content: "${edgesResult.content}"`);
            console.log(`Edges section ended at line: ${edgesResult.endIndex}`);
        }

        // Test extracting the Gear section (multi-line)
        const gearStart = testLines.findIndex(line => line.startsWith("Gear:"));
        if (gearStart !== -1) {
            const gearResult = extractSectionContent(testLines, gearStart, sectionHeaders);
            console.log(`Gear section content: "${gearResult.content}"`);
            console.log(`Gear section ended at line: ${gearResult.endIndex}`);
        }

        // Test extracting Special Abilities (multi-line with bullet points)
        const specialAbilitiesStart = testLines.findIndex(line => line.startsWith("Special Abilities"));
        if (specialAbilitiesStart !== -1) {
            console.log("\n=== Testing Special Ability Extraction ===");

            // Start from the first ability after the header
            let currentIndex = specialAbilitiesStart + 1;

            while (currentIndex < testLines.length) {
                const line = testLines[currentIndex].trim();

                // Check if this line starts a new ability
                if (line.match(/^[•\-*]\s/) || (line.match(/^[A-Z]/) && line.includes(':'))) {
                    const abilityResult = extractSpecialAbilityContent(testLines, currentIndex, sectionHeaders);
                    console.log(`Special ability content: "${abilityResult.content}"`);
                    console.log(`Special ability ended at line: ${abilityResult.endIndex}`);

                    // Move to the next ability
                    currentIndex = abilityResult.endIndex;
                } else {
                    currentIndex++;
                }

                // Stop if we hit a section header
                const isSectionHeader = sectionHeaders.some(header =>
                    new RegExp(`^${header}:?`, 'i').test(line)
                );
                if (isSectionHeader) {
                    break;
                }
            }
        }

        console.log("\n=== Extraction Test Complete ===");
    }
}
