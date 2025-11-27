import OBR from "@owlbear-rodeo/sdk";

export class Util {
    static ID = "com.wescrump.dice-roller";
    static DiceHistoryMkey = `${Util.ID}/rollHistory`;
    static PlayerHistoryMkey = `${Util.ID}/player/rollHistory`;

    static readonly BUTTON_CLASS = 'btn';
    static readonly ACTIVE_CLASS = 'active';
    static readonly SVG_NAMESPACE = "http://www.w3.org/2000/svg";


    static hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    static rgbToHex(r: number, g: number, b: number): string {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    static getMidpointColor(color1: string, color2: string): string {
        const rgb1 = Util.hexToRgb(color1);
        const rgb2 = Util.hexToRgb(color2);

        // Calculate midpoint for each component
        const r = Math.round((rgb1.r + rgb2.r) / 2);
        const g = Math.round((rgb1.g + rgb2.g) / 2);
        const b = Math.round((rgb1.b + rgb2.b) / 2);

        return Util.rgbToHex(r, g, b);
    }


    static getContrast(hexColor: string) {
        hexColor = hexColor.replace(/^#/, '');
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }
        let r = parseInt(hexColor.slice(0, 2), 16);
        let g = parseInt(hexColor.slice(2, 4), 16);
        let b = parseInt(hexColor.slice(4, 6), 16);
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
        let complementaryHex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        return '#' + complementaryHex;
    }

    static getOptimalTextColor(hexColor: string): string {
        const rgb = Util.hexToRgb(hexColor);
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    static randomizeHue(hexColor: string): string {
        // Convert hex to RGB
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);

        // Convert RGB to HSL
        r /= 255;
        g /= 255;
        b /= 255;

        const cmax = Math.max(r, g, b), cmin = Math.min(r, g, b);
        let h = 0, s = 0, l = (cmax + cmin) / 2;
        const delta = cmax - cmin;

        if (delta === 0) {
            h = 0;
        } else {
            switch (cmax) {
                case r: h = ((g - b) / delta) % 6; break;
                case g: h = ((b - r) / delta) + 2; break;
                case b: h = ((r - g) / delta) + 4; break;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Randomly change hue
        h = (h + Math.random() * 60 - 30 + 360) % 360;  // Random change within -30 to +30 degrees

        // Convert HSL back to RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r1 = 0, g1 = 0, b1 = 0;

        if (0 <= h && h < 60) {
            [r1, g1, b1] = [c, x, 0];
        } else if (60 <= h && h < 120) {
            [r1, g1, b1] = [x, c, 0];
        } else if (120 <= h && h < 180) {
            [r1, g1, b1] = [0, c, x];
        } else if (180 <= h && h < 240) {
            [r1, g1, b1] = [0, x, c];
        } else if (240 <= h && h < 300) {
            [r1, g1, b1] = [x, 0, c];
        } else {
            [r1, g1, b1] = [c, 0, x];
        }

        r = Math.round((r1 + m) * 255);
        g = Math.round((g1 + m) * 255);
        b = Math.round((b1 + m) * 255);

        // Convert back to hex
        const toHex = (x: number) => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }


    static randomizeSaturation(hexColor: string): string {
        // Convert hex to RGB
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);

        // Convert RGB to HSL
        r /= 255;
        g /= 255;
        b /= 255;

        const cmax = Math.max(r, g, b), cmin = Math.min(r, g, b);
        let h = 0, s = 0, l = (cmax + cmin) / 2;
        const delta = cmax - cmin;

        if (delta === 0) {
            h = 0;
        } else {
            switch (cmax) {
                case r: h = ((g - b) / delta) % 6; break;
                case g: h = ((b - r) / delta) + 2; break;
                case b: h = ((r - g) / delta) + 4; break;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Randomly change saturation
        // Here we're adjusting saturation by up to 50% in either direction
        s = Math.max(0, Math.min(1, s + (Math.random() - 0.5) * 0.5));

        // Convert HSL back to RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r1 = 0, g1 = 0, b1 = 0;

        if (0 <= h && h < 60) {
            [r1, g1, b1] = [c, x, 0];
        } else if (60 <= h && h < 120) {
            [r1, g1, b1] = [x, c, 0];
        } else if (120 <= h && h < 180) {
            [r1, g1, b1] = [0, c, x];
        } else if (180 <= h && h < 240) {
            [r1, g1, b1] = [0, x, c];
        } else if (240 <= h && h < 300) {
            [r1, g1, b1] = [x, 0, c];
        } else {
            [r1, g1, b1] = [c, 0, x];
        }

        r = Math.round((r1 + m) * 255);
        g = Math.round((g1 + m) * 255);
        b = Math.round((b1 + m) * 255);

        // Convert back to hex
        const toHex = (x: number) => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    static generateColorCodes(): string[] {
        // Primary colors
        const primaryColors: { [key: string]: string } = {
            'Red': '#FF0000',
            'Blue': '#0000FF',
            'Yellow': '#FFFF00'
        };

        // Secondary colors (mix of two primary colors)
        const secondaryColors: { [key: string]: string } = {
            'Green': '#00FF00', // Blue + Yellow
            'Purple': '#800080', // Red + Blue
            'Orange': '#FFA500'  // Red + Yellow
        };

        // Tertiary colors (mix of one primary and one secondary color)
        const tertiaryColors: { [key: string]: string } = {
            'Red-Orange': '#FF4500',  // Red + Orange
            'Yellow-Orange': '#FF8C00', // Yellow + Orange
            'Yellow-Green': '#9ACD32',  // Yellow + Green
            'Blue-Green': '#008080',    // Blue + Green
            'Blue-Purple': '#4B0082',   // Blue + Purple
            'Red-Purple': '#8B008B'     // Red + Purple
        };

        // Quadiary colors (mix of various colors, examples)
        const quadiaryColors: { [key: string]: string } = {
            'Teal': '#008080',       // Often considered a mix of blue and green
            'Magenta': '#FF00FF',    // Red + Blue (but more vibrant than purple)
            'Chartreuse': '#7FFF00', // Yellow + Green
            'Maroon': '#800000',     // A dark red, could be seen as red mixed with black/brown
            'Turquoise': '#40E0D0'   // Blue + Green with a slight shift towards green
        };

        // Additional colors
        const additionalColors: { [key: string]: string } = {
            'Black': '#000000',
            'Grey': '#808080',  // This is a medium grey, can be adjusted for lighter or darker shades
            'White': '#FFFFFF',
            'Brown': '#A52A2A'   // This is 'SaddleBrown', one of many shades of brown
        };

        // Combine all color categories into one object
        const allColors = {
            ...primaryColors,
            ...secondaryColors,
            ...tertiaryColors,
            ...quadiaryColors,
            ...additionalColors
        };

        // Convert the object to an array of just the hex values
        return Object.values(allColors);
    }

    static generateRainbowColors(numberOfColors: number): string[] {
        const colors: string[] = [];

        // Helper function to convert HSL to Hex
        const hslToHex = (h: number, s: number, l: number): string => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = (n: number) => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        };

        // Calculate steps for hue, saturation, and lightness
        const hueSteps = 360 / (numberOfColors - 2); // Excluding black and white
        const saturationSteps = 100 / (Math.floor((numberOfColors - 2) / 2)); // Half for increase, half for decrease
        //let saturationDirection = 1; // 1 for increase, -1 for decrease

        for (let i = 0; i < numberOfColors; i++) {
            if (i === 0) {
                // Black
                colors.push('#000000');
            } else if (i === numberOfColors - 1) {
                // White
                colors.push('#FFFFFF');
            } else {
                const hue = i * hueSteps;
                let saturation = Math.min(100, i * saturationSteps);
                let lightness = 50; // Full saturation at 50% lightness

                // If we've passed the midpoint, decrease saturation and increase lightness
                if (i >= Math.floor((numberOfColors - 2) / 2)) {
                    saturation = 100 - ((i - Math.floor((numberOfColors - 2) / 2)) * saturationSteps);
                    lightness = 50 + ((i - Math.floor((numberOfColors - 2) / 2)) * 50 / Math.ceil((numberOfColors - 2) / 2));
                }

                colors.push(hslToHex(hue, saturation, lightness));
            }
        }

        return colors;
    }


    /**
     * Creates a button with specified properties.
     * @param id - The id for the button.
     * @param title - The title/tooltip for the button.
     * @param imageKey - The key to find the appropriate SVG icon.
     * @param uuid - A unique identifier for the button.
     * @returns A newly created HTMLButtonElement.
     */
    static getButton(id: string, title: string, imageKey: string, uuid: string): HTMLButtonElement {
        const button = document.createElement('button') as HTMLButtonElement;
        button.id = id;
        button.title = title;
        button.classList.add(Util.BUTTON_CLASS);
        button.dataset.pid = uuid; // Use dataset for custom attributes
        const svg = button.querySelector(`svg`) as SVGElement;
        Util.setImage(imageKey, svg, '--button-size');
        return button;
    }

    /**
     * Sets or updates the SVG image of the button.
     * @param imageKey - The class name to match the SVG path within the SVG document.
     * @param button - The button element to set the image on.
     */
    static setImage(imageKey: string, svg: SVGElement, css: string) {
        const svgButtons = document.getElementById('buttons-svg') as HTMLObjectElement;
        if (svgButtons.contentDocument) {
            const svgDocument = svgButtons.contentDocument.documentElement as unknown as SVGSVGElement;
            const path = svgDocument.querySelector(`#${imageKey}`) as SVGElement;

            if (path) {
                let vbpath = path.getAttribute("viewbox")
                if (!vbpath)
                    vbpath = '0 0 512 512'
                svg.setAttribute('viewBox', vbpath)
                svg.innerHTML = path.outerHTML
                svg.setAttribute('width', Util.sizePixels(css))
                svg.setAttribute('height', Util.sizePixels(css))
            }
        }
    }

    /**
     * Gets the button size from CSS custom properties.
     * @returns The size of the button as a string.
     */
    private static sizePixels(css: string): string {
        return Util.convertToPixels(getComputedStyle(document.documentElement).getPropertyValue(css).trim())
    }

    static convertToPixels(size: string): string {
        const div = document.createElement('div');
        div.style.width = size;
        div.style.visibility = "hidden"
        div.style.position = "absolute"
        document.body.appendChild(div)
        const computedWidth = window.getComputedStyle(div).width
        document.body.removeChild(div)
        return computedWidth
    }
}


export class Debug {
    private static _enabled = false;
    private static wasEnabled = false;

    static get enabled() {
        return this._enabled;
    }

    static updateFromPlayers(names: string[]) {
        const hasDebugPlayer = names.some(p =>
            p.toLowerCase().includes("debug")
        );

        if (hasDebugPlayer !== this._enabled) {
            this._enabled = hasDebugPlayer;

            if (hasDebugPlayer && !this.wasEnabled) {
                console.log(
                    "%cINITIATIVE DEBUG MODE ACTIVATED — 'debug' player in room.'",
                    "color: lime; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
                );
            }
            if (!hasDebugPlayer && this.wasEnabled) {
                console.log(
                    "%cINITIATIVE DEBUG MODE DEACTIVATED — no 'debug' player in room.",
                    "color: red; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
                );
            }
            this.wasEnabled = hasDebugPlayer;
        }
    }

    static log(...args: any[]) {
        if (this._enabled) console.log(...args);
    }

    static warn(...args: any[]) {
        if (this._enabled) console.warn(...args);
    }

    static error(...args: any[]) {
        if (this._enabled) console.error(...args);
    }
}// end Debug


// --- List ALL room metadata keys and their sizes ---
export async function dumpRoomMetadata() {
    const meta = await OBR.room.getMetadata();
    Debug.log("=== ROOM METADATA ===");
    for (const [key, value] of Object.entries(meta)) {
        const size = JSON.stringify(value).length;
        Debug.log(`${key}  →  ${size} bytes`, value);
    }
}

// --- List ALL extensions that have stored something on scene items ---
export async function findItemMetadataKeys() {
    const items = await OBR.scene.items.getItems();
    const keys = new Set();
    items.forEach(item => {
        if (item.metadata) {
            Object.keys(item.metadata).forEach(k => keys.add(k));
        }
    });
    Debug.log("=== METADATA KEYS FOUND ON SCENE ITEMS ===");
    Debug.log(Array.from(keys).sort());
}

/**
 * Improved cleanup: Deletes keys by setting them to null individually (reliable removal).
 * Retries on failure and checks total size to avoid 16 kB errors.
 */
export async function cleanupDeadExtensionMetadata() {
    try {
        const roomMetadata = await OBR.room.getMetadata();
        
        // Log current size for debugging
        const currentSize = new TextEncoder().encode(JSON.stringify(roomMetadata)).length;
        Debug.log(`Current room metadata size: ${currentSize} bytes`);

        if (currentSize > 16000) {  // Close to limit — abort to avoid write failure
            console.warn("Room metadata too large (>15 kB). Manual room reset needed.");
            return;
        }

        const keysToDelete: string[] = [];
        const activeIds: string[] = [
            "com.battle-system.mark/metadata_marks",
            "com.wescrump.dice-roller/player/rollHistory",
            // Add more prefixes here as needed
        ];

        // Find keys matching active (conflicting) prefixes
        for (const prefix of activeIds) {
            const matchingKey = Object.keys(roomMetadata).find(k => k.startsWith(prefix));
            if (matchingKey) {
                keysToDelete.push(matchingKey);
            }
        }

        if (keysToDelete.length === 0) {
            Debug.log("No conflicting keys found.");
            return;
        }

        Debug.log(`Found ${keysToDelete.length} conflicting keys:`, keysToDelete);

        // Delete each key individually by setting to null (reliable method)
        let successCount = 0;
        for (const key of keysToDelete) {
            try {
                await OBR.room.setMetadata({ [key]: null });  // Explicit null = delete
                successCount++;
                Debug.log(`Deleted key: ${key}`);
            } catch (deleteErr: unknown) {
                console.error(`Failed to delete ${key}:`, deleteErr);
                // Optional: Retry once after delay
                setTimeout(async () => {
                    try {
                        await OBR.room.setMetadata({ [key]: null });
                        Debug.log(`Retried and deleted: ${key}`);
                    } catch (retryErr) {
                        console.error(`Retry failed for ${key}:`, retryErr);
                    }
                }, 500);
            }
        }

        Debug.log(`Cleanup complete: ${successCount}/${keysToDelete.length} keys deleted.`);

        // Final size check
        const newMetadata = await OBR.room.getMetadata();
        const newSize = new TextEncoder().encode(JSON.stringify(newMetadata)).length;
        Debug.log(`New room metadata size: ${newSize} bytes (reduced by ${currentSize - newSize} bytes)`);

    } catch (err: unknown) {
        console.error("Overall cleanup failed (safe to ignore):", err);
    }
}