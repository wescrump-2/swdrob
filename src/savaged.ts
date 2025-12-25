import { Debug } from './debug';
import { Util } from './util';

export interface Trait {
    name: string;
    die: string;
    info?: string;
}

export interface Vehicle {
    name: string;
    size?: string;
    handling?: string;
    toughness?: string;
    pace?: string;
    runningDie?: string;
    topSpeed?: string;
    notes?: string;
    contains?: string[];
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
    minStr?: string;
    weight?: number;
    cost?: number;
    notes?: string;
    shots?: number;
    blast?: string;
}

export class Armor {
    name: string = '';
    value: number = 0;
    minStr?: string;
    weight?: number;
    cost?: number;
    notes?: string;
}

export interface Power {
    name: string;
    book?: string;
    page?: string;
    limitations?: string;
    skillBonus?: string;
    duration?: string;
    range?: string;
    damage?: string;
    damagemod?: string;
    [key: string]: any; // Allow additional properties
}

export class Character {
    name: string = '';
    description?: string = '';
    race?: string = '';
    type?: string = '';
    rank?: string = '';
    gender?: string = '';
    profession?: string = '';
    background?: string = '';
    experience?: number;
    bennies?: number;
    attributes: Trait[] = [];
    skills: Trait[] = [];
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
    arcaneBackground?: string = '';
    arcaneSkill?: string = '';
    powerPoints?: number;
    powers?: Power[];
    specialAbilities?: string[];
    advances?: string[];
    isWildCard?: boolean;
    vehicles?: Vehicle[];
    size?: number;

    public getSkillDie(name: string): string {
        // First try exact match
        const exactMatch = this.skills.find(t => t.name === name);
        if (exactMatch) {
            return exactMatch.die;
        }

        // Try case-insensitive match for common arcane skills
        const lowerName = name.toLowerCase();
        const caseInsensitiveMatch = this.skills.find(t => t.name.toLowerCase() === lowerName);
        if (caseInsensitiveMatch) {
            return caseInsensitiveMatch.die;
        }

        // Special handling for psionics skill - check for common variations
        if (lowerName === 'psionics') {
            const psionicsMatch = this.skills.find(t =>
                t.name.toLowerCase() === 'psionics' ||
                t.name.toLowerCase().includes('psionic')
            );
            if (psionicsMatch) {
                return psionicsMatch.die;
            }
        }

        return 'd4-2';
    }
    public getArcaneSkillDie(): string {
        let result = this.getSkillDie(this.arcaneSkill || 'spellcasting');
        if (!result) result = this.getSkillDie('unskilled');
        return result;
    }
    public getAttributeDie(name: string): string {
        return this.attributes.find(t => t.name.toLowerCase() === name.toLowerCase())?.die || 'd4';
    }
    // Add this function to the Character class or as a static method
    static getDefaultCharacter(): Character {
        const character = new Character();

        // Set basic properties
        character.name = "";

        // Set default attributes
        character.attributes = [
            { name: "agility", die: "d6" },
            { name: "smarts", die: "d6" },
            { name: "spirit", die: "d6" },
            { name: "strength", die: "d6" },
            { name: "vigor", die: "d6" }
        ];

        // Set default skills
        character.skills = [
            { name: "unskilled", die: "d4-2" },
            { name: "athletics", die: "d4" },
            { name: "common knowledge", die: "d4" },
            { name: "notice", die: "d4" },
            { name: "persuasion", die: "d4" },
            { name: "stealth", die: "d4" }
        ];

        // Set default combat stats
        character.pace = 6;
        character.parry = 2;
        character.toughness = 5;

        // Initialize arrays
        character.weapons = [];
        character.edges = [];
        character.hindrances = [];
        character.gear = [];

        return character;
    }

    getWounds(): number {
        let wounds = 0;
        if (this.isWildCard) {
            wounds = 3 + (this.edges?.some(s=>s.toLowerCase() === 'tougher than nails') ? 2 : this.edges?.some(s=>s.toLowerCase() === 'tough as nails') ? 1 : 0);
        } else {
            wounds = this.specialAbilities?.some(s=>s.toLowerCase().startsWith('very resilient')) ? 2 : this.specialAbilities?.some(s=>s.toLowerCase().startsWith('resilient')) ? 1 : 0;
        }
        if (this.size) wounds += (this.size>3?1:0) + (this.size>7?1:0) + (this.size>11?1:0);

        return wounds;
    }

    setArcaneBackground(arcaneStr: string) {
        const skillMap: { [key: string]: string } = {
            'Bard': 'performance',
            'Cleric': 'faith',
            'Druid': 'faith',
            'Miracles': 'faith',
            'Alchemist': 'alchemy',
            'Oracle': 'faith',
            'Gifted': 'focus',
            'Psionics': 'psionics',
            'Weird Science': 'weird science',
            'Super Powers': 'focus'
        };
        // Debug logging to help diagnose arcane background parsing
        Debug.log(`setArcaneBackground called with: "${arcaneStr}"`);

        // Improved regex to handle "Arcane Background: Psionics" format
        const match = arcaneStr.match(/(?:Arcane Background(?::\s*|\s+))?(?:\(?)([^)]+)(?:\))?/);
        if (match && match.length > 0) {
            const bgName = match[1].trim();
            const skillName = skillMap[bgName] || 'spellcasting';
            Debug.log(`Arcane Background parsed - Name: "${bgName}", Skill: "${skillName}"`);

            const arcaneDie = this.getSkillDie(skillName) || this.getSkillDie('unskilled');
            Debug.log(`Arcane skill die for "${skillName}": "${arcaneDie}"`);

            //this.skills.push({ name: 'arcane', die: arcaneDie });
            this.arcaneBackground = bgName; // Store just the background name
            this.arcaneSkill = skillName;
        } else {
            Debug.log(`Failed to parse arcane background from: "${arcaneStr}"`);
        }
    }
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
            // FIXED: Check for separator immediately after closing parenthesis
            // The separator is "), " but we've already consumed the ")", so check for ", "
            if (depth === 0 && str.substr(i + 1, separator.length - 1) === separator.substr(1)) {
                result.push(current.trim());
                current = '';
                i += separator.length - 1;
            }
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
            // Clean up bullet points and spaces from the beginning of the line
            let cleanedLine = line;
            if (cleanedLine.match(/^[•\-*]\s/)) {
                cleanedLine = cleanedLine.replace(/^[•\-*]\s/, '').trim();
            }

            if (content.length > 0) {
                content += ' ';
            }
            content += cleanedLine;
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
        .join(' ');
}

export class Savaged {
    static PROXY_BASE = "https://owlbearproxy.vercel.app/api/proxy";
    static proxy_url_base = "https://owlbearproxy.vercel.app/url/proxy";
    static API_KEY: string = '';
    /*
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

    // static async testApiConnection(api_key: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/whoami`;
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    //         body: `apikey=${encodeURIComponent(api_key)}`
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         const data = await response.json();
    //         if (response.ok && data.name && data.name.length > 2) {
    //             Debug.log(`Connected as ${data.name}! API key valid.`, "SUCCESS");
    //             return true;
    //         } else {
    //             Debug.log("Invalid API key.", "ERROR");
    //             return false;
    //         }
    //     } catch (e) {
    //         Debug.error(`Connection failed`);
    //         return false;
    //     }
    // }

    // static async fetchUserData(api_key: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/get-user-data`;
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    //         body: `apikey=${encodeURIComponent(api_key)}`
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         if (!response.ok) {
    //             const ptext = await response.text();
    //             Debug.error(`HTTP ${response.status} ${ptext}`);
    //             return JSON.stringify(response);
    //         } else {
    //             const data = await response.json();
    //             Debug.log(`Successfully fetched user data`);
    //             return data;
    //         }
    //     } catch (e) {
    //         Debug.error(`Failed to load user data`);
    //         return null;
    //     }
    // }

    // static async fetchCharacters(api_key: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/get-characters-generic-json`;
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    //         body: `apikey=${encodeURIComponent(api_key)}`
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         if (!response.ok) {
    //             const ptext = await response.text();
    //             Debug.error(`HTTP ${response.status} ${ptext}`);
    //             return JSON.stringify(response);
    //         } else {
    //             const data = await response.json();
    //             Debug.log(`Successfully fetched ${data.length} characters`);
    //             return data;
    //         }
    //     } catch (e) {
    //         Debug.error(`Failed to load characters`);
    //         return JSON.stringify(e);
    //     }
    // }

    // static async fetchSaved(api_key: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/get-saves`;
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    //         body: `apikey=${encodeURIComponent(api_key)}`
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         if (!response.ok) {
    //             const ptext = await response.text();
    //             Debug.error(`HTTP ${response.status} ${ptext}`);
    //             return JSON.stringify(response);
    //         } else {
    //             const data = await response.json();
    //             Debug.log(`Successfully fetched ${data.length} saves`);
    //             return data;
    //         }
    //     } catch (e) {
    //         Debug.error(`Failed to load saves`);
    //         return JSON.stringify(e);
    //     }
    // }

    // static async fetchThisCharacter(api_key: string, uuid: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/get-character-by-uuid-generic-json`;
    //     const bodyData = { apikey: api_key, search: uuid };
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    //         body: JSON.stringify(bodyData)
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         if (!response.ok) {
    //             const ptext = await response.text();
    //             Debug.error(`HTTP ${response.status} ${ptext}`);
    //             return JSON.stringify(response);
    //         } else {
    //             const data = await response.json();
    //             Debug.log(`Successfully fetched character`);
    //             return data;
    //         }
    //     } catch (e) {
    //         Debug.error(`Failed to load character`);
    //         return JSON.stringify(e);
    //     }
    // }

    // static async searchBestiary(api_key: string, searchString: string) {
    //     const url = `${Savaged.PROXY_BASE}/_api/auth/search-bestiary-generic-json`;
    //     const bodyData = { apikey: api_key, search: searchString };
    //     const options = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json; charset=utf-8" },
    //         body: JSON.stringify(bodyData)
    //     };
    //     try {
    //         const response = await fetch(url, options);
    //         if (!response.ok) {
    //             const ptext = await response.text();
    //             Debug.error(`HTTP ${response.status} ${ptext}`);
    //             return JSON.stringify(response);
    //         } else {
    //             const data = await response.json();
    //             Debug.log(`Successfully fetched ${data.length} beasts`);
    //             return data;
    //         }
    //     } catch (e) {
    //         Debug.error(`Bestiary search failed`);
    //         return JSON.stringify(e);
    //     }
    // }

    static damagePowers = [
        /// {"name","damage","raise","damage mod"}
        { name: "minor bolt", damage: "d4+d4", raise: "+d6", damagemod: "" },
        { name: "bolt", damage: "d6+d6", raise: "+d6", damagemod: "d6+d6+d6" },
        { name: "blast", damage: "d6+d6", raise: "+d6", damagemod: "d6+d6+d6" },
        { name: "burst", damage: "d6+d6", raise: "+d6", damagemod: "d6+d6+d6" },
        { name: "damage field", damage: "d4+d4", raise: "", damagemod: "d6+d6" },
    ]

    /**
     * Finds a power by name in the damagePowers array and adds damage and damagemod properties
     * @param powerObj The power object to enhance
     */
    static enhancePowerWithDamageInfo(powerObj: Power): void {
        if (!powerObj.name) return;

        // Search for the power by name (case-insensitive)
        const foundPower = Savaged.damagePowers.find(damagePower =>
            damagePower.name.toLowerCase() === powerObj.name.toLowerCase()
        );

        if (foundPower) {
            // Add damage and damagemod properties to the power object
            powerObj.damage = foundPower.damage;
            powerObj.damagemod = foundPower.damagemod;
            Debug.log(`Enhanced power "${powerObj.name}" with damage: ${foundPower.damage}, damagemod: ${foundPower.damagemod}`);
        }
    }

