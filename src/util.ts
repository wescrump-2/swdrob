
export class Util {
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

    static readonly BUTTON_CLASS = 'btn';
    static readonly SUCCESS_CLASS = 'btn-success';
    static readonly SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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
    static setImage(imageKey: string, svg: SVGElement, css:string) {
        const svgButtons = document.getElementById('buttons-svg') as HTMLObjectElement;
        if (svgButtons.contentDocument) {
            const svgDocument = svgButtons.contentDocument.documentElement as unknown as SVGSVGElement;
            const path = svgDocument.querySelector(`#${imageKey}`) as SVGElement;
           
            if (path) { 
                let vbpath = path.getAttribute("viewbox")
                if (!vbpath) 
                    vbpath='0 0 512 512'
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
    private static sizePixels(css:string): string {
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
        return  computedWidth 
    }
}