    static async parseCharacterFromURL(url: string): Promise<{ character: Character, html: string }> {
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
            const character = this.parseCharacterFromHTML(html);
            return { character, html }
        } catch (e) {
            Debug.error(`Failed to fetch character from ${url}: ${e}`);
            throw e;
        }
    }

    static parseCharacterFromHTML(html: string): Character {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.content');
        const character: Character = new Character();
        if (!content) {
            Debug.error('Character content not found');
        } else {
            const text = content.innerHTML;
            const nameMatch = text.match(/<h1>([^<]*)<\/h1>/);
            const name = nameMatch ? nameMatch[1] : '';
            character.name = Util.toTitleCase(name);
            character.isWildCard = true; //savaged.us are wild cards.
            const h1 = doc.querySelector('h1');
            if (h1) {
                const nextDiv = h1.nextElementSibling;
                if (nextDiv && nextDiv.tagName === 'DIV') {
                    character.rank = '';
                    character.race = '';
                    character.gender = '';
                    character.type = '';
                    character.profession = '';

                    const quickText = nextDiv.textContent || '';
                    const parts = quickText.split(', ').map(p => p.trim());
                    parts.forEach(part => {
                        const [key, value] = part.split(': ').map(s => s.trim());
                        if (key === 'Rank') character.rank = value;
                        else if (key === 'Gender') character.gender = value;
                        else if (key === 'Race') character.race = value;
                        else if (key === 'Type') character.type = value;
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
                        const standaloneRankMatch = quickText.match(Savaged.rankRegEx);
                        if (standaloneRankMatch) {
                            character.rank = standaloneRankMatch[1];
                        }
                    }

                    // Debug logging for rank parsing
                    if (character.rank) {
                        //Debug.log(`Parsed rank: ${character.rank}`);
                    } else {
                        Debug.log('No rank found in quick text');
                    }

                    // Additional rank parsing for formats like "Rank: Veteran (something)" with parentheses
                    if (!character.rank) {
                        const rankWithParensMatch = quickText.match(/Rank[:]?\s*(\w+)\s*\([^)]*\)/i);
                        if (rankWithParensMatch) {
                            character.rank = rankWithParensMatch[1];
                            //Debug.log(`Parsed rank with parentheses: ${character.rank}`);
                        }
                    }
                }
            }

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
                        if (trimmedLine.match(Savaged.sectionHeadersRegEx)) {
                            foundSectionHeader = true;
                            break;
                        }

                        // If we haven't found a section header yet, this might be description text
                        if (!foundSectionHeader) {
                            // Skip lines that look like they contain structured data (key: value pairs)
                            if (!trimmedLine.includes(':') && trimmedLine.length > 10 && !trimmedLine.match(Savaged.rankRegEx)) {
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


            // Background - NEW: Add background extraction similar to text parser
            // Try Pattern 1: Look for "Background" header (h2)
            const bgH2 = Array.from(doc.querySelectorAll('h2')).find(h2 => h2.textContent?.trim().toLowerCase() === 'background');
            if (bgH2) {
                let backgroundText = '';
                let current: ChildNode | null = bgH2.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        backgroundText += current.textContent?.trim() + ' ';
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR') {
                            backgroundText += '\n';
                        } else if (el.tagName === 'P' || el.tagName === 'DIV') {
                            backgroundText += el.textContent?.trim() + ' ';
                        } else if (el.tagName === 'STRONG' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'UL' || el.tagName === 'OL') {
                            break; // Stop at section headers or lists
                        } else {
                            backgroundText += el.textContent?.trim() + ' ';
                        }
                    }
                    current = current.nextSibling;
                }
                if (backgroundText.trim().length > 0) {
                    character.background = backgroundText.trim();
                    //Debug.log(`Parsed background (h2 pattern): "${character.background}"`);
                }
            }

            // Try Pattern 2: Look for "Background:" prefix in text (fallback)
            if (!character.background) {
                const bgPrefixMatch = text.match(/Background:\s*([^\n<]*)/i);
                if (bgPrefixMatch && bgPrefixMatch[1]) {
                    const bgText = bgPrefixMatch[1].trim();
                    if (bgText.length > 0) {
                        character.background = bgText;
                        //Debug.log(`Parsed background (prefix pattern): "${character.background}"`);
                    }
                }
            }

            // Try Pattern 3: Look for background in quick info section after name
            if (!character.background && h1) {
                const nextDiv = h1.nextElementSibling;
                if (nextDiv && nextDiv.tagName === 'DIV') {
                    const quickText = nextDiv.textContent || '';
                    const lines = quickText.split('\n');
                    let backgroundLines: string[] = [];
                    let foundSectionHeader = false;

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) continue;

                        // Check if this line is a section header
                        if (trimmedLine.match(Savaged.sectionHeadersRegEx)) {
                            foundSectionHeader = true;
                            break;
                        }

                        // If we haven't found a section header yet, look for background-like content
                        if (!foundSectionHeader) {
                            // Look for lines that might contain background information
                            if (trimmedLine.length > 10 &&
                                !trimmedLine.includes(':') &&
                                !trimmedLine.match(Savaged.rankRegEx) &&
                                !trimmedLine.match(/^(Rank|Gender|Race|Profession|Type):/i)) {
                                backgroundLines.push(trimmedLine);
                            }
                        }
                    }

                    if (backgroundLines.length > 0) {
                        character.background = backgroundLines.join(' ').trim();
                        //Debug.log(`Parsed background (quick info pattern): "${character.background}"`);
                    }
                }
            }

            // Attributes
            const attributesMatch = text.match(/<strong>Attributes<\/strong>: ([^<]*)/);
            if (attributesMatch) {
                attributesMatch[1].split(', ').forEach(attr => {
                    // Handle attributes with parentheses like "Smarts d6 (A)" or "Smarts d4 (M)"
                    const attrMatch = attr.match(/^([A-Za-z]+)\s+(d\d+\+?\d*)\s*(\([^)]*\))?$/);
                    if (attrMatch) {
                        const name = attrMatch[1].toLowerCase();
                        const die = attrMatch[2];
                        const info = attrMatch[3] ? attrMatch[3] : undefined;
                        character.attributes.push({ name, die, info });
                    } else {
                        // Fallback to original simple parsing
                        const [n, d] = attr.split(' ');
                        if (n && d) {
                            character.attributes.push({ name: n.toLowerCase(), die: d, info: undefined });
                        }
                    }
                });
                //Debug.log(`Parsed ${attributesMatch[1].split(', ').length} attributes`);
            }
            // Skills
            const skillsMatch = text.match(/<strong>Skills<\/strong>: ([^<]*)/);
            if (skillsMatch) {
                Debug.log(`Skills string: "${skillsMatch[1]}"`);
                skillsMatch[1].split(', ').forEach(skill => {
                    Debug.log(`Processing skill: "${skill}"`);
                    const parts = skill.trim().split(' ');
                    if (parts.length >= 2) {
                        const d = parts.pop()!;
                        const n = parts.join(' ');
                        const normalizedSkillName = toCamelCase(n);
                        character.skills.push({ name: normalizedSkillName, die: d });
                        Debug.log(`Parsed skill: "${normalizedSkillName}" -> "${d}"`);

                        // Special handling for Psionics skill - ensure it's recognized for arcane background
                        if (normalizedSkillName.toLowerCase() === 'psionics') {
                            Debug.log(`Found Psionics skill with die: "${d}" - this should be the arcane skill`);
                        }
                    } else {
                        Debug.log(`Skipping invalid skill: "${skill}"`);
                    }
                });
                Debug.log(`Parsed ${skillsMatch[1].split(', ').length} skills`);
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
                            weaponsStr += '[' + el.textContent + ']';
                        } else if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (weaponsStr.startsWith(': ')) {
                    weaponsStr = weaponsStr.substring(2);
                }
                weaponsStr = weaponsStr.replace(/\((\d)\-(\d)\)/g, '[$1-$2]');
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
                    let lastDetailsParenIndex = part.lastIndexOf('(');
                    //const lastDetailsParenIndex = part.lastIndexOf('(Range');
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
                                // Check if this is a damage pattern first (before trying to split by space)
                                // This handles patterns like "2d6-2", "3d8+1", "Str", etc.
                                const isDamagePattern =
                                    p.match(/^\d+d\d+[+-]?\d*$/i) || // 2d6, 2d6-2, 3d8+1, etc.
                                    p.match(/^(str)\s*[+-]?\s*d\d+[+-]?\d*/i) || // Str+d6, Str-d4, etc.
                                    p.match(/^(str)$/i); // Just "Str" alone

                                if (isDamagePattern) {
                                    detailMap['damage'] = p;
                                    Debug.log(`    Identified standalone damage pattern: "${p}"`);
                                    return; // Early return for damage patterns
                                }

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
                                        Debug.log(`    Invalid part (no space, not damage): "${p}"`);
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

                            const strDie = character.getAttributeDie('strength');
                            Debug.log(`Weapon damage parsing - Original: "${damage}", Str die: "${strDie}"`);

                            // NEW: Handle complex damage patterns like "(1-3)d6" first
                            // Extract the base damage pattern and handle variable dice counts
                            const complexDamageMatch = damage.match(/\[(\d+)-(\d+)\](d\d+)/i);

                            if (complexDamageMatch) {
                                //const minDice = parseInt(complexDamageMatch[1]);
                                const maxDice = parseInt(complexDamageMatch[2]);
                                const dieType = complexDamageMatch[3];
                                // For now, use the average: (min+max)/2 rounded up
                                //const avgDice = Math.ceil((minDice + maxDice) / 2);
                                damage = `${maxDice}${dieType}`;
                                Debug.log(`Complex damage pattern converted: "${complexDamageMatch[0]}" -> "${damage}"`);
                            }

                            // under str
                            if (damage.includes('[us]')) {
                                // remove
                                damage = damage.replace(/\[us\]/gi, '');
                                // replace all dX with Str
                                damage = damage.replace(/\bd\d+\b/gi, 'Str')
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
                        Debug.log(`Weapon attack determination - Name: "${name}", isMelee: ${isMelee}, isThrown: ${isThrown}, isShooting: ${isShooting}`);
                        Debug.log(`Available skills: ${JSON.stringify(character.skills.map(s => `${s.name}:${s.die}`))}`);

                        // Special handling for Unarmed weapons - they should use fighting skill if available
                        const isUnarmed = name.toLowerCase().includes('unarmed');
                        if (isUnarmed && isMelee && !isThrown) {
                            attack = character.getSkillDie('fighting');
                            Debug.log(`Unarmed weapon using fighting skill: ${attack}`);
                        } else if (isMelee && !isThrown) {
                            attack = character.getSkillDie('fighting');
                            Debug.log(`Melee weapon using fighting skill: ${attack}`);
                        } else if (isThrown) {
                            if (isOnlyThrown) {
                                attack = character.getSkillDie('athletics');
                                Debug.log(`Thrown-only weapon using athletics skill: ${attack}`);
                            } else {
                                attack = character.getSkillDie('fighting');
                                thrownAttack = character.getSkillDie('athletics');
                                Debug.log(`Thrown weapon using fighting skill: ${attack}, thrown attack: ${thrownAttack}`);
                            }
                        } else if (isShooting) {
                            attack = character.getSkillDie('shooting');
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
                        //Debug.log(`Parsed weapon: "${name}" -> attack: "${weapon.attack}", damage: "${damage}", reach: "${weapon.reach}", parry: "${weapon.parry}", rof: "${weapon.rof}"`);
                    }
                });
                //Debug.log(`Parsed ${weaponParts.length} weapons`);
            }

            // Vehicles
            const vehiclesStrong = Array.from(doc.querySelectorAll('strong')).find(strong => strong.textContent?.trim() === 'Vehicles');
            if (vehiclesStrong) {
                let vehiclesStr = '';
                let current = vehiclesStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        vehiclesStr += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR') {
                            vehiclesStr += '\n';
                        } else if (el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (vehiclesStr.startsWith(': ')) {
                    vehiclesStr = vehiclesStr.substring(2);
                }
                Debug.log(`Vehicles string: "${vehiclesStr}"`);
                character.vehicles = [];

                // Split vehicles by newlines and process each line
                const vehicleLines = vehiclesStr.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                Debug.log(`Found ${vehicleLines.length} vehicle lines to process`);

                let currentVehicleLine = '';
                let inVehicle = false;
                let currentVehicle: Vehicle | null = null;

                vehicleLines.forEach((line, index) => {
                    Debug.log(`Processing vehicle line ${index + 1}: "${line}"`);

                    if (inVehicle) {
                        currentVehicleLine += ' ' + line;
                        if (line.includes(')')) {
                            // parse the accumulated line
                            const fullLine = currentVehicleLine;
                            const nameMatch = fullLine.match(/^(.*)\(/);
                            let vehicleName = '';
                            let detailsStr = '';

                            if (nameMatch) {
                                vehicleName = nameMatch[1].trim();
                                const detailsMatch = fullLine.match(/\(([^)]+)\)$/);
                                if (detailsMatch) {
                                    detailsStr = detailsMatch[1].trim();
                                }
                            }

                            if (vehicleName && detailsStr) {
                                currentVehicle = {
                                    name: vehicleName
                                };

                                const detailParts = detailsStr.split('; ');
                                detailParts.forEach(p => {
                                    p = p.trim();
                                    const [key, value] = p.split(': ');
                                    if (key && value) {
                                        const normalizedKey = key.toLowerCase();
                                        if (normalizedKey === 'size') {
                                            currentVehicle!.size = value;
                                        } else if (normalizedKey === 'handling') {
                                            currentVehicle!.handling = value;
                                        } else if (normalizedKey === 'toughness') {
                                            currentVehicle!.toughness = value;
                                        } else if (normalizedKey === 'pace') {
                                            currentVehicle!.pace = value;
                                        } else if (normalizedKey === 'running die') {
                                            currentVehicle!.runningDie = value;
                                        } else if (normalizedKey === 'top speed') {
                                            currentVehicle!.topSpeed = value;
                                        } else if (normalizedKey === 'notes') {
                                            currentVehicle!.notes = value;
                                        }
                                    }
                                });

                                character.vehicles!.push(currentVehicle);
                                Debug.log(`  Created vehicle: ${JSON.stringify(currentVehicle)}`);
                            }

                            inVehicle = false;
                            currentVehicleLine = '';
                        }
                    } else if (line.includes('(') && !line.includes(')')) {
                        currentVehicleLine = line;
                        inVehicle = true;
                    } else if (line.includes('(') && line.includes(')')) {
                        const nameMatch = line.match(/^(.*)\(/);
                        let vehicleName = '';
                        let detailsStr = '';

                        if (nameMatch) {
                            vehicleName = nameMatch[1].trim();
                            const detailsMatch = line.match(/\(([^)]+)\)$/);
                            if (detailsMatch) {
                                detailsStr = detailsMatch[1].trim();
                            }
                        }

                        if (vehicleName && detailsStr) {
                            currentVehicle = {
                                name: vehicleName
                            };

                            const detailParts = detailsStr.split('; ');
                            detailParts.forEach(p => {
                                p = p.trim();
                                const [key, value] = p.split(': ');
                                if (key && value) {
                                    const normalizedKey = key.toLowerCase();
                                    if (normalizedKey === 'size') {
                                        currentVehicle!.size = value;
                                    } else if (normalizedKey === 'handling') {
                                        currentVehicle!.handling = value;
                                    } else if (normalizedKey === 'toughness') {
                                        currentVehicle!.toughness = value;
                                    } else if (normalizedKey === 'pace') {
                                        currentVehicle!.pace = value;
                                    } else if (normalizedKey === 'running die') {
                                        currentVehicle!.runningDie = value;
                                    } else if (normalizedKey === 'top speed') {
                                        currentVehicle!.topSpeed = value;
                                    } else if (normalizedKey === 'notes') {
                                        currentVehicle!.notes = value;
                                    }
                                }
                            });

                            character.vehicles!.push(currentVehicle);
                            Debug.log(`  Created vehicle: ${JSON.stringify(currentVehicle)}`);
                        }
                    } else if (line.startsWith('Contains:')) {
                        const containsStr = line.replace(/^Contains:\s*/i, '').trim();
                        if (currentVehicle && containsStr) {
                            currentVehicle.contains = containsStr.split(', ').map(item => item.trim());
                            Debug.log(`  Added contains to vehicle: ${JSON.stringify(currentVehicle.contains)}`);
                        }
                    }
                });
                Debug.log(`Parsed ${character.vehicles?.length} vehicles`);
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

                Debug.log(`Found Arcane Background in HTML: "${arcaneStr}"`);
                character.setArcaneBackground(arcaneStr);

                //Debug.log(`Parsed arcane background: "${character.arcaneBackground}", skill: "${skillName}", die: "${arcaneDie}"`);
            }
            // Powers - ENHANCED with complex pattern matching and nested parentheses handling
            const powersMatch = text.match(/Powers: ([^<]*)/i);
            if (powersMatch) {
                character.powers = [];
                //const arcaneDie = getSkillDie(character.arcaneSkill);
                // Split powers but stop when we encounter "Power Points"
                let powersStr = powersMatch[1].split('Power Points')[0].trim();
                // Remove dashes from powers string
                powersStr = Util.removeDashes(powersStr);
                powersStr.split(', ').forEach(power => {
                    // ENHANCED: Handle complex power patterns with additional properties and nested parentheses
                    const enhancedMatch = power.trim().replace(/\.$/, '').match(/(.*?) \((.*?)(?:; (.*?))? p(\d+)\)/);
                    let name: string, book: string | undefined, page: string | undefined;
                    let properties: Record<string, string> = {};

                    if (enhancedMatch) {
                        name = enhancedMatch[1].trim();
                        const mainDetails = enhancedMatch[2].trim();
                        const additionalProps = enhancedMatch[3] ? enhancedMatch[3].trim() : '';
                        page = enhancedMatch[4].trim();

                        // Parse book from main details
                        const bookMatch = mainDetails.match(/(.*?) p\d+/);
                        book = bookMatch ? bookMatch[1].trim() : mainDetails;

                        // Parse additional properties (after semicolons) with nested parentheses handling
                        if (additionalProps) {
                            // Handle nested parentheses in property values (like "Touch (limited)")
                            const propertyParts = splitIgnoringParentheses(additionalProps, ';');
                            propertyParts.forEach(prop => {
                                const trimmedProp = prop.trim();
                                if (trimmedProp) {
                                    const colonIndex = trimmedProp.indexOf(':');
                                    if (colonIndex !== -1) {
                                        const key = trimmedProp.substring(0, colonIndex).trim();
                                        const value = trimmedProp.substring(colonIndex + 1).trim();
                                        properties[key] = value;
                                    } else {
                                        // Standalone property (like "Touch (limited)")
                                        properties[trimmedProp] = 'true';
                                    }
                                }
                            });
                        }
                    } else {
                        // Fallback to original simple pattern
                        const simpleMatch = power.trim().match(/(.*?) \((.*?) p(\d+)\)/);
                        if (simpleMatch) {
                            name = simpleMatch[1].trim();
                            book = simpleMatch[2].trim();
                            page = simpleMatch[3].trim();
                        } else {
                            name = power.split(' (')[0].trim();
                            book = undefined;
                            page = undefined;
                        }
                    }

                    // Create power object with additional properties
                    const powerObj: Power = { name, book, page };
                    if (Object.keys(properties).length > 0) {
                        Object.assign(powerObj, properties);
                    }
                    // Enhance power with damage information from damagePowers array
                    Savaged.enhancePowerWithDamageInfo(powerObj);
                    character.powers!.push(powerObj);
                });
                //Debug.log(`Parsed ${character.powers.length} powers with enhanced details and nested parentheses`);
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
                let edgesStr = edgesMatch[1].trim();
                edgesStr = Util.removeDashes(edgesStr);
                character.edges = splitIgnoringParentheses(edgesStr, ', ');
            }
            // Hindrances
            const hindrancesMatch = text.match(/<strong>Hindrances<\/strong>: ([^<]*)/);
            if (hindrancesMatch) {
                let hindStr = hindrancesMatch[1].trim();
                hindStr = Util.removeDashes(hindStr);
                character.hindrances = splitIgnoringParentheses(hindStr, ', ');
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
                // Remove dashes from gear string
                gearStr = Util.removeDashes(gearStr);
                // Add vehicle contains to gearStr
                if (character.vehicles) {
                    const vehicleContains: string[] = [];
                    character.vehicles.forEach(vehicle => {
                        if (vehicle.contains) {
                            vehicleContains.push(...vehicle.contains);
                        }
                    });
                    if (vehicleContains.length > 0) {
                        gearStr += ', ' + vehicleContains.join(', ');
                    }
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

            // Cybertech - process like gear
            const cybertechStrong = Array.from(doc.querySelectorAll('strong')).find(strong => strong.textContent?.trim() === 'Cybertech');
            if (cybertechStrong) {
                let cybertechStr = '';
                let current = cybertechStrong.nextSibling;
                while (current) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        cybertechStr += current.textContent;
                    } else if (current.nodeType === Node.ELEMENT_NODE) {
                        const el = current as Element;
                        if (el.tagName === 'BR' || el.tagName === 'STRONG') {
                            break;
                        }
                    }
                    current = current.nextSibling;
                }
                if (cybertechStr.startsWith(': ')) {
                    cybertechStr = cybertechStr.substring(2);
                }
                // Remove dashes from cybertech string
                cybertechStr = Util.removeDashes(cybertechStr);
                // Add cybertech items to gear array
                splitIgnoringParentheses(cybertechStr, ', ').forEach(g => {
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
                //Debug.log(`Parsed ${character.gear?.length} cybertech items added to gear`);
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

                // Process special abilities in reverse order to avoid index issues when removing
                for (let i = character.specialAbilities.length - 1; i >= 0; i--) {
                    const ability = character.specialAbilities[i];
                    const match = ability.match(attackPattern);
                    if (match) {
                        const weaponName = match[1].trim().toLowerCase();
                        let damageStr = match[2].trim();

                        // More precise detection: must be a known weapon attack name
                        const isWeaponAttackName = Savaged.weaponAttackNames.some(name => weaponName.includes(name));

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
                            const strDie = character.getAttributeDie('strength');
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
        //remove hyphenation
        let testString = text.replace(regexhyphen, '');
        const from = "—’″−";
        const to = "-'\"-";
        const map = new Map<string, string>(
            [...from].map((char, i) => [char, to[i] ?? char])
        );
        testString = testString.replace(/./g, ch => map.get(ch) ?? ch);

        // Option 1: Replace all non-ASCII characters (most common need)
        // This preserves ASCII letters, numbers, punctuation, and spaces
        const regex1 = /[^\x00-\x7F]/g;
        //const xregex1 = /[\x00-\x7F]/g;
        const regexes = [
            { name: "Non-ASCII only", pattern: regex1, replace: "-", description: "Replaces everything outside ASCII range (0-127)" },
            //{ name: "Non-ASCII only-REMOVED", pattern: xregex1, replace: "", description: "Replaces everything outside ASCII range (0-127)" },
        ];
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
        return clean;
    }

    static weaponAttackNames = [
        'antler', 'attach', 'attack', 'barb', 'barbs', 'bash', 'beak', 'bite or sting', 
        'bite', 'bludgeon', 'bolt', 'breath weapon', 'burst', 'cannon', 'chomp', 'claw', 
        'crush', 'dart', 'fang', 'fist', 'gore', 'hoof', 'hooves', 'horn', 'jet', 'kick', 
        'lash', 'mandible', 'maul', 'melee', 'peck', 'pierce', 'pincer', 'punch', 'rake', 
        'ray', 'rend', 'rock throwing', 'scales', 'slap', 'slam', 'slash', 'snap', 'spit', 
        'spittle', 'spray', 'stab', 'sting or bite', 'sting', 'strike', 'stomp', 'swarm', 
        'swipe', 'tail', 'talon', 'tendrils', 'tentacle', 'tongue', 'touch', 'trample', 
        'trunk', 'tusks', 'unarmed', 'vines', 'volley',
    ];

    // Define section headers for extraction functions (moved to top)
    static sectionHeaders = [
        "Attributes", "Skills", "Edges", "Hindrances", "Gear",
        "Special Abilities", "Advances", "Background",
        "Charisma", "Cybertech",
        "Experience", "Bennies", "Pace",
        "Arcane Background", "Powers", "Super Powers", "Weapons", "Languages",
        "Wealth", "Power Points", "Description",
        "Vehicles", "Armor", //Armor is last for reasons
    ];

    static escaped = Savaged.sectionHeaders.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    static sectionHeadersRegEx = new RegExp(`^(${Savaged.escaped}:?)`, 'i');

    static isSectionHeader(line: string): boolean {
        return this.sectionHeadersRegEx.test(line);
    }
    static findAndRemoveLineStartingWith(lines: string[], prefix: string): string {
        // Find the index of the first line that starts with the prefix
        const index = lines.findIndex(line => line.toLowerCase().startsWith(prefix));

        if (index !== -1) {
            // Remove the line from the array and return it (without the prefix)
            const foundLine = lines[index];
            lines.splice(index, 1);
            return foundLine;
        }

        // Return blank if not found
        return '';
    }

    static rankRegEx = /\b(Veteran|Novice|Seasoned|Heroic|Legendary)\b/i;

    static parseCharacterFromText(text: string): Character {
        const character: Character = new Character();
        const clean = this.cleanText(text, 1);
        const lines = clean.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let name = lines[0];
        if (/^\S\s/.test(name)) {
            character.isWildCard = true;
            name = name && name.length > 1 ? name.slice(2) : name ?? '';
        } else if (/^[^a-zA-Z]/.test(name)) {
            character.isWildCard = true;
            name = name && name.length > 0 ? name.slice(1) : name ?? '';
        } else {
            character.isWildCard = false;
        }
        character.name = Util.toTitleCase(name);

        // Parse quick info after name (Rank, Gender, Race, Profession)
        let lineIndex = 1;
        let quickText = '';
        while (lineIndex < lines.length && !lines[lineIndex].match(Savaged.sectionHeadersRegEx)) {
            quickText += (quickText ? ', ' : '') + lines[lineIndex];
            lineIndex++;
        }

        //const startLineIndex = lineIndex; // Save position after quick info
        const parts = quickText.split(', ').map(p => p.trim());
        character.rank = '';
        character.race = '';
        character.gender = '';
        character.type = '';
        character.profession = '';
        parts.forEach(part => {
            const [key, value] = part.split(': ').map(s => s.trim());
            if (key === 'Rank') character.rank = value;
            else if (key === 'Gender') character.gender = value;
            else if (key === 'Race') character.race = value;
            else if (key === 'Type') character.type = value;
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
            const standaloneRankMatch = quickText.match(Savaged.rankRegEx);
            if (standaloneRankMatch) {
                character.rank = standaloneRankMatch[1];
            }
        }

        // Additional rank parsing for formats like "Rank: Veteran (something)" with parentheses
        if (!character.rank) {
            const rankWithParensMatch = quickText.match(/Rank[:]?\s*(\w+)\s*\([^)]*\)/i);
            if (rankWithParensMatch) {
                character.rank = rankWithParensMatch[1];
                //Debug.log(`Parsed rank with parentheses: ${character.rank}`);
            }
        }

        let tempLineIndex = 0;
        while (tempLineIndex < lines.length) {
            const line = lines[tempLineIndex];
            if (line.match(/^(Race)[:]?/i)) {
                // Use new extraction function to get all description content
                const typeResult = extractSectionContent(lines, tempLineIndex, Savaged.sectionHeaders);
                const typeText = typeResult.content.replace(/^(Race)[:]?\s*/i, '').trim();
                if (typeText.length > 0) {
                    character.race = typeText;
                }
                tempLineIndex = typeResult.endIndex;
                break;
            } else if (line.match(/^(Type)[:]?/i)) {
                // Use new extraction function to get all description content
                const typeResult = extractSectionContent(lines, tempLineIndex, Savaged.sectionHeaders);
                const typeText = typeResult.content.replace(/^(Type)[:]?\s*/i, '').trim();
                if (typeText.length > 0) {
                    character.type = typeText;
                }
                tempLineIndex = typeResult.endIndex;
                break;
            }
            tempLineIndex++;
        }

        // Parse Description - using new extraction function
        tempLineIndex = 0;
        while (tempLineIndex < lines.length) {
            const line = lines[tempLineIndex];
            if (line.match(/^Description[:]?/i)) {
                // Use new extraction function to get all description content
                const descResult = extractSectionContent(lines, tempLineIndex, Savaged.sectionHeaders);
                const descriptionText = descResult.content.replace(/^Description[:]?\s*/i, '').trim();
                if (descriptionText.length > 0) {
                    character.description = descriptionText;
                }
                tempLineIndex = descResult.endIndex;
                break;
            }
            tempLineIndex++;
        }

        // Try fallback pattern: Look for descriptive text immediately after name
        if (!character.description) {
            let tempLineIndex2 = 1;
            let descriptionLines: string[] = [];
            let foundSectionHeader = false;

            while (tempLineIndex2 < lines.length && !foundSectionHeader) {
                const line = lines[tempLineIndex2];
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    tempLineIndex2++;
                    continue;
                }

                // Check if this line is a section header
                if (trimmedLine.match(Savaged.sectionHeadersRegEx)) {
                    foundSectionHeader = true;
                    break;
                }

                // If we haven't found a section header yet, this might be description text
                if (!foundSectionHeader) {
                    // Skip lines that look like they contain structured data (key: value pairs)
                    if (!trimmedLine.includes(':') && !trimmedLine.match(Savaged.rankRegEx)) {
                        descriptionLines.push(trimmedLine);
                    } else {
                        foundSectionHeader = true; // Found a structured line, stop looking for fallback pattern
                    }
                }
                tempLineIndex2++;
            }

            if (descriptionLines.length > 0) {
                character.description = descriptionLines.join(' ').trim();
            }
        }

        // Parse Background - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Background[:]?/i)) {
                // Use new extraction function to get all background content
                const backgroundResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                const backgroundText = backgroundResult.content.replace(/^Background[:]?\s*/i, '').trim();
                if (backgroundText.length > 0) {
                    character.background = backgroundText;
                }
                lineIndex = backgroundResult.endIndex;
                break;
            }
            lineIndex++;
        }

        // Attributes - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];

            // Look for standard format: "Attributes: Agility d6, Smarts d6, Spirit d6, Strength d6, Vigor d6"
            if (line.match(/^Attributes:\s*(.*)$/i)) {
                // Use new extraction function to get all attribute content
                const attrsResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                const attrsStr = attrsResult.content.replace(/^Attributes:\s*/i, '').trim();
                Debug.log(`Parsing attributes: "${attrsStr}"`);
                attrsStr.split(', ').forEach(attr => {
                    // Handle attributes with parentheses like "Smarts d6 (A)" or "Smarts d4 (M)"
                    const attrMatch = attr.match(/^([A-Za-z]+)\s+(d\d+\+?\d*)\s*(\([^)]*\))?$/);
                    if (attrMatch) {
                        const name = attrMatch[1].toLowerCase();
                        const die = attrMatch[2];
                        const info = attrMatch[3] ? attrMatch[3] : undefined;
                        character.attributes.push({ name, die, info });
                        //Debug.log(`Parsed attribute: ${name} -> ${die} (info: ${info})`);
                    } else {
                        // Fallback to original simple parsing
                        const [n, d] = attr.split(' ');
                        if (n && d) {
                            character.attributes.push({ name: n.toLowerCase(), die: d });
                            //Debug.log(`Parsed attribute: ${n.toLowerCase()} -> ${d}`);
                        }
                    }
                });
                lineIndex = attrsResult.endIndex;
            }
            // Look for alternative format where attributes are listed separately
            else if (line.match(/^(Agility|Smarts|Spirit|Strength|Vigor):\s*(.*)$/i)) {
                const attrMatch = line.match(/^(Agility|Smarts|Spirit|Strength|Vigor):\s*(.*)$/i);
                if (attrMatch) {
                    const attrName = attrMatch[1].toLowerCase();
                    // Handle attributes with parentheses like "Smarts: d6 (A)" or "Smarts: d4 (M)"
                    const dieMatch = attrMatch[2].trim().match(/^(d\d+\+?\d*)\s*(\([^)]*\))?$/);
                    const attrDie = dieMatch ? dieMatch[1] : attrMatch[2].trim();
                    const info = dieMatch && dieMatch[2] ? dieMatch[2].replace(/[()]/g, '') : undefined;
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie, info });
                        //Debug.log(`Parsed attribute (alternative format): ${attrName} -> ${attrDie} (info: ${info})`);
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
                    const info = undefined; // Compact format doesn't have parentheses
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie, info });
                        //Debug.log(`Parsed attribute (compact format 1): ${attrName} -> ${attrDie} (info: ${info})`);
                    }
                }

                for (const match of attrMatches2) {
                    const attrName = match[1].toLowerCase();
                    const attrDie = match[2];
                    const info = undefined; // Compact format doesn't have parentheses
                    // Check if this attribute already exists before adding
                    if (!character.attributes.some(a => a.name === attrName)) {
                        character.attributes.push({ name: attrName, die: attrDie, info });
                        //Debug.log(`Parsed attribute (compact format 2): ${attrName} -> ${attrDie} (info: ${info})`);
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
                { name: "agility", die: "d6", info: undefined },
                { name: "smarts", die: "d6", info: undefined },
                { name: "spirit", die: "d6", info: undefined },
                { name: "strength", die: "d6", info: undefined },
                { name: "vigor", die: "d6", info: undefined }
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
                const skillsResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
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
                const skillsResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
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
                        const normalizedSkillName = toCamelCase(skillName);
                        Debug.log(`Parsed skill: "${normalizedSkillName}" -> "${die}"`);
                        character.skills.push({ name: normalizedSkillName, die: die });

                        // Special handling for Psionics skill - ensure it's recognized for arcane background
                        if (normalizedSkillName.toLowerCase() === 'psionics') {
                            Debug.log(`Found Psionics skill with die: "${die}" - this should be the arcane skill`);
                        }
                    } else {
                        Debug.log(`Skipping invalid skill format: "${trimmedSkill}"`);
                    }
                } else {
                    // Handle format "SkillName: dX" (with colon)
                    const colonMatch = trimmedSkill.match(/^(.+?)\s*:\s*(d\d+\+?\d*)$/i);
                    if (colonMatch) {
                        const skillName = colonMatch[1].trim();
                        const die = colonMatch[2].trim();
                        const normalizedSkillName = toCamelCase(skillName);
                        Debug.log(`Parsed skill (colon format): "${normalizedSkillName}" -> "${die}"`);
                        character.skills.push({ name: normalizedSkillName, die: die });

                        // Special handling for Psionics skill - ensure it's recognized for arcane background
                        if (normalizedSkillName.toLowerCase() === 'psionics') {
                            Debug.log(`Found Psionics skill with die: "${die}" - this should be the arcane skill`);
                        }
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
                if (line.match(Savaged.sectionHeadersRegEx)) {
                    break;
                } else {
                    weaponsStr += ' ' + line;
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }
        weaponsStr = weaponsStr.replace(/\((\d)\-(\d)\)/g, '[$1-$2]');
        if (weaponsStr) {
            // Improved regex to handle weapons with "Str" damage and nested parentheses
            //const weaponMatches = weaponsStr.matchAll(/([^,]+?(?:\([^)]+\))*?)(?=,|$)/g);
            const weaponMatches = [...weaponsStr.matchAll(/([^,]+?(?:\([^)]+\))*?)(?=,|$)/g)];

            character.weapons = [];
            for (const match of weaponMatches) {
                const weaponText = match[1].trim();
                if (!weaponText) continue;

                // Extract weapon name (may include parentheses like ".45")
                let weaponName = weaponText;
                let detailsStr = '';

                // const detailPatterns = ['(Range', '(Damage', '(Str+', '(Str-', '(AP'];
                // let lastDetailsParenIndex = -1;
                // let detailPatternUsed = '';

                // // Find the last occurrence of any detail pattern
                // for (const pattern of detailPatterns) {
                //     const index = weaponText.lastIndexOf(pattern);
                //     if (index > lastDetailsParenIndex) {
                //         lastDetailsParenIndex = index;
                //         detailPatternUsed = pattern;
                //     }
                // }
                let lastDetailsParenIndex = weaponText.lastIndexOf('(');

                // Fallback: if no specific patterns found, look for any parenthesis with weapon-like content
                // if (lastDetailsParenIndex === -1) {
                //     // Look for parentheses containing known weapon properties
                //     const weaponPropertyPatterns = ['Range', 'Damage', 'Str+', 'Str-', 'AP', 'Parry', 'Reach', 'ROF'];
                //     const parenMatches = weaponText.matchAll(/\(([^)]+)\)/g);
                //     let bestMatchIndex = -1;
                //     let bestMatchScore = 0;

                //     for (const match of parenMatches) {
                //         let score = 0;
                //         const content = match[1];
                //         weaponPropertyPatterns.forEach(prop => {
                //             if (content.includes(prop)) score++;
                //         });
                //         if (score > bestMatchScore) {
                //             bestMatchScore = score;
                //             bestMatchIndex = match.index;
                //         }
                //     }

                //     if (bestMatchIndex !== -1) {
                //         lastDetailsParenIndex = bestMatchIndex;
                //         detailPatternUsed = 'fallback';
                //     }
                // }

                if (lastDetailsParenIndex === -1) {
                    Debug.log(`  No weapon details found for: "${weaponText}"`);
                    continue; // Skip weapons without proper details
                }

                // Extract weapon name (everything before the last details parenthesis)
                weaponName = weaponText.substring(0, lastDetailsParenIndex).trim();
                // Extract details (everything from the last details parenthesis onwards, excluding the final closing parenthesis)
                const detailsWithParen = weaponText.substring(lastDetailsParenIndex).trim();
                // Remove the final closing parenthesis if present
                const starts = detailsWithParen.startsWith('(') ? 1 : 0;
                const ends = detailsWithParen.endsWith(')') ? 1 : 0;
                detailsStr = detailsWithParen.substring(starts, detailsWithParen.length - ends).trim();

                // Clean up weapon name by removing any trailing parentheses that might be part of the name
                // e.g., ".45" in "Colt .45 (Range 12/24/48, Damage 2d6)"
                const nameCleanupPattern = /(\.\d+|\([^)]+\))$/;
                const nameCleanupMatch = weaponName.match(nameCleanupPattern);
                if (nameCleanupMatch) {
                    const potentialNamePart = weaponName.substring(0, nameCleanupMatch.index).trim();
                    // Only use the cleanup if it results in a reasonable weapon name
                    if (potentialNamePart.length > 2 && !potentialNamePart.endsWith('(')) {
                        weaponName = potentialNamePart;
                    }
                }

                Debug.log(`  Enhanced parsing - Name: "${weaponName}", Details: "${detailsStr}""`);

                if (weaponName && detailsStr) {
                    const detailParts = detailsStr.split(', ');
                    const detailMap: Record<string, string> = {};

                    // Special handling for comma-separated values format
                    if (detailParts.length >= 2) {
                        // First value is typically damage
                        const firstValue = detailParts[0].trim();
                        if (firstValue.match(/^\d+d\d+$/) || firstValue === 'Str' || firstValue.match(/^Str[+-]?\d*$/i)) {
                            detailMap['damage'] = firstValue;
                        }

                        // Second value is typically range if it looks like range format
                        const secondValue = detailParts[1].trim();
                        if (secondValue.match(/^\d+\/\d+\/\d+$/) || secondValue === 'melee') {
                            detailMap['range'] = secondValue;
                        }

                        // Third value might be ROF
                        if (detailParts.length >= 3 && detailParts[2].trim().startsWith('ROF')) {
                            detailMap['rof'] = detailParts[2].trim().replace('ROF', '').trim();
                        }
                    }

                    detailParts.forEach(p => {
                        p = p.trim();
                        if (p.match(/^[-+]\d+ Parry$/)) {
                            const value = p.replace(' Parry', '');
                            detailMap['parry'] = value;
                        } else {
                            // Check if this is a damage pattern first (before trying to split by space)
                            // This handles patterns like "2d6-2", "3d8+1", "Str", etc.
                            const isDamagePattern =
                                p.match(/^\d+d\d+[+-]?\d*$/i) || // 2d6, 2d6-2, 3d8+1, etc.
                                p.match(/^(str)\s*[+-]?\s*d\d+[+-]?\d*/i) || // Str+d6, Str-d4, etc.
                                p.match(/^(str)$/i); // Just "Str" alone

                            if (isDamagePattern) {
                                detailMap['damage'] = p;
                                Debug.log(`    Identified standalone damage pattern: "${p}"`);
                                return; // Early return for damage patterns
                            }

                            let key: string, value: string;
                            if (p.includes(': ')) {
                                [key, value] = p.split(': ');
                            } else {
                                const spaceIndex = p.indexOf(' ');
                                if (spaceIndex !== -1) {
                                    key = p.substring(0, spaceIndex);
                                    value = p.substring(spaceIndex + 1);
                                } else {
                                    // Handle standalone values like "Str" as damage
                                    if (p === 'Str' || p.match(/^\d+d\d+$/)) {
                                        detailMap['damage'] = p;
                                        return;
                                    } else {
                                        return;
                                    }
                                }
                            }
                            detailMap[key.toLowerCase().replace(':', '')] = value.trim();
                        }
                    });
                    let damage = detailMap['damage'];
                    if (damage) {
                        // Substitute attribute abbreviations with actual dice

                        const strDie = character.getAttributeDie('strength');
                        Debug.log(`Weapon damage parsing (text) - Original: "${damage}", Str die: "${strDie}"`);

                        // NEW: Handle complex damage patterns like "(1-3)d6" first
                        // Extract the base damage pattern and handle variable dice counts\
                        const complexDamageMatch = damage.match(/\[(\d+)-(\d+)\](d\d+)/i);

                        if (complexDamageMatch) {
                            //const minDice = parseInt(complexDamageMatch[1]);
                            const maxDice = parseInt(complexDamageMatch[2]);
                            const dieType = complexDamageMatch[3];
                            // For now, use the average: (min+max)/2 rounded up
                            //const avgDice = Math.ceil((minDice + maxDice) / 2);
                            damage = `${maxDice}${dieType}`;
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
                        attack = character.getSkillDie('fighting');
                        Debug.log(`Unarmed weapon using fighting skill (text): ${attack}`);
                    } else if (isMelee && !isThrown) {
                        attack = character.getSkillDie('fighting');
                        Debug.log(`Melee weapon using fighting skill (text): ${attack}`);
                    } else if (isThrown) {
                        if (isOnlyThrown) {
                            attack = character.getSkillDie('athletics');
                            Debug.log(`Thrown-only weapon using athletics skill (text): ${attack}`);
                        } else {
                            attack = character.getSkillDie('fighting');
                            thrownAttack = character.getSkillDie('athletics');
                            Debug.log(`Thrown weapon using fighting skill (text): ${attack}, thrown attack: ${thrownAttack}`);
                        }
                    } else if (isShooting) {
                        attack = character.getSkillDie('shooting');
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
                Debug.log(`Found Arcane Background in text: "${arcaneStr}"`);
                character.setArcaneBackground(arcaneStr);
                break;
            }
            lineIndex++;
        }

        // Powers - ENHANCED with complex pattern matching
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex].replace(/^Super\s/i, ''); //fix for super powers
            if (line.match(/^Powers:\s*(.*)$/i)) {
                // Use new extraction function to get all powers content
                const powersResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                let powersStr = powersResult.content.replace(/^(Super\s)?Powers:\s*/i, '').trim();
                // Remove dashes from powers string
                powersStr = Util.removeDashes(powersStr);
                // Split powers but stop when we encounter "Power Points"
                const cleanPowersStr = powersStr.split('Power Points')[0].trim();
                character.powers = [];
                cleanPowersStr.split(', ').forEach(power => {
                    // ENHANCED: Handle complex power patterns with additional properties
                    const enhancedMatch = power.trim().replace(/\.$/, '').match(/(.*?) \((.*?)(?:; (.*?))? p(\d+)\)/);
                    let name: string, book: string | undefined, page: string | undefined;
                    let properties: Record<string, string> = {};

                    if (enhancedMatch) {
                        name = enhancedMatch[1].trim();
                        const mainDetails = enhancedMatch[2].trim();
                        const additionalProps = enhancedMatch[3] ? enhancedMatch[3].trim() : '';
                        page = enhancedMatch[4].trim();

                        // Parse book from main details
                        const bookMatch = mainDetails.match(/(.*?) p\d+/);
                        book = bookMatch ? bookMatch[1].trim() : mainDetails;

                        // Parse additional properties (after semicolons) with nested parentheses handling
                        if (additionalProps) {
                            // Handle nested parentheses in property values (like "Touch (limited)")
                            const propertyParts = splitIgnoringParentheses(additionalProps, ';');
                            propertyParts.forEach(prop => {
                                const trimmedProp = prop.trim();
                                if (trimmedProp) {
                                    const colonIndex = trimmedProp.indexOf(':');
                                    if (colonIndex !== -1) {
                                        const key = trimmedProp.substring(0, colonIndex).trim();
                                        const value = trimmedProp.substring(colonIndex + 1).trim();
                                        properties[key] = value;
                                    } else {
                                        // Standalone property (like "Touch (limited)")
                                        properties[trimmedProp] = 'true';
                                    }
                                }
                            });
                        }
                    } else {
                        // Fallback to original simple pattern
                        const simpleMatch = power.trim().match(/(.*?) \((.*?) p(\d+)\)/);
                        if (simpleMatch) {
                            name = simpleMatch[1].trim();
                            book = simpleMatch[2].trim();
                            page = simpleMatch[3].trim();
                        } else {
                            name = power.split(' (')[0].trim();
                            book = undefined;
                            page = undefined;
                        }
                    }

                    // Create power object with additional properties
                    const powerObj: Power = { name, book, page };
                    if (Object.keys(properties).length > 0) {
                        Object.assign(powerObj, properties);
                    }
                    // Enhance power with damage information from damagePowers array
                    Savaged.enhancePowerWithDamageInfo(powerObj);
                    character.powers!.push(powerObj);
                });
                lineIndex = powersResult.endIndex;
                break;
            }
            lineIndex++;
        }

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
                //Debug.log(`Parsed toughness (text): ${character.toughness} (${character.armorValue})`);
            } else if (!character.toughness) {
                // Fallback for toughness without armor
                const toughnessNoArmorMatch = line.match(/(^|\s)Toughness:\s*(\d+)/i);
                if (toughnessNoArmorMatch) {
                    character.toughness = parseInt(toughnessNoArmorMatch[2]);
                    //Debug.log(`Parsed toughness (text, no armor): ${character.toughness}`);
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

        // Armor - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Armor:\s*(.*)$/i)) {
                // Use new extraction function to get all armor content
                const armorResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                const armorStr = armorResult.content.replace(/^Armor:\s*/i, '').trim();
                character.armor = [];
                armorStr.split(', ').forEach(a => {
                    const match = a.trim().match(/^(.+?)\s*\(Armor\s*(\d+)\)$/);
                    if (match) {
                        character.armor!.push({ name: match[1].trim(), value: parseInt(match[2]) });
                    }
                });
                lineIndex = armorResult.endIndex;
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
                const edgesResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                let edgesStr = edgesResult.content.replace(/^Edges:\s*/i, '').trim();
                // Remove dashes from edges string
                edgesStr = Util.removeDashes(edgesStr);
                character.edges = splitIgnoringParentheses(edgesStr, ', ');
                lineIndex = edgesResult.endIndex;
                if (!character.arcaneBackground && !character.arcaneSkill) {
                    const arcback = this.findAndRemoveLineStartingWith(character.edges ? character.edges : [], 'arcane background')
                    if (arcback.length > 0) {
                        Debug.log(`Found Arcane Background in edges: "${arcback}"`);
                        character.setArcaneBackground(arcback);
                    }
                }
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
                const hindrancesResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                let hindrancesStr = hindrancesResult.content.replace(/^Hindrances:\s*/i, '').trim();
                hindrancesStr = Util.removeDashes(hindrancesStr);
                character.hindrances = splitIgnoringParentheses(hindrancesStr, ', ');
                lineIndex = hindrancesResult.endIndex;
                break;
            }
            lineIndex++;
        }


        // Vehicles - find Vehicles: line and collect until next section
        let vehiclesStart = false;
        let vehiclesStr = '';
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Vehicles:?/i)) {
                vehiclesStart = true;
                vehiclesStr = line.replace(/^Vehicles:?\s*/i, '').trim();
                lineIndex++;
                continue;
            }
            if (vehiclesStart) {
                if (line.match(Savaged.sectionHeadersRegEx)) {
                    break;
                } else {
                    vehiclesStr += '\n' + line;
                }
                lineIndex++;
            } else {
                lineIndex++;
            }
        }
        vehiclesStr = vehiclesStr.replace(/\((\d)\-(\d)\)/g, '[$1-$2]');
        if (vehiclesStr) {
            // Split vehicles by newlines and process each line
            const vehicleLines = vehiclesStr.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            Debug.log(`Found ${vehicleLines.length} vehicle lines to process`);

            character.vehicles = [];
            let currentVehicleLine = '';
            let inVehicle = false;
            let currentVehicle: Vehicle | null = null;

            vehicleLines.forEach((line, index) => {
                Debug.log(`Processing vehicle line ${index + 1}: "${line}"`);

                if (inVehicle) {
                    currentVehicleLine += ' ' + line;
                    if (line.includes(')')) {
                        // parse the accumulated line
                        const fullLine = currentVehicleLine;
                        const nameMatch = fullLine.match(/^(.*)\(/);
                        let vehicleName = '';
                        let detailsStr = '';

                        if (nameMatch) {
                            vehicleName = nameMatch[1].trim();
                            const detailsMatch = fullLine.match(/\(([^)]+)\)$/);
                            if (detailsMatch) {
                                detailsStr = detailsMatch[1].trim();
                            }
                        }

                        if (vehicleName && detailsStr) {
                            currentVehicle = {
                                name: vehicleName
                            };

                            const detailParts = detailsStr.split('; ');
                            detailParts.forEach(p => {
                                p = p.trim();
                                const [key, value] = p.split(': ');
                                if (key && value) {
                                    const normalizedKey = key.toLowerCase();
                                    if (normalizedKey === 'size') {
                                        currentVehicle!.size = value;
                                    } else if (normalizedKey === 'handling') {
                                        currentVehicle!.handling = value;
                                    } else if (normalizedKey === 'toughness') {
                                        currentVehicle!.toughness = value;
                                    } else if (normalizedKey === 'pace') {
                                        currentVehicle!.pace = value;
                                    } else if (normalizedKey === 'running die') {
                                        currentVehicle!.runningDie = value;
                                    } else if (normalizedKey === 'top speed') {
                                        currentVehicle!.topSpeed = value;
                                    } else if (normalizedKey === 'notes') {
                                        currentVehicle!.notes = value;
                                    }
                                }
                            });

                            character.vehicles!.push(currentVehicle);
                            Debug.log(`  Created vehicle: ${JSON.stringify(currentVehicle)}`);
                        }

                        inVehicle = false;
                        currentVehicleLine = '';
                    }
                } else if (line.includes('(') && !line.includes(')')) {
                    currentVehicleLine = line;
                    inVehicle = true;
                } else if (line.includes('(') && line.includes(')')) {
                    const nameMatch = line.match(/^(.*?)\(/);
                    let vehicleName = '';
                    let detailsStr = '';

                    if (nameMatch) {
                        vehicleName = nameMatch[1].trim();
                        const detailsMatch = line.match(/\((.*)\)\s*$/);
                        if (detailsMatch) {
                            detailsStr = detailsMatch[1].trim();
                        }
                    }

                    if (vehicleName && detailsStr) {
                        currentVehicle = {
                            name: vehicleName
                        };

                        const detailParts = detailsStr.split('; ');
                        detailParts.forEach(p => {
                            p = p.trim();
                            const [key, value] = p.split(': ');
                            if (key && value) {
                                const normalizedKey = key.toLowerCase();
                                if (normalizedKey === 'size') {
                                    currentVehicle!.size = value;
                                } else if (normalizedKey === 'handling') {
                                    currentVehicle!.handling = value;
                                } else if (normalizedKey === 'toughness') {
                                    currentVehicle!.toughness = value;
                                } else if (normalizedKey === 'pace') {
                                    currentVehicle!.pace = value;
                                } else if (normalizedKey === 'running die') {
                                    currentVehicle!.runningDie = value;
                                } else if (normalizedKey === 'top speed') {
                                    currentVehicle!.topSpeed = value;
                                } else if (normalizedKey === 'notes') {
                                    currentVehicle!.notes = value;
                                }
                            }
                        });

                        character.vehicles!.push(currentVehicle);
                        Debug.log(`  Created vehicle: ${JSON.stringify(currentVehicle)}`);
                    }
                } else if (line.startsWith('Contains:')) {
                    const containsStr = line.replace(/^Contains:\s*/i, '').trim();
                    if (currentVehicle && containsStr) {
                        currentVehicle.contains = containsStr.split(', ').map(item => item.trim());
                        Debug.log(`  Added contains to vehicle: ${JSON.stringify(currentVehicle.contains)}`);
                    }
                }
            });
        }

        // Gear - using new extraction function
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Gear:/i)) {
                // Use new extraction function to get all gear content
                const gearResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                let gearContent = gearResult.content.replace(/^Gear:\s*/i, '').trim();
                // Remove dashes from gear content
                gearContent = Util.removeDashes(gearContent);
                // Add vehicle contains to gearContent
                if (character.vehicles) {
                    const vehicleContains: string[] = [];
                    character.vehicles.forEach(vehicle => {
                        if (vehicle.contains) {
                            vehicleContains.push(...vehicle.contains);
                        }
                    });
                    if (vehicleContains.length > 0) {
                        gearContent += ', ' + vehicleContains.join(', ');
                    }
                }
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
                            const isSectionHeader = trimmedItem.match(Savaged.sectionHeadersRegEx ||
                                trimmedItem.match(/^(Strength|Agility|Smarts|Spirit|Vigor):/i));

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

        // Cybertech - process like gear in text parser
        lineIndex = 0;
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Cybertech:/i)) {
                // Use new extraction function to get all cybertech content
                const cybertechResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                let cybertechContent = cybertechResult.content.replace(/^Cybertech:\s*/i, '').trim();
                // Remove dashes from cybertech content
                cybertechContent = Util.removeDashes(cybertechContent);
                lineIndex = cybertechResult.endIndex;

                // Process cybertech items and add to gear array
                if (cybertechContent) {
                    // Split cybertech by commas first to process individual items
                    const potentialCybertechItems = splitIgnoringParentheses(cybertechContent, ', ');

                    // Initialize gear array if it doesn't exist
                    if (!character.gear) character.gear = [];

                    potentialCybertechItems.forEach(item => {
                        const trimmedItem = item.trim();
                        if (!trimmedItem) return;

                        // Check if this looks like a weapon pattern
                        const weaponFromCybertech = parseWeaponFromGearItem(trimmedItem, character);

                        if (weaponFromCybertech) {
                            // This is a weapon, add to weapons array
                            if (!character.weapons) character.weapons = [];
                            character.weapons.push(weaponFromCybertech);
                            Debug.log(`Extracted weapon from cybertech: ${weaponFromCybertech.name} -> damage: ${weaponFromCybertech.damage}, range: ${weaponFromCybertech.range}, ap: ${weaponFromCybertech.ap}`);
                        } else {
                            // Check if this looks like an edge list entry (common edge names)
                            const commonEdgeNames = ['Level Headed', 'Luck', 'Great Luck', 'Frenzy', 'Dodge', 'Combo', 'Improved', 'Alertness', 'Ambidextrous', 'Arcane', 'Artificer', 'Assassin', 'Berserker', 'Better', 'Quick', 'Marksman', 'Giant', 'McGyver', 'Muscle', 'Nerves', 'Rocket', 'Steely', 'Trademark'];
                            const isEdgeItem = commonEdgeNames.some(edge =>
                                trimmedItem.toLowerCase().includes(edge.toLowerCase())
                            );

                            // Check if this looks like a section header that shouldn't be in cybertech
                            const isSectionHeader = trimmedItem.match(Savaged.sectionHeadersRegEx ||
                                trimmedItem.match(/^(Strength|Agility|Smarts|Spirit|Vigor):/i));

                            if (isEdgeItem || isSectionHeader) {
                                // Skip items that are clearly edges or section headers
                                Debug.log(`Skipping non-cybertech item: "${trimmedItem}"`);
                            } else {
                                // This appears to be legitimate cybertech - add to gear array
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
            const trimmedItem = gearItem.replace(/\((\d)\-(\d)\)/g, '[$1-$2]').trim();

            // NEW: Improved weapon pattern that handles nested parentheses and complex descriptions
            // This pattern looks for the last opening parenthesis that starts weapon details
            // and handles cases like "shock truncheon with 1 battery (Str+d6: Knockdown, Parry)"
            let weaponName = '';
            let detailsStr = '';

            // Find the last opening parenthesis that contains weapon-like details
            const lastParenIndex = trimmedItem.lastIndexOf('(');
            if (lastParenIndex !== -1) {
                // Extract everything before the last parenthesis as weapon name
                weaponName = trimmedItem.substring(0, lastParenIndex).trim();

                // Extract everything from the last parenthesis to the end
                const detailsWithParens = trimmedItem.substring(lastParenIndex).trim();

                // Remove the outer parentheses
                if (detailsWithParens.startsWith('(') && detailsWithParens.endsWith(')')) {
                    detailsStr = detailsWithParens.substring(1, detailsWithParens.length - 1).trim();
                } else if (detailsWithParens.startsWith('(')) {
                    // Handle cases where there's no closing parenthesis (malformed)
                    detailsStr = detailsWithParens.substring(1).trim();
                } else {
                    // No parentheses found, try alternative parsing
                    detailsStr = '';
                }
            }

            // If no parentheses found, try alternative parsing for weapons without parentheses
            if (!detailsStr) {
                // Look for weapons with properties separated by commas
                const commaIndex = trimmedItem.lastIndexOf(',');
                if (commaIndex !== -1) {
                    weaponName = trimmedItem.substring(0, commaIndex).trim();
                    detailsStr = trimmedItem.substring(commaIndex + 1).trim();
                } else {
                    // Doesn't look like a weapon with details
                    return null;
                }
            }

            // Clean up weapon name by removing quantity indicators like "2x"
            weaponName = weaponName.replace(/^\d+x\s*/i, '').trim();

            // NEW: Handle weapon names with colons (e.g., "shock truncheon with 1 battery: some description")
            const colonIndex = weaponName.indexOf(':');
            if (colonIndex !== -1) {
                weaponName = weaponName.substring(0, colonIndex).trim();
            }

            // Parse the details to extract weapon information
            // NEW: Handle details with colons and semicolons like "Range 12/24/48; Damage 2d6+1, RoF 1"
            const detailParts = [];
            let currentPart = '';
            let inParentheses = 0;

            // Custom parser to handle nested parentheses, colons, and semicolons
            for (let i = 0; i < detailsStr.length; i++) {
                const char = detailsStr[i];

                if (char === '(') {
                    inParentheses++;
                    currentPart += char;
                } else if (char === ')') {
                    inParentheses--;
                    currentPart += char;
                } else if ((char === ',' || char === ';') && inParentheses === 0) {
                    // Split on both commas and semicolons that are not inside parentheses
                    if (currentPart.trim()) {
                        detailParts.push(currentPart.trim());
                    }
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            }

            // Add the last part
            if (currentPart.trim()) {
                detailParts.push(currentPart.trim());
            }

            const detailMap: Record<string, string> = {};

            detailParts.forEach(part => {
                // Skip empty parts
                if (!part || part.trim() === '') return;

                // NEW: Handle parts with colons like "Range: 12/24/48" or "Damage: 2d6+1"
                if (part.includes(':')) {
                    // Look for the first colon that's not inside parentheses
                    let firstColonIndex = -1;
                    let parenDepth = 0;

                    for (let i = 0; i < part.length; i++) {
                        if (part[i] === '(') {
                            parenDepth++;
                        } else if (part[i] === ')') {
                            parenDepth--;
                        } else if (part[i] === ':' && parenDepth === 0) {
                            firstColonIndex = i;
                            break;
                        }
                    }

                    if (firstColonIndex !== -1) {
                        const key = part.substring(0, firstColonIndex).trim().toLowerCase();
                        const value = part.substring(firstColonIndex + 1).trim();
                        detailMap[key] = value;

                        // Also check if the key part contains damage information
                        const keyPart = part.substring(0, firstColonIndex).trim();
                        if (keyPart.match(/^(str)\s*[\+\-]?\s*d\d+[\+\-]?\d*$/i) ||
                            keyPart.match(/^\d*d\d+[\+\-]?\d*$/i) ||
                            keyPart === 'Str') {
                            detailMap['damage'] = keyPart;
                        }
                    }
                }
                // Handle space-separated parts like "Range 12/24/48" or "Damage 2d6+1"
                else if (part.includes(' ')) {
                    // Check if this is a damage pattern first
                    const isDamagePattern =
                        part.match(/^\d*d\d+[\+\-]?\d*$/i) || // 2d6, d8+2, etc.
                        part.match(/^(str)\s*[\+\-]?\s*d\d+[\+\-]?\d*/i) || // Str+d6, etc.
                        part.match(/^(str)$/i); // Just "Str" alone

                    if (isDamagePattern) {
                        detailMap['damage'] = part;
                    }
                    // Handle standard key-value pairs
                    else {
                        const spaceIndex = part.indexOf(' ');
                        const key = part.substring(0, spaceIndex).toLowerCase();
                        const value = part.substring(spaceIndex + 1).trim();

                        if (key === 'range' || key === 'reach' || key === 'ap' || key === 'rof' || key === 'shots') {
                            detailMap[key] = value;
                        } else if (value === 'melee' || value === 'ranged') {
                            detailMap['range'] = value;
                        } else {
                            // Handle cases like "AP 1" where key is "AP" and value is "1"
                            detailMap[key] = value;
                        }
                    }
                }
                // Handle single word parts
                else {
                    const isDamagePattern =
                        part.match(/^\d*d\d+[\+\-]?\d*$/i) || // 2d6, d8+2, etc.
                        part.match(/^(str)\s*[\+\-]?\s*d\d+[\+\-]?\d*/i) || // Str+d6, etc.
                        part.match(/^(str)$/i); // Just "Str" alone

                    if (isDamagePattern) {
                        detailMap['damage'] = part;
                    } else if (part.match(/^[-+]\d+\s+Parry$/i)) {
                        // Format: "+1 Parry" or "-1 Parry"
                        const value = part.replace(/parry/i, '').trim();
                        detailMap['parry'] = value;
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
                const damagePattern = /(?:^|\s)(str)\s*[\+\-]?\s*d\d+[\+\-]?\d*|(?:^|\s)\d*d\d+[\+\-]?\d*(?:$|\s)/i;
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

                const strDie = character.getAttributeDie('strength');
                Debug.log(`Gear weapon damage parsing - Original: "${damage}", Str die: "${strDie}"`);

                // Handle complex damage patterns like "(1-3)d6" first
                const complexDamageMatch = damage.match(/\[(\d+)-(\d+)\](d\d+)/i);

                if (complexDamageMatch) {
                    // const minDice = parseInt(complexDamageMatch[1]);
                    const maxDice = parseInt(complexDamageMatch[2]);
                    const dieType = complexDamageMatch[3];
                    //const avgDice = Math.ceil((minDice + maxDice) / 2);
                    damage = `${maxDice}${dieType}`;
                    Debug.log(`Complex damage pattern converted: "${complexDamageMatch[0]}" -> "${damage}"`);
                }

                // Handle standalone attribute references (like "Str" alone)
                damage = damage.replace(/\bStr\b(?!\s*[+-]?\s*d\d+)/gi, strDie);

                // Handle attributes followed by dice notation
                damage = damage.replace(/\bStr\b(?=\s*[+-]?\s*d\d+)/gi, strDie);

                Debug.log(`Gear weapon damage parsing - After substitution: "${damage}"`);
                weapon.damage = damage;
            }

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
                weapon.attack = character.getSkillDie('fighting');
            } else if (isMelee && !isThrown) {
                weapon.attack = character.getSkillDie('fighting');
            } else if (isThrown) {
                if (isOnlyThrown) {
                    weapon.attack = character.getSkillDie('athletics');
                } else {
                    weapon.attack = character.getSkillDie('fighting');
                    weapon.thrownAttack = character.getSkillDie('athletics');
                }
            } else if (isShooting) {
                weapon.attack = character.getSkillDie('shooting');
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

            //Debug.log(`Parsed weapon from gear: ${weapon.name} -> attack: ${weapon.attack}, damage: ${weapon.damage}, range: ${weapon.range}`);
            return weapon;
        }

        // Languages - using new extraction function
        lineIndex = 0;
        character.languages = [];
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Languages:\s*(.*)$/i)) {
                // Use new extraction function to get all languages content
                const languagesResult = extractSectionContent(lines, lineIndex, Savaged.sectionHeaders);
                const languagesStr = languagesResult.content.replace(/^Languages:\s*/i, '').trim();
                character.languages = languagesStr.split(', ').map(l => l.trim());
                lineIndex = languagesResult.endIndex;
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

        // Special Abilities - using extractSpecialAbilityContent function
        character.specialAbilities = [];
        lineIndex = 0;

        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            if (line.match(/^Special Abilities/i)) {
                lineIndex++;
                // Process special abilities using the dedicated function
                while (lineIndex < lines.length) {
                    const currentLine = lines[lineIndex].trim();
                    if (!currentLine) {
                        lineIndex++;
                        continue;
                    }

                    // Check if this line starts a new ability or is a section header
                    const isNewAbility = currentLine.match(/^[•\-*]\s/) ||
                        (currentLine.match(/^[A-Z]/) && currentLine.includes(':'));
                    const isSectionHeader = currentLine.match(Savaged.sectionHeadersRegEx);

                    if (isSectionHeader && isSectionHeader[0].toLowerCase() != 'armor' && isSectionHeader[0].toLowerCase() != 'armour') { //Armor could be a section header but also, could be in special abilites, so exclude it here.
                        break; // Stop at next section
                    }

                    if (isNewAbility) {
                        // Extract this special ability using the dedicated function
                        const abilityResult = extractSpecialAbilityContent(lines, lineIndex, Savaged.sectionHeaders);
                        if (abilityResult.content.trim()) {
                            character.specialAbilities.push(abilityResult.content.trim());
                        }
                        lineIndex = abilityResult.endIndex;
                    } else {
                        lineIndex++;
                    }
                }
                break;
            } else {
                lineIndex++;
            }
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
            const armorPattern = /^armou?r \+?\s*(\d+)/i;
            const sizePattern = /^size \+?\s*(\d+)/i;
            const weaponsFromSpecialAbilities: Weapon[] = [];
            const powersFromSpecialAbilities: Power[] = [];

            // Process special abilities in reverse order to avoid index issues when removing
            for (let i = character.specialAbilities.length - 1; i >= 0; i--) {
                const ability = character.specialAbilities[i];
                const match = ability.match(attackPattern);
                if (match) {
                    const weaponName = match[1].trim().toLowerCase();
                    let damageStr = match[2].trim();

                    const armormatch = weaponName.match(armorPattern);
                    const sizematch = weaponName.match(sizePattern);

                    // More precise detection: must be a known weapon attack name
                    const isWeaponAttackName = Savaged.weaponAttackNames.some(name => weaponName.includes(name));

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
                        const strDie = character.getAttributeDie('strength');
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
                    } else if (weaponName.endsWith('powers')) {
                        const powersStr = this.replaceCharInParens(match[2], ',', ';');
                        powersStr.split(', ').forEach(power => {
                            let name: string, book: string | undefined, page: string | undefined;
                            let properties: Record<string, string> = {};
                            const simpleMatch = power.trim().match(/(.*?) \((.*?)\)/);
                            book = undefined
                            page = undefined
                            if (simpleMatch) {
                                name = simpleMatch[1].trim();
                                //handle props
                            } else {
                                name = power.split(' (')[0].trim();
                            }
                            // Create power object with additional properties
                            const powerObj: Power = { name, book, page };
                            if (Object.keys(properties).length > 0) {
                                Object.assign(powerObj, properties);
                            }
                            // Enhance power with damage information from damagePowers array
                            Savaged.enhancePowerWithDamageInfo(powerObj);
                            powersFromSpecialAbilities.push(powerObj);
                        });
                        character.specialAbilities?.splice(i, 1);
                    } else if (armormatch) {
                        let armorObj = new Armor();
                        armorObj.name = match[2].trim();
                        armorObj.value = parseInt(armormatch[1]);
                        if (!character.armor) {
                            character.armor = [];
                        }
                        character.armor.push(armorObj);
                        character.specialAbilities?.splice(i, 1);
                    } else if (sizematch) {
                        character.size = Number(sizematch[1]);
                        character.specialAbilities?.splice(i, 1);
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

            if (powersFromSpecialAbilities.length > 0) {
                if (!character.powers) {
                    character.powers = [];
                }
                character.powers.push(...powersFromSpecialAbilities);
            }
        }
        // Add default unskilled roll
        character.skills.push({ name: 'unskilled', die: 'd4-2' });

        Debug.log('Character parsed successfully', character);
        return character;
    }

    static replaceCharInParens(str: string, find: string, replace: string) {
        let result = '';
        let depth = 0;
        for (let char of str) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === find && depth > 0) char = replace;
            result += char;
        }
        return result;
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
                            extractedText += ' [' + el.textContent + ']';
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
                type: htmlCharacter.type === textCharacter.type,
                gender: htmlCharacter.gender === textCharacter.gender,
                profession: htmlCharacter.profession === textCharacter.profession,
                background: htmlCharacter.background === textCharacter.background,
                experience: htmlCharacter.experience === textCharacter.experience,
                bennies: htmlCharacter.bennies === textCharacter.bennies,
                pace: htmlCharacter.pace === textCharacter.pace,
                parry: htmlCharacter.parry === textCharacter.parry,
                toughness: htmlCharacter.toughness === textCharacter.toughness,
                armorValue: htmlCharacter.armorValue === textCharacter.armorValue,
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
                wealth: htmlCharacter.wealth === textCharacter.wealth,
                arcaneBackground: htmlCharacter.arcaneBackground === textCharacter.arcaneBackground,
                arcaneSkill: htmlCharacter.arcaneSkill === textCharacter.arcaneSkill,
                powerPoints: htmlCharacter.powerPoints === textCharacter.powerPoints,
                powers: JSON.stringify(htmlCharacter.powers) === JSON.stringify(textCharacter.powers),
                powersCount: (htmlCharacter.powers?.length || 0) === (textCharacter.powers?.length || 0),
                specialAbilities: JSON.stringify(htmlCharacter.specialAbilities) === JSON.stringify(textCharacter.specialAbilities),
                specialAbilitiesCount: (htmlCharacter.specialAbilities?.length || 0) === (textCharacter.specialAbilities?.length || 0),
                advances: JSON.stringify(htmlCharacter.advances) === JSON.stringify(textCharacter.advances),
                advancesCount: (htmlCharacter.advances?.length || 0) === (textCharacter.advances?.length || 0),
                isWildCard: htmlCharacter.isWildCard === textCharacter.isWildCard,
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
}
