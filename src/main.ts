// @ts-ignore
import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/dice-box.es.min.js";
import OBR from "@owlbear-rodeo/sdk";
import * as pako from 'pako';

import { Util } from './util';
import { Savaged } from './savaged';
import { Debug } from './debug';
import { CalledShot, CONST, Cover, GangUp, getEnumKeys, Illumination, MultiAction, Range } from "./constants";
import './styles.css';
import { createContextMenu } from "./contextmenu";

function loadSVG(svgObjectId: string, svgPath: string): Promise<Document> {
    return new Promise((resolve, reject) => {
        const svgObject = document.getElementById(svgObjectId) as HTMLObjectElement;
        if (!svgObject) {
            reject(new Error(`SVG object with id ${svgObjectId} not found`));
            return;
        }

        // Add timeout for load failure detection
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('SVG load timeout'));
        }, 5000);

        const loadHandler = function () {
            try {
                const svgDoc = svgObject.contentDocument;
                if (svgDoc) {
                    cleanup();
                    resolve(svgDoc);
                } else {
                    cleanup();
                    reject(new Error('SVG contentDocument is null after load event'));
                }
            } catch (error) {
                cleanup();
                reject(new Error(`Error accessing SVG content: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };

        const errorHandler = function () {
            cleanup();
            reject(new Error('Failed to load SVG'));
        };

        const cleanup = function () {
            clearTimeout(timeoutId);
            svgObject.removeEventListener('load', loadHandler);
            svgObject.removeEventListener('error', errorHandler);
        };

        svgObject.addEventListener('load', loadHandler);
        svgObject.addEventListener('error', errorHandler);
        svgObject.data = svgPath;
    });
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
    loadSVG('buttons-svg', '/buttons.svg')
        .then(svgDoc => {
            initializeButtons(svgDoc);
            console.log('SVG loaded successfully');
        })
        .catch(error => {
            console.error('Error loading SVG:', error);
        });
});

function initializeButtons(svgDoc: Document) {
    if (svgDoc) {
        //set button images
        Util.setImage('skills', traitdice, '--button-size')
        Util.setImage('punch', damagedice, '--button-size')
        Util.setImage('dice-twenty', standarddice, '--button-size')
        Util.setImage('bullseye', targetNumberButton, '--button-size') //dice-target
        Util.setImage('round-knobs', modifierButton, '--button-size')
        Util.setImage('dice-fire', wildDieToggle, '--button-size')
        Util.setImage('punch-blast', bonusDamageToggle, '--button-size')
        Util.setImage('hammer-break', breakingObjectsToggle, '--button-size')
        Util.setImage('compete', opposedRollToggle, '--button-size')
        Util.setImage('jester-hat', jokerDrawnToggle, '--button-size')
        Util.setImage('settings-knobs', adjustButton, '--button-size')
        Util.setImage('rolling-dice', rollDiceButton, '--button-size')
        Util.setImage('clockwise', rerollDiceButton, '--button-size')
        Util.setImage('broom', removeDiceButton, '--button-size')

        Util.setImage('bleeding-wound', wound1Toggle, '--button-size')
        Util.setImage('bleeding-wound', wound2Toggle, '--button-size')
        Util.setImage('bleeding-wound', wound3Toggle, '--button-size')
        Util.setImage('tired-eye', fatigue1Toggle, '--button-size')
        Util.setImage('tired-eye', fatigue2Toggle, '--button-size')
        Util.setImage('light', illumToggle, '--button-size')
        Util.setImage('distracted', distractedToggle, '--button-size')
        Util.setImage('one_action', multiToggle, '--button-size')
        Util.setImage('wild_attack', wildAttackToggle, '--button-size')

        Util.setImage('called_shot', calledShotToggle, '--button-size')
        Util.setImage('no_cover', coverToggle, '--button-size')
        Util.setImage('short_range', rangeToggle, '--button-size')
        Util.setImage('the_drop', theDropToggle, '--button-size')
        Util.setImage('vulnerable', vulnerableToggle, '--button-size')
        Util.setImage('gang_up', gangUpToggle, '--button-size')

        Util.setImage('anticlockwise', resetButton, '--button-size')
        Util.setImage('shatter', colorButton, '--button-size')
        Util.setImage('trash-can', clearButton, '--button-size')
        Util.setImage('d4_fill', d4Button, '--die-size')
        Util.setImage('d6_fill', d6Button, '--die-size')
        Util.setImage('d8_fill', d8Button, '--die-size')
        Util.setImage('d10_fill', d10Button, '--die-size')
        Util.setImage('d12_fill', d12Button, '--die-size')
        Util.setImage('d20_fill', d20Button, '--die-size')
        Util.setImage('d100_fill', d100Button, '--die-size')
    } else {
        console.error("Failed to load SVG buttons")
    }
}

const radios = document.querySelectorAll('.custom-radio') as NodeListOf<SVGElement>;
const traitdice = document.getElementById('traitdice') as unknown as SVGElement;
const damagedice = document.getElementById('damagedice') as unknown as SVGElement;
const standarddice = document.getElementById('standarddice') as unknown as SVGElement;
const targetNumberButton = document.getElementById('targetNumberButton') as unknown as SVGElement;
const targetNumberSpinner = document.getElementById('targetNumber') as HTMLInputElement;
const targetCurrent = document.getElementById('curtarget') as HTMLDivElement;
const targetNumberRow = document.getElementById('targetNumberRow') as HTMLDivElement;
const modifierButton = document.getElementById('modifierButton') as unknown as SVGElement;
const modifierSpinner = document.getElementById('modifier') as HTMLInputElement;
const modifierCurrent = document.getElementById('curmodifier') as HTMLDivElement;
const modifierRow = document.getElementById('modifierRow') as HTMLDivElement;
const wildDieToggle = document.getElementById('wildDieToggle') as unknown as SVGElement;
const wildDieType = document.getElementById('wildDieType') as unknown as HTMLSelectElement;
const wildDieRow = document.getElementById('wildDieRow') as HTMLDivElement;
const bonusDamageToggle = document.getElementById('bonusDamageToggle') as unknown as SVGElement;
const breakingObjectsToggle = document.getElementById('breakingObjectsToggle') as unknown as SVGElement;

const opposedRollToggle = document.getElementById('opposedRollToggle') as unknown as SVGElement;
const jokerDrawnToggle = document.getElementById('jokerDrawnToggle') as unknown as SVGElement;
const adjustButton = document.getElementById('adjustButton') as unknown as SVGElement;

const wound1Toggle = document.getElementById('wound1Toggle') as unknown as SVGElement;
const wound2Toggle = document.getElementById('wound2Toggle') as unknown as SVGElement;
const wound3Toggle = document.getElementById('wound3Toggle') as unknown as SVGElement;

const fatigue1Toggle = document.getElementById('fatigue1Toggle') as unknown as SVGElement;
const fatigue2Toggle = document.getElementById('fatigue2Toggle') as unknown as SVGElement;
const illumToggle = document.getElementById('illumToggle') as unknown as SVGElement;

const distractedToggle = document.getElementById('distractedToggle') as unknown as SVGElement;
const multiToggle = document.getElementById('multiToggle') as unknown as SVGElement;
const wildAttackToggle = document.getElementById('wildAttackToggle') as unknown as SVGElement;

const calledShotToggle = document.getElementById('calledShotToggle') as unknown as SVGElement;
const coverToggle = document.getElementById('coverToggle') as unknown as SVGElement;
const rangeToggle = document.getElementById('rangeToggle') as unknown as SVGElement;
const theDropToggle = document.getElementById('theDropToggle') as unknown as SVGElement;
const vulnerableToggle = document.getElementById('vulnerableToggle') as unknown as SVGElement;
const gangUpToggle = document.getElementById('gangUpToggle') as unknown as SVGElement;

const removeDiceButton = document.getElementById('removeDiceButton') as unknown as SVGElement;
const rollDiceButton = document.getElementById('rollDiceButton') as unknown as SVGElement;
const rerollDiceButton = document.getElementById('rerollDiceButton') as unknown as SVGElement;
const resetButton = document.getElementById('resetButton') as unknown as SVGElement;
const colorButton = document.getElementById('colorButton') as unknown as SVGElement;
const clearButton = document.getElementById('clearButton') as unknown as SVGElement;
const d4Button = document.getElementById('d4Button') as unknown as SVGElement;
const d6Button = document.getElementById('d6Button') as unknown as SVGElement;
const d8Button = document.getElementById('d8Button') as unknown as SVGElement;
const d10Button = document.getElementById('d10Button') as unknown as SVGElement;
const d12Button = document.getElementById('d12Button') as unknown as SVGElement;
const d20Button = document.getElementById('d20Button') as unknown as SVGElement;
const d100Button = document.getElementById('d100Button') as unknown as SVGElement;

// Add null checks for critical elements
if (!traitdice || !damagedice || !standarddice || !targetNumberButton || !targetNumberSpinner ||
    !targetCurrent || !modifierButton || !modifierSpinner || !modifierCurrent || !wildDieToggle ||
    !wildDieType || !bonusDamageToggle || !breakingObjectsToggle || !opposedRollToggle ||
    !jokerDrawnToggle || !adjustButton || !rollDiceButton || !rerollDiceButton || !resetButton ||
    !removeDiceButton || !colorButton || !clearButton) {
    console.error('Critical DOM elements are missing');
    throw new Error('Required DOM elements not found');
}

//setup click handlers
setupRadio();
setupSliders();

setupSvgToggle(targetNumberButton);
setupSvgToggle(modifierButton);
setupSvgToggle(wildDieToggle);
setupSvgToggle(bonusDamageToggle);
setupSvgToggle(breakingObjectsToggle);
setupSvgToggle(opposedRollToggle);
setupSvgToggle(jokerDrawnToggle);
setupSvgToggle(adjustButton);

setupSvgToggle(wound1Toggle);
setupSvgToggle(wound2Toggle);
setupSvgToggle(wound3Toggle);

setupSvgToggle(fatigue1Toggle);
setupSvgToggle(fatigue2Toggle);
setupSvgToggle(illumToggle);

setupSvgToggle(distractedToggle);
setupSvgToggle(multiToggle);
setupSvgToggle(wildAttackToggle);

setupSvgToggle(calledShotToggle);
setupSvgToggle(coverToggle);
setupSvgToggle(rangeToggle);
setupSvgToggle(theDropToggle);
setupSvgToggle(vulnerableToggle);
setupSvgToggle(gangUpToggle);

setupSvgToggle(rollDiceButton);
setupSvgToggle(rerollDiceButton);
setupSvgToggle(removeDiceButton);

setupSvgToggle(resetButton);
setupSvgToggle(colorButton);
setupSvgToggle(clearButton);

setupSvgToggle(d4Button);
setupSvgToggle(d6Button);
setupSvgToggle(d8Button);
setupSvgToggle(d10Button);
setupSvgToggle(d12Button);
setupSvgToggle(d20Button);
setupSvgToggle(d100Button);
setupCounters();

resetToDefaults();
Debug.log('Savage Dice for Owlbear is online and fully operational.')

function setupRadio(): void {
    radios.forEach(radio => {
        radio.addEventListener('click', function () {
            setRadio(this);
        });
    });
}

function setupSliders(): void {
    const updateTargetDisplay = () => {
        const val = targetNumberSpinner.valueAsNumber || CONST.DEFAULTS.TARGET_NUMBER;
        targetCurrent.textContent = val.toString();
    };
    targetNumberSpinner.max = CONST.DEFAULTS.TARGET_NUMBER_MAX;
    targetNumberSpinner.min = CONST.DEFAULTS.TARGET_NUMBER_MIN;
    targetNumberSpinner.addEventListener('input', updateTargetDisplay);
    targetNumberSpinner.addEventListener('change', updateTargetDisplay);

    const updateModifierDisplay = () => {
        const val = parseInt(modifierSpinner.value) || CONST.DEFAULTS.MODIFIER;
        modifierCurrent.textContent = val > CONST.DEFAULTS.MODIFIER ? `+${val}` : val.toString();
    };
    modifierSpinner.max = CONST.DEFAULTS.MODIFIER_MAX;
    modifierSpinner.min = CONST.DEFAULTS.MODIFIER_MIN;
    modifierSpinner.addEventListener('input', updateModifierDisplay);
    modifierSpinner.addEventListener('change', updateModifierDisplay);

    updateTargetDisplay();
    updateModifierDisplay();
}

function getRollType(): string {
    let ret = CONST.ROLL_TYPES.TRAIT
    for (let radio of radios) {
        if (radio.classList.contains(Util.ACTIVE_CLASS)) {
            ret = radio.dataset.value ?? ''
        }
    }
    return ret
}

function setState(svgElement: SVGElement, state: boolean) {
    if (state) {
        svgElement.classList.add(Util.ACTIVE_CLASS);
    } else {
        svgElement.classList.remove(Util.ACTIVE_CLASS);
    }
}

function getState(svgElement: SVGElement) {
    return svgElement.classList.contains(Util.ACTIVE_CLASS)
}

function setValue(svgElement: SVGElement, val: number) {
    let old = getValue(svgElement);
    if (val != old) {
        svgElement.dataset.value = val.toString();
    }
}
function getValue(svgElement: SVGElement) {
    return parseInt(svgElement.dataset.value || '0');
}

function cycleEnum<T extends object>(enumObject: T, toggle: SVGElement, useActive: boolean, reset: boolean): void {
    const classes = getEnumKeys(enumObject);
    let current = getValue(toggle) + 1;
    if (current > classes.length - 1 || reset) current = 0;
    let title = classes[current].toString();
    if (useActive) {
        if (current === 0) {
            toggle.classList.remove(Util.ACTIVE_CLASS);
        } else {
            toggle.classList.add(Util.ACTIVE_CLASS);
        }
        Util.setImage(title.toLowerCase(), toggle, '--button-size')
    } else {
        classes.forEach(c => toggle.classList.remove(c.toString().toLowerCase()));
        toggle.classList.add(title.toLowerCase());
    }

    setValue(toggle, current);

    const parentElement = toggle.parentElement;
    if (parentElement) {
        parentElement.title = title.replace("_", " ");
    }
}

function toggleState(svgElement: SVGElement) {
    let state = !getState(svgElement);
    setState(svgElement, state);
}

function setSpinner(input: HTMLInputElement, current: HTMLDivElement, val: string) {
    input.value = val;
    current.innerText = val;
}

function setSelect(input: HTMLSelectElement, val: string) {
    input.value = val;
}

function resetToDefaults() {
    setSpinner(targetNumberSpinner, targetCurrent, CONST.DEFAULTS.TARGET_NUMBER);
    setSpinner(modifierSpinner, modifierCurrent, CONST.DEFAULTS.MODIFIER);
    setState(wildDieToggle, CONST.DEFAULTS.WILD_DIE_ENABLED);
    setSelect(wildDieType, CONST.DEFAULTS.WILD_DIE);
    setState(bonusDamageToggle, CONST.DEFAULTS.BONUS_DAMAGE);
    setState(breakingObjectsToggle, CONST.DEFAULTS.BREAK_OBJECTS);
    setState(opposedRollToggle, CONST.DEFAULTS.OPPOSED_ENABLED);
    setState(jokerDrawnToggle, CONST.DEFAULTS.JOKER_DRAWN_ENABLED);

    setState(wound1Toggle, CONST.DEFAULTS.WOUND_ENABLED);
    setState(wound2Toggle, CONST.DEFAULTS.WOUND_ENABLED);
    setState(wound3Toggle, CONST.DEFAULTS.WOUND_ENABLED);

    setState(fatigue1Toggle, CONST.DEFAULTS.FATIGUE_ENABLED);
    setState(fatigue2Toggle, CONST.DEFAULTS.FATIGUE_ENABLED);
    cycleEnum(Illumination, illumToggle, false, true)
    setState(distractedToggle, CONST.DEFAULTS.DISTRACTED_ENABLED);
    cycleEnum(MultiAction, multiToggle, true, true)
    setState(wildAttackToggle, CONST.DEFAULTS.WILD_ATTACK_ENABLED);
    cycleEnum(CalledShot, calledShotToggle, true, true);
    cycleEnum(Cover, coverToggle, true, true);
    cycleEnum(Range, rangeToggle, true, true);
    setState(theDropToggle, CONST.DEFAULTS.THE_DROP_ENABLED);
    setState(vulnerableToggle, CONST.DEFAULTS.VULNERABLE_ENABLED);
    cycleEnum(GangUp, gangUpToggle, true, true);

    setRadio(traitdice);
    clearCounters();
}

function clearCounters() {
    for (let sp of document.querySelectorAll<HTMLElement>('.counter')) {
        updateCounter(sp, -getCounter(sp))
    }
}

async function opposedRollSet() {
    const pid = playerCache.ready ? playerCache.id : await OBR.player.getId();
    const RECENT_ROLLS = [...ROLL_HISTORY].reverse();
    for (let lr of RECENT_ROLLS) {
        if (lr.rollType === CONST.ROLL_TYPES.TRAIT && lr.playerId != pid) {
            setSpinner(targetNumberSpinner, targetCurrent, `${lr.total}`)
            break;
        }
    }
}

function setRadio(svg: SVGElement) {
    radios.forEach(r => setState(r, false));
    setState(svg, true);
    const selectedRadio = svg.dataset.value || CONST.ROLL_TYPES.TRAIT;
    showHideControls(selectedRadio);
}

function setupSvgToggle(svgElement: SVGElement) {
    svgElement.addEventListener('click', function (): void {
        if (svgElement === targetNumberButton) {
            setSpinner(targetNumberSpinner, targetCurrent, CONST.DEFAULTS.TARGET_NUMBER);
        } else if (svgElement === modifierButton) {
            setSpinner(modifierSpinner, modifierCurrent, CONST.DEFAULTS.MODIFIER);
        } else if (svgElement === opposedRollToggle) {
            opposedRollSet();
        } else if (svgElement === adjustButton) {
            adjustTheRoll();
        } else if (svgElement === removeDiceButton) {
            clearCounters();
        } else if (svgElement === rollDiceButton) {
            rollTheDice();
        } else if (svgElement === rerollDiceButton) {
            rerollTheDice();
        } else if (svgElement === resetButton) {
            resetToDefaults();
        } else if (svgElement === colorButton) {
            dice_color++;
            if (dice_color > DICECOLORS.length - 1) dice_color = 0;
            setDiceColor(dice_color);
        } else if (svgElement === clearButton) {
            clearLog();
        } else if (svgElement === d4Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d6Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d8Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d10Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d12Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d20Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === d100Button) {
            updateCounter(svgElement.nextElementSibling as HTMLElement, 1);
        } else if (svgElement === illumToggle) {
            cycleEnum(Illumination, illumToggle, false, false);
        } else if (svgElement === multiToggle) {
            cycleEnum(MultiAction, multiToggle, true, false);
        } else if (svgElement === calledShotToggle) {
            cycleEnum(CalledShot, calledShotToggle, true, false);
        } else if (svgElement === coverToggle) {
            cycleEnum(Cover, coverToggle, true, false);
        } else if (svgElement === rangeToggle) {
            cycleEnum(Range, rangeToggle, true, false);
         } else if (svgElement === gangUpToggle) {
            cycleEnum(GangUp, gangUpToggle, true, false);   
        } else {
            toggleState(svgElement);
            if (svgElement === bonusDamageToggle && getState(bonusDamageToggle)) {
                setState(breakingObjectsToggle, false)
            } else if (svgElement === breakingObjectsToggle && getState(breakingObjectsToggle)) {
                setState(bonusDamageToggle, false)
            }
        }
    });
}

function setupCounters(): void {
    for (let sp of document.querySelectorAll<HTMLElement>('.counter')) {
        sp.addEventListener('click', function (event: MouseEvent) {
            const target = event.currentTarget as HTMLElement;
            updateCounter(target, -1);
        });
    }
}

function updateCounter(target: HTMLElement, updateAmount: number): void {
    if (!target) {
        console.error('updateCounter: target element is null or undefined');
        return;
    }
    let count = Math.max(0, getCounter(target) + updateAmount);
    target.textContent = (count != 0) ? count.toString() : '';
}

function getCounter(target: HTMLElement): number {
    let count = parseInt(target.textContent || '0', 10);
    return Math.max(0, count);
}

function clearLog() {
    const logContainer = document.getElementById('log-entries');
    if (logContainer) {
        logContainer.innerHTML = '';
    }
    ROLL_HISTORY = [];
    updateStorage(ROLL_HISTORY)
    DB.clear();
}

function showHideControls(selectedRadio: string) {
    let show = ''
    let hide = 'none'
    switch (true) {
        case selectedRadio === CONST.ROLL_TYPES.TRAIT: {
            modifierRow.style.display = show;
            targetNumberRow.style.display = show;
            wildDieRow.style.display = show;

            adjustButton.parentElement!.style.display = show;
            jokerDrawnToggle.parentElement!.style.display = show;
            opposedRollToggle.parentElement!.style.display = show;


            wound1Toggle.parentElement!.style.display = show;
            wound2Toggle.parentElement!.style.display = show;
            wound3Toggle.parentElement!.style.display = show;

            fatigue1Toggle.parentElement!.style.display = show;
            fatigue2Toggle.parentElement!.style.display = show;
            illumToggle.parentElement!.style.display = show;

            bonusDamageToggle.parentElement!.style.display = hide
            breakingObjectsToggle.parentElement!.style.display = hide;
            distractedToggle.parentElement!.style.display = show;
            multiToggle.parentElement!.style.display = show;
            wildAttackToggle.parentElement!.style.display = show;

            calledShotToggle.parentElement!.style.display = show;
            coverToggle.parentElement!.style.display = show;
            rangeToggle.parentElement!.style.display = show;
            theDropToggle.parentElement!.style.display = show;
            vulnerableToggle.parentElement!.style.display = show;
            gangUpToggle.parentElement!.style.display = show;

            d4Button.parentElement!.style.display = show;
            d6Button.parentElement!.style.display = show;
            d8Button.parentElement!.style.display = show;
            d10Button.parentElement!.style.display = show;
            d12Button.parentElement!.style.display = show;
            d20Button.parentElement!.style.display = hide;
            d100Button.parentElement!.style.display = hide;
            break;
        }
        case selectedRadio === CONST.ROLL_TYPES.DAMAGE: {
            modifierRow.style.display = show;
            targetNumberRow.style.display = show;
            wildDieRow.style.display = hide;

            adjustButton.parentElement!.style.display = show;
            jokerDrawnToggle.parentElement!.style.display = show;
            opposedRollToggle.parentElement!.style.display = hide;

            wound1Toggle.parentElement!.style.display = hide;
            wound2Toggle.parentElement!.style.display = hide;
            wound3Toggle.parentElement!.style.display = hide;

            fatigue1Toggle.parentElement!.style.display = hide;
            fatigue2Toggle.parentElement!.style.display = hide;
            illumToggle.parentElement!.style.display = hide;

            bonusDamageToggle.parentElement!.style.display = show
            breakingObjectsToggle.parentElement!.style.display = show;
            distractedToggle.parentElement!.style.display = hide;
            multiToggle.parentElement!.style.display = hide;
            wildAttackToggle.parentElement!.style.display = show;

            calledShotToggle.parentElement!.style.display = show;
            coverToggle.parentElement!.style.display = hide;
            rangeToggle.parentElement!.style.display = hide;
            theDropToggle.parentElement!.style.display = show;
            vulnerableToggle.parentElement!.style.display = hide;
            gangUpToggle.parentElement!.style.display = hide;

            d4Button.parentElement!.style.display = show;
            d6Button.parentElement!.style.display = show;
            d8Button.parentElement!.style.display = show;
            d10Button.parentElement!.style.display = show;
            d12Button.parentElement!.style.display = show;
            d20Button.parentElement!.style.display = hide;
            d100Button.parentElement!.style.display = hide;
            break;
        }
        case selectedRadio === CONST.ROLL_TYPES.STANDARD: {
            modifierRow.style.display = show;
            targetNumberRow.style.display = hide;
            wildDieRow.style.display = hide;

            adjustButton.parentElement!.style.display = show;
            jokerDrawnToggle.parentElement!.style.display = hide;
            opposedRollToggle.parentElement!.style.display = hide;

            wound1Toggle.parentElement!.style.display = hide;
            wound2Toggle.parentElement!.style.display = hide;
            wound3Toggle.parentElement!.style.display = hide;

            fatigue1Toggle.parentElement!.style.display = hide;
            fatigue2Toggle.parentElement!.style.display = hide;
            illumToggle.parentElement!.style.display = hide;

            bonusDamageToggle.parentElement!.style.display = hide
            breakingObjectsToggle.parentElement!.style.display = hide;
            distractedToggle.parentElement!.style.display = hide;
            multiToggle.parentElement!.style.display = hide;
            wildAttackToggle.parentElement!.style.display = hide;

            calledShotToggle.parentElement!.style.display = hide;
            coverToggle.parentElement!.style.display = hide;
            rangeToggle.parentElement!.style.display = hide;
            theDropToggle.parentElement!.style.display = hide;
            vulnerableToggle.parentElement!.style.display = hide;
            gangUpToggle.parentElement!.style.display = hide;

            d4Button.parentElement!.style.display = show;
            d6Button.parentElement!.style.display = show;
            d8Button.parentElement!.style.display = show;
            d10Button.parentElement!.style.display = show;
            d12Button.parentElement!.style.display = show;
            d20Button.parentElement!.style.display = show;
            d100Button.parentElement!.style.display = show;
            break;
        }
    }
}

function setDiceColor(n: number) {
    n = Math.max(0, Math.min(n, DICECOLORS.length - 1))
    CONST.COLOR_THEMES.PRIMARY = DICECOLORS[n];
    CONST.COLOR_THEMES.SECONDARY = Util.getComplementary(CONST.COLOR_THEMES.PRIMARY);
    CONST.COLOR_THEMES.BONUS = Util.getMidpointColor(CONST.COLOR_THEMES.PRIMARY, CONST.COLOR_THEMES.SECONDARY)
    CONST.COLOR_THEMES.NUMBER = Util.getOptimalTextColor(CONST.COLOR_THEMES.PRIMARY);
    CONST.COLOR_THEMES.NUMBER_SECONDARY = Util.getOptimalTextColor(CONST.COLOR_THEMES.SECONDARY);
    CONST.COLOR_THEMES.NUMBER_BONUS = Util.getOptimalTextColor(CONST.COLOR_THEMES.BONUS);
}

const LOG_ENTRIES_ELEMENT = document.querySelector('#log-entries')!;

class SWDR {
    playerName: string = ""
    playerId: string = ""
    criticalFailure: boolean = false
    description: string = ''
    rollType: string = ''
    targetNumber: number = 4
    isReroll: boolean = false
    modifier: number = 0
    rollResult: RollResult[] = []
    total: number = 0
    onesCount: number = 0
    isJoker: boolean = false
    illumination: number = CONST.DEFAULTS.ILLUMN_VALUE
    isAdjustment: boolean = false
    isWound: boolean = false
};

class DieResult {
    data: string = ''
    dieType: string = "d6"
    groupId: number = 0
    rollId: number = 0
    sides: string = "d6"
    theme: string = 'default'
    themeColor: string = '#ecd69b'
    value: number = 0
}
class RollResult {
    dieLabel: string = ''
    rollDetails: string = ''
    id: number = 0
    isWildDie: boolean = false
    isBonusDie: boolean = false
    targetNumber: number = 4
    modifier: number = 0
    qty: number = 0
    rolls: DieResult[] = []
    sides: string = 'd6'
    themeColor: string = '#ecd69b'
    value: number = 0
}

// Add a promise to track player initialization
let playerCachePromise: Promise<void> | null = null;

export let playerCache = {
    name: "Unknown Player",
    id: "unknown",
    isGm: false,
    ready: false
};

async function setPlayer(r: SWDR) {
    // If player cache is already ready, use it immediately
    if (playerCache.ready) {
        r.playerName = playerCache.name;
        r.playerId = playerCache.id;
        return;
    }

    // If there's already a promise in progress, wait for it
    if (playerCachePromise) {
        await playerCachePromise;
        // After waiting, check if the cache is now ready
        if (playerCache.ready) {
            r.playerName = playerCache.name;
            r.playerId = playerCache.id;
            return;
        }
        // If we get here, the promise completed but cache isn't ready (error case)
        // Fall through to create a new promise
    }

    // Create a new promise only if needed and ensure single execution
    if (!playerCachePromise) {
        playerCachePromise = (async () => {
            try {
                // Wait for OBR to be ready if it's not
                if (!OBR.isReady) {
                    await new Promise<void>((resolve) => {
                        const handler = () => {
                            OBR.onReady(handler); // remove listener after first call
                            resolve();
                        };
                        OBR.onReady(handler);
                    });
                }

                // Get player info in parallel
                const [name, id, role] = await Promise.all([
                    OBR.player.getName(),
                    OBR.player.getId(),
                    OBR.player.getRole()
                ]);

                // Update the cache atomically
                playerCache.name = name;
                playerCache.id = id;
                playerCache.isGm = role === 'GM';
                playerCache.ready = true;

            } catch (err) {
                console.error("Failed to get player:", err);
                // Set error state atomically
                playerCache.name = "GM";
                playerCache.id = "error";
                playerCache.ready = true;
            } finally {
                playerCachePromise = null;
            }
        })();
    }

    // Wait for the promise to complete (either existing or newly created)
    await playerCachePromise;

    // After promise completes, set the player data from cache
    r.playerName = playerCache.name;
    r.playerId = playerCache.id;
}

async function cleanupLegacyRoomMetadata() {
    try {
        const roomMetadata = await OBR.room.getMetadata();
        const legacyHistoryKey = Util.DiceHistoryMkey;

        if (roomMetadata[legacyHistoryKey] !== undefined) {
            Debug.log(`Found legacy room metadata key: ${legacyHistoryKey}, removing it...`);
            await OBR.room.setMetadata({ [legacyHistoryKey]: undefined });
            Debug.log(`Successfully removed legacy room metadata key: ${legacyHistoryKey}`);
        } else {
            Debug.log(`No legacy room metadata found (${legacyHistoryKey})`);
        }
    } catch (error) {
        console.error("Failed to clean up legacy room metadata:", error);
    }
}

OBR.onReady(async () => {
    console.log("OBR.onReady fired");
    await Savaged.checkProxyStatus();
    //createContextMenu();
    await initializeExtension();

    const unsubscribeonReadyChange = OBR.scene.onReadyChange(async () => {
        try {
            await Debug.sceneOnChange();
        } catch (error) {
            console.error("Error in scene ready change handler:", error);
        }
    });

    const unsubscribeItemsOnChange = OBR.scene.items.onChange(async () => {
        try {
            await Debug.sceneOnChange();
        } catch (error) {
            console.error("Error in scene items change handler:", error);
        }
    });

    try {
        await Debug.sceneOnChange();
    } catch (error) {
        console.error("Error in initial scene change check:", error);
    }

    await Debug.dumpRoomMetadata();
    await Debug.findItemMetadataKeys();
    await Debug.cleanupDeadExtensionMetadata();
    await cleanupLegacyRoomMetadata();

    const unsubscribeonMetadataChange = OBR.scene.onMetadataChange(async (metadata) => {
        try {
            await onSceneMetadataChange(metadata);
        } catch (error) {
            console.error("Error in scene metadata change handler:", error);
        }
    });

    window.addEventListener('beforeunload', () => {
        try {
            unsubscribeonMetadataChange();
            unsubscribeonReadyChange();
            unsubscribeItemsOnChange();
            cleanupResizeObserver();
        } catch (error) {
            console.error("Error during cleanup:", error);
        }
    });
});

let RollCollection: SWDR = new SWDR();
const MAX_HISTORY: number = 16;
let ROLL_HISTORY: SWDR[] = [];
const DICECOLORS = Util.generateColorCodes();
let dice_color = 0;
setDiceColor(dice_color);
const audio: HTMLAudioElement = new Audio("/assets/dice-roll.mp3")

function playAudio() {
    audio.loop = false;
    audio.play();
}

const DB = new DiceBox({
    assetPath: "assets/",
    origin: "https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/",
    id: 'dice-tray',
    container: "#dice-tray",
    theme: "default",
    // theme: "diceOfRolling",
    // externalThemes: {
    //     diceOfRolling: "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
    //   },
    themeColor: CONST.COLOR_THEMES.PRIMARY,
    textColor: '#FFFFFF',
    offscreen: false,
    scale: 6, //8,
    friction: .75,
    restitution: 0,
    gravity: 1,
    throwForce: 8, //5,
    spinForce: 8, //6,
    settleTimeout: 3000,
    mass: 5,
    delay: 50, //100,
    lightIntensity: 0.75,
    //discordResponse: null,
    onDieComplete: async (dieResult: DieResult) => {
        if (DB.acing && dieResult.value === sidesNumber(dieResult.sides)) {
            playAudio();
            await DB.add(dieResult, { newStartPoint: true });
        }
    },
    onRollComplete: async (rollResult: RollResult[]) => {
        await setPlayer(RollCollection)
        RollCollection.rollType = DB.rollType
        RollCollection.isReroll = DB.isReroll
        RollCollection.targetNumber = DB.targetNumber
        const LOG_ENTRY_WRAPPER_ELEMENT = document.createElement('fieldset')
        LOG_ENTRY_WRAPPER_ELEMENT.classList.add('log-entry-wrapper')
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.rolltype = RollCollection.rollType
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.isreroll = RollCollection.isReroll.toString()
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.targetnumber = RollCollection.targetNumber.toString()
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.pid = RollCollection.playerId

        const ROLL_IS_COMPLETE = rollResult.every(rr => rr.rolls?.every(dr => dr.value));

        if (ROLL_IS_COMPLETE) {
            for (const DIE_ROLL of rollResult) {
                switch (DB.rollType) {
                    case CONST.ROLL_TYPES.TRAIT:
                        DIE_ROLL.dieLabel = DIE_ROLL.isWildDie ? CONST.DIELABELS.WILD : CONST.DIELABELS.TRAIT;
                        break;
                    case CONST.ROLL_TYPES.DAMAGE:
                        DIE_ROLL.dieLabel = DIE_ROLL.isBonusDie ? CONST.DIELABELS.BONUS : CONST.DIELABELS.DAMAGE;
                        break;
                    case CONST.ROLL_TYPES.STANDARD:
                        DIE_ROLL.dieLabel = CONST.DIELABELS.STANDARD;
                        break;
                }

                DIE_ROLL.rollDetails = breakdownResult(DIE_ROLL);
            }

            RollCollection.isReroll = DB.isReroll;
            RollCollection.modifier = rollResult[0].modifier;
            RollCollection.isJoker = getState(jokerDrawnToggle) && DB.rollType != CONST.ROLL_TYPES.STANDARD;
            RollCollection.illumination = DB.rolltype === CONST.ROLL_TYPES.TRAIT ? getValue(illumToggle) : 0;
            RollCollection.isWound = getWoundsModifier(DB.rollType) != 0;
            RollCollection.rollResult = rollResult;

            await buildOutputHTML(RollCollection, DB.rollType, rollResult, LOG_ENTRY_WRAPPER_ELEMENT)
            updateRollHistory({ ...RollCollection });

            resizeLogElement();

            if (window.innerWidth < 800) {
                document.querySelector('#dice-tray')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        }
    }
});

async function buildOutputHTML(rCollection: SWDR, rType: string, rResult: RollResult[], wrapper: any,) {
    if (rType === CONST.ROLL_TYPES.TRAIT) {
        const TRAIT_DICE = rResult.filter(d => !d.isWildDie);
        const WILD_DIE_RESULT = rResult.find(d => d.isWildDie);
        const IS_MULTIPLE_TRAIT_DICE = TRAIT_DICE.length > 1;

        // Check for critical failure
        if (IS_MULTIPLE_TRAIT_DICE) {
            const allDice = rResult;
            const onesCount = allDice.filter(d => d.rolls && d.rolls.length > 0 && d.rolls[0].value === 1).length;
            const wildDieHasOne = WILD_DIE_RESULT && WILD_DIE_RESULT.rolls && WILD_DIE_RESULT.rolls.length > 0 && WILD_DIE_RESULT.rolls[0].value === 1;
            if (onesCount > allDice.length / 2 && wildDieHasOne) {
                rCollection.criticalFailure = true;
                rCollection.total = 0;
            } else {
                rCollection.criticalFailure = false;
            }
        } else {
            const traitDieHasOne = TRAIT_DICE[0] && TRAIT_DICE[0].rolls && TRAIT_DICE[0].rolls.length > 0 && TRAIT_DICE[0].rolls[0].value === 1;
            const wildDieHasOne = WILD_DIE_RESULT && WILD_DIE_RESULT.rolls && WILD_DIE_RESULT.rolls.length > 0 && WILD_DIE_RESULT.rolls[0].value === 1;
            if (traitDieHasOne && wildDieHasOne) {
                rCollection.criticalFailure = true;
                rCollection.total = 0;
            } else {
                rCollection.criticalFailure = false;
            }
        }

        let descriptionString: string;
        if (IS_MULTIPLE_TRAIT_DICE) {
            if (!rCollection.criticalFailure) {
                const successfulDice = TRAIT_DICE.filter(d => d.value >= rCollection.targetNumber);
                let successes = successfulDice.length;
                let highest = successfulDice.length > 0 ? Math.max(...successfulDice.map(d => d.value)) : 0;
                if (WILD_DIE_RESULT && WILD_DIE_RESULT.value >= rCollection.targetNumber) {
                    successes += 1;
                    highest = Math.max(highest, WILD_DIE_RESULT.value);
                }
                const raises = highest >= rCollection.targetNumber ? Math.floor((highest - rCollection.targetNumber) / 4) : 0;
                rCollection.total = successes;
                descriptionString = `${successes} Successes with ${raises} Raises`;
            } else {
                descriptionString = `Critical Failure! ${CONST.EMOJIS.CRITICAL_FAILURE}`;
            }
        } else {
            const TRAIT_DICE_ROLLED = TRAIT_DICE[0];
            if (TRAIT_DICE_ROLLED != undefined) {
                rCollection.total = TRAIT_DICE_ROLLED.value;
            } else {
                rCollection.total = 0;
            }
            if (WILD_DIE_RESULT) {
                const HIGHER = WILD_DIE_RESULT.value > TRAIT_DICE_ROLLED.value ? WILD_DIE_RESULT.value : TRAIT_DICE_ROLLED.value;
                rCollection.total = HIGHER;
            }
            descriptionString = calculateRaises(rCollection.total, rCollection.targetNumber);
        }

        let rollDetails = '';

        if (IS_MULTIPLE_TRAIT_DICE) {
            TRAIT_DICE.forEach(die => {
                rollDetails += markupDieRollDetails(die, rCollection.rollType, rCollection.isJoker, rCollection.isWound, rCollection.targetNumber);
            });
            if (WILD_DIE_RESULT) {
                rollDetails += markupDieRollDetails(WILD_DIE_RESULT, rCollection.rollType, rCollection.isJoker, rCollection.isWound, rCollection.targetNumber);
            }
        } else {
            for (const DIE_ROLL of rResult) {
                rollDetails += markupDieRollDetails(DIE_ROLL, rCollection.rollType, rCollection.isJoker, rCollection.isWound, rCollection.targetNumber);
            }
        }

        // Format the roll details (i.e., break down of each die, if it aced, and whatever modifier might be applied).
        const ROLL_DETAILS_ELEMENT = createRollDetailsElement(`${rCollection.modifier != 0 || rCollection.isJoker || rCollection.isWound ? signModOutput(rCollection.modifier, rCollection.isJoker, rCollection.isWound) : ''}${rollDetails}`);

        if (rCollection.criticalFailure) {
            descriptionString = `Critical Failure! ${CONST.EMOJIS.CRITICAL_FAILURE}`;
        }

        rCollection.description = descriptionString;
        const RESULTS = markupResult(rCollection, rCollection.total, { description: descriptionString });
        if (rType === CONST.ROLL_TYPES.TRAIT && IS_MULTIPLE_TRAIT_DICE) {
            RESULTS[0].style.color = 'gold';
        }
        wrapper.append(ROLL_DETAILS_ELEMENT);

        for (const ELEMENT of RESULTS) {
            wrapper.append(ELEMENT);
        }
    } else if ([CONST.ROLL_TYPES.DAMAGE, CONST.ROLL_TYPES.STANDARD].includes(rType)) {
        rCollection.total = 0;

        let rollDetailsElement = document.querySelector('.output');

        // Loop through each die roll and output.
        for (const DIE_ROLL of rResult) {
            rCollection.total += DIE_ROLL.value - DIE_ROLL.modifier;
        }

        // Add the modifier to the total.
        rCollection.total += rCollection.modifier;
        const DESCRIPTION_STRING = rType === CONST.ROLL_TYPES.DAMAGE ? calculateRaises(rCollection.total, rCollection.targetNumber) : '';

        rCollection.description = DESCRIPTION_STRING ? DESCRIPTION_STRING : '';
        let rollDetails = '';

        for (const DIE_ROLL of rResult) {
            rollDetails += markupDieRollDetails(DIE_ROLL, rCollection.rollType, rCollection.isJoker, rCollection.isWound);
        }

        // Format the roll details (i.e., break down of each die, if it aced, and whatever modifier might be applied).
        rollDetailsElement = createRollDetailsElement(`${rCollection.modifier != 0 || rCollection.isJoker || rCollection.isWound ? signModOutput(rCollection.modifier, rCollection.isJoker, rCollection.isWound) : ''}${rollDetails}`);
        wrapper.append(rollDetailsElement);
        // Generate the HTML markup for the description and result value.
        const RESULTS = markupResult(rCollection, rCollection.total, { description: DESCRIPTION_STRING! });

        for (const ELEMENT of RESULTS) {
            wrapper.append(ELEMENT);
        }
    }
    LOG_ENTRIES_ELEMENT?.prepend(wrapper);
    let leg = document.createElement('legend')
    if (leg) {
        leg.textContent = rCollection.playerName
        wrapper.insertBefore(leg, wrapper.firstChild);
    }
    LOG_ENTRIES_ELEMENT.scrollTop = 0;
}

DB.init();

function parseDiceString(diceStr: string): { [key: number]: number } {
    const parts = diceStr.split('+');
    const counts: { [key: number]: number } = {};
    for (const part of parts) {
        const match = part.match(/^d(\d+)$/);
        if (match) {
            const sides = parseInt(match[1]);
            counts[sides] = (counts[sides] || 0) + 1;
        }
    }
    return counts;
}

async function onSceneMetadataChange(metadata: any) {
    try {
        // Check scene metadata for roll history
        if (metadata[Util.SceneDiceHistoryMkey]) {
            try {
                const storedHistory = metadata[Util.SceneDiceHistoryMkey] as Uint8Array;
                ROLL_HISTORY = decompress(storedHistory);
                const logContainer = document.getElementById('log-entries');
                if (logContainer) {
                    logContainer.innerHTML = '';
                }
                renderLog(ROLL_HISTORY);
            } catch (error) {
                console.error("Failed to process roll history:", error);
                // Continue with other metadata processing
            }
        }

        // Check for roll requests in scene metadata only
        const rollRequest = metadata[Util.SceneRollRequestMkey];

        if (rollRequest) {
            try {
                const { dice, rollType, modifier, playerId, isWildCard } = rollRequest;
                const currentPlayerId = await OBR.player.getId();

                if (playerId === currentPlayerId) {
                    // Set roll type
                    const radioMap: { [key: string]: SVGElement } = {
                        'trait': traitdice,
                        'damage': damagedice,
                        'standard': standarddice
                    };
                    if (radioMap[rollType]) {
                        setRadio(radioMap[rollType]);
                    }
                    // Set modifier
                    setSpinner(modifierSpinner, modifierCurrent, modifier);
                    // Clear counters
                    clearCounters();

                    // Use the dice array to build a proper dice string
                    let diceStringToParse = '';
                    if (dice && Array.isArray(dice) && dice.length > 0) {
                        diceStringToParse = dice.join('+');
                        Debug.log(`Using dice array format: ${diceStringToParse} with modifier ${modifier}`);
                    } else {
                        // Fallback for empty or invalid dice arrays
                        diceStringToParse = 'd6';
                        Debug.log(`Fallback to default die: ${diceStringToParse}`);
                    }

                    // Set counters for the dice
                    const counts = parseDiceString(diceStringToParse);
                    const counterMap: { [key: string]: SVGElement } = {
                        '4': d4Button,
                        '6': d6Button,
                        '8': d8Button,
                        '10': d10Button,
                        '12': d12Button,
                        '20': d20Button,
                        '100': d100Button
                    };
                    for (const [sides, count] of Object.entries(counts)) {
                        if (counterMap[sides]) {
                            updateCounter(counterMap[sides].nextElementSibling as HTMLElement, count);
                        }
                    }

                    // Handle wild card toggle based on isWildCard property
                    if (rollType === 'trait' && isWildCard !== undefined) {
                        // Set wild die toggle state based on isWildCard
                        setState(wildDieToggle, isWildCard);
                        Debug.log(`Wild card toggle set to: ${isWildCard}`);
                    }

                    // Roll the dice
                    await rollTheDice();
                }
            } catch (error) {
                console.error("Failed to process roll request:", error);
            } finally {
                // Always clear the request from scene metadata to prevent stuck state
                try {
                    const isSceneReady = await OBR.scene.isReady();
                    if (isSceneReady) {
                        await OBR.scene.setMetadata({ [Util.SceneRollRequestMkey]: undefined });
                    }
                } catch (cleanupError) {
                    console.error("Failed to clean up roll request:", cleanupError);
                }
            }
        }
    } catch (error) {
        console.error("Unexpected error in onSceneMetadataChange:", error);
    }
}

async function initializeExtension() {
    try {
        const [name, id] = await Promise.all([
            OBR.player.getName(),
            OBR.player.getId()
        ]);
        playerCache.name = name;
        playerCache.id = id;
        playerCache.ready = true;
        Debug.log("Savage Dice: Player ready →", name);
        createContextMenu(playerCache.id);
    } catch (err) {
        console.error("Failed to cache player on ready:", err);
    }

    try {
        ROLL_HISTORY = await fetchStorage();
        renderLog(ROLL_HISTORY);
        Debug.log(`Loaded ${ROLL_HISTORY.length} saved rolls`);
    } catch (error) {
        console.error("Failed during initialization:", error);
        ROLL_HISTORY = [];
    }
}

async function updateRollHistory(roll: SWDR) {
    ROLL_HISTORY.push(roll);
    updateStorage(ROLL_HISTORY)
}

async function fetchStorage(): Promise<SWDR[]> {
    // Wait until OBR is actually ready — no shortcuts
    // Add timeout to prevent infinite loop
    const startTime = Date.now();
    const MAX_WAIT_TIME = 30000; // 30 seconds timeout

    while (!OBR.isReady) {
        // Check if we've exceeded the maximum wait time
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            console.error("OBR readiness check timed out after 30 seconds");
            return [];
        }
        await new Promise(requestAnimationFrame);
    }

    try {
        // Wait for scene to be ready
        // Add timeout to prevent infinite loop
        const sceneStartTime = Date.now();
        const MAX_SCENE_WAIT_TIME = 30000; // 30 seconds timeout
        
        while (!await OBR.scene.isReady()) {
            // Check if we've exceeded the maximum wait time
            if (Date.now() - sceneStartTime > MAX_SCENE_WAIT_TIME) {
                console.error("Scene readiness check timed out after 30 seconds");
                return [];
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get metadata from scene only (new approach)
        const sceneMetadata = await OBR.scene.getMetadata();
        const storedHistory = sceneMetadata[Util.SceneDiceHistoryMkey] as Uint8Array | undefined;

        if (storedHistory) {
            Debug.log("Found roll history in scene metadata");
            return decompress(storedHistory);
        }

        Debug.log("No saved roll history found in scene metadata");
        return [];
    } catch (error) {
        console.error("Failed to fetch scene metadata:", error);
        return [];
    }
}

async function updateStorage(rh: SWDR[]) {
    while (rh.length > MAX_HISTORY) rh.shift();
    let history = [...rh];

    let buff = compress(history);
    Debug.log("History size:", buff.byteLength, "bytes");
    const save = async () => {
        if (!OBR.isReady) {
            requestAnimationFrame(save);
            return;
        }

        try {
            // Wait for scene to be ready
            const isSceneReady = await OBR.scene.isReady();
            if (!isSceneReady) {
                // Scene not ready yet, retry soon
                setTimeout(save, 100);
                return;
            }

            // Use scene metadata only (new approach)
            await OBR.scene.setMetadata({
                [Util.SceneDiceHistoryMkey]: buff
            });
            Debug.log("Roll history saved to scene metadata");
        } catch (err: unknown) {
            // TypeScript now knows err is unknown → we have to check it safely
            if (err && typeof err === "object" && "message" in err) {
                const message = (err as { message: string }).message;

                if (message.includes("not ready")) {
                    // Still not ready → retry soon
                    setTimeout(save, 100);
                } else {
                    // Real error (network, permission, etc.) – log once
                    console.error("Failed to save roll history:", message);
                }
            } else {
                console.error("Failed to save roll history (unknown error):", err);
            }
        }
    };

    save();
}
// Compress
function compress(data: SWDR[]): Uint8Array {
    const serialized = JSON.stringify(data);
    return pako.deflate(serialized, { level: 9 });
}

// Decompress
function decompress(compressedData: Uint8Array): SWDR[] {
    try {
        const decompressed = pako.inflate(compressedData);
        const parsed = JSON.parse(new TextDecoder().decode(decompressed));
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Failed to decompress history:", err);
        return [];
    }
}

function getTargetNumber(): number {
    return targetNumberSpinner.valueAsNumber;
}
// Determine the amount of successes and raises and build description text.
function calculateRaises(rollResult: number, targetnumber: number) {
    // Get the target number and create empty variables for raises and description.
    let raises = 0;
    let description = '';
    //let targetnumber = getTargetNumber()

    if (rollResult < targetnumber) {
        // If the roll is less than the TN, failure
        description = `Failure ${CONST.EMOJIS.FAILURE}`;
    } else if (rollResult >= targetnumber) {
        //If the roll is greater than or equal to the TN, success with possible raises.
        // Calculate possible raises.
        raises = Math.floor((rollResult - targetnumber) / 4);

        // If the calculation is less than 0, just set it to 0.
        if (raises < 0) {
            raises = 0;
        }

        if (raises === 0) {
            // If raises is equal to 0, Success!
            description = `Success! ${CONST.EMOJIS.SUCCESS}`;
        } else if (raises === 1) {
            // If raises equals one, output singular raise.
            description = `Success ${CONST.EMOJIS.SUCCESS} with a Raise! ${CONST.EMOJIS.RAISE}`;
        } else {
            // If raises greater than 1, output number of raises with multiple CONST.EMOJIS.
            let emojiCount = '';

            for (let i = 0; i < raises; i++) {
                emojiCount += `${CONST.EMOJIS.RAISE}${i < raises - 1 ? ' ' : ''}`;
            }

            description = `Success ${CONST.EMOJIS.SUCCESS} with ${raises} Raises! ${emojiCount}`;
        }
    }

    return description;
}

// Format the results generated
function markupResult(rCollection: SWDR, rollTotal: number, options = { description: '' }) {
    const DESCRIPTION: string | null = options.description;
    const DIE_LABEL: string = rCollection.rollResult[0]?.dieLabel;

    const RESULT_ELEMENT = document.createElement('h2');
    RESULT_ELEMENT.classList.add('total');
    RESULT_ELEMENT.innerText = rollTotal.toString();
    const DESCRIPTION_ELEMENT = document.createElement('p');
    DESCRIPTION_ELEMENT.classList.add('description');

    // If the description of successes and raises hasn't been created yet, generate one.
    if (!DESCRIPTION && [CONST.DIELABELS.TRAIT, CONST.DEFAULTS.BONUS_DAMAGE, CONST.DIELABELS.BONUS].includes(DIE_LABEL)) {
        rCollection.description = calculateRaises(rollTotal, rCollection.targetNumber);
    } else if (DESCRIPTION || DIE_LABEL === CONST.DIELABELS.STANDARD) {
        rCollection.description = DESCRIPTION;
    }
    rCollection.description = `${rCollection.isAdjustment ? CONST.EMOJIS.ADJUST : ''}${rCollection.isReroll ? CONST.EMOJIS.REROLL : ''}${rCollection.description}`
    DESCRIPTION_ELEMENT.innerText = rCollection.description!;

    return [RESULT_ELEMENT, DESCRIPTION_ELEMENT];
}

// Format details output.
function createRollDetailsElement(textOutput: string) {
    // Create output element
    const ROLL_DETAILS_ELEMENT = document.createElement('div');
    ROLL_DETAILS_ELEMENT.classList.add('output');
    ROLL_DETAILS_ELEMENT.innerHTML = textOutput;
    return ROLL_DETAILS_ELEMENT;
}

function breakdownResult(dieResult: RollResult) {
    let rollDetails = '';
    let ROLLS: DieResult[] = dieResult.rolls;
    for (const ROLL of ROLLS) {
        rollDetails += `${ROLL.value}${ROLLS.indexOf(ROLL) !== ROLLS.length - 1 ? CONST.EMOJIS.ACE : ''}`;
    }

    return rollDetails;
}

function sidesNumber(s: string) {
    let resultString = s[0] === 'd' ? s.slice(1) : s;
    let numberResult = parseInt(resultString);
    if (isNaN(numberResult)) {
        return 0;
    }
    return numberResult;
}

function signModOutput(modifier: number, joker: boolean, isWound: boolean) {
    return `<p class="modifier" data-modifier="${modifier}">Modifier: ${modifier < 0 ? '−' : '+'}${Math.abs(modifier)}${joker ? CONST.EMOJIS.JOKER : ''}${isWound ? CONST.EMOJIS.WOUND : ''}</p>`;
}

function markupDieRollDetails(dieRoll: RollResult, rType: string, joker: boolean, isWound: boolean, targetNumber?: number) {
    const SHOW_MODIFIER = rType === CONST.ROLL_TYPES.TRAIT && (dieRoll.modifier !== 0 || joker || isWound);
    //const SHOW_BREAKDOWN = dieRoll.rollDetails.includes(CONST.EMOJIS.ACE);
    const SHOW_BREAKDOWN = dieRoll.rolls.length > 1;
    const SHOW_MATH = SHOW_BREAKDOWN || SHOW_MODIFIER;
    const LABEL = `${dieRoll.dieLabel} (d${sidesNumber(dieRoll.sides)}):`;
    const BREAKDOWN = SHOW_MATH ? dieRoll.rollDetails : '';
    const MODIFIER = SHOW_MODIFIER ? `${dieRoll.modifier < 0 ? '-' : '+'} ${Math.abs(dieRoll.modifier)}` : '';
    const DIE_VALUE = rType != CONST.ROLL_TYPES.TRAIT ? dieRoll.value - dieRoll.modifier : dieRoll.value;
    let emojis = '';
    if (rType === CONST.ROLL_TYPES.TRAIT && targetNumber !== undefined) {
        if (dieRoll.value >= targetNumber) {
            emojis += CONST.EMOJIS.SUCCESS;
            let raises = Math.floor((dieRoll.value - targetNumber) / 4);
            for (let i = 0; i < raises; i++) {
                emojis += CONST.EMOJIS.RAISE;
            }
        } else {
            emojis = CONST.EMOJIS.FAILURE;
        }
    }
    return `
        <p data-die-sides="${sidesNumber(dieRoll.sides)}" data-roll-value="${dieRoll.value}">
            ${LABEL} ${BREAKDOWN} ${MODIFIER} ${SHOW_MATH ? '=' : ''} <strong>${DIE_VALUE}</strong>${emojis}
        </p>
    `;
}

function resizeLogElement() {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const log = document.querySelector('.log') as HTMLFieldSetElement
    log.style.maxHeight = `${sidebar.offsetHeight}px`;
}

const RESIZE_OBSERVER = new ResizeObserver(resizeLogElement);

RESIZE_OBSERVER.observe(document.querySelector('.dice-roller')!, { box: "border-box" });

function cleanupResizeObserver() {
    if (RESIZE_OBSERVER) {
        RESIZE_OBSERVER.disconnect();
    }
}

function getModifier(): number {
    return modifierSpinner.valueAsNumber
}

function getWoundsModifier(rollType: string): number {
    const mod: number = rollType === CONST.ROLL_TYPES.TRAIT ? (getState(wound1Toggle) ? -1 : 0) + (getState(wound2Toggle) ? -1 : 0) + (getState(wound3Toggle) ? -1 : 0) + (getState(fatigue1Toggle) ? -1 : 0) + (getState(fatigue2Toggle) ? -1 : 0) : 0;
    return mod;
}

function getJokerModifier(rollType: string): number {
    const jokemod: number = getState(jokerDrawnToggle) && rollType != CONST.ROLL_TYPES.STANDARD ? 2 : 0;
    return jokemod;
}

function getIllumModifier(rollType: string): number {
    const illummod: number = rollType === CONST.ROLL_TYPES.TRAIT ? getValue(illumToggle) : 0;
    return (illummod * -2);
}

function getMultiModifier(rollType: string): number {
    const mod: number = rollType === CONST.ROLL_TYPES.TRAIT ? getValue(multiToggle) : 0;
    return (mod * -2);
}

function getDistractedModifier(rollType: string): number {
    const mod: number = rollType === CONST.ROLL_TYPES.TRAIT && getState(distractedToggle) ? -2 : 0;
    return mod;
}

function getWildAttackModifier(rollType: string): number {
    const mod: number = rollType != CONST.ROLL_TYPES.STANDARD && getState(wildAttackToggle) ? 2 : 0;
    return mod;
}

function getTheDropModifier(rollType: string): number {
    const mod: number = rollType != CONST.ROLL_TYPES.STANDARD && getState(theDropToggle) ? 4 : 0;
    return mod;
}

function getVulnerableModifier(rollType: string): number {
    const mod: number = rollType != CONST.ROLL_TYPES.STANDARD && getState(vulnerableToggle) ? 2 : 0;
    return mod;
}

function getGangUpModifier(rollType: string): number {
    const mod: number = rollType === CONST.ROLL_TYPES.TRAIT ? getValue(gangUpToggle): 0;
    return mod;
}

function getCalledShotModifier(rollType: string): number {
    // can't call shots on a door
    if (getState(breakingObjectsToggle)) return 0;
    const val: number = getValue(calledShotToggle);
    let result: number = 0;
    if (rollType === CONST.ROLL_TYPES.TRAIT) {

    } else if (rollType === CONST.ROLL_TYPES.DAMAGE) {
        if (val === CalledShot.Head) result = 4;
    }
    return result;
}
function getCoverModifier(rollType: string): number {
    const val: number = rollType === CONST.ROLL_TYPES.TRAIT ? getValue(coverToggle) : 0;
    return val * -2;
}
function getRangeModifier(rollType: string): number {
    const val: number = rollType === CONST.ROLL_TYPES.TRAIT ? getValue(rangeToggle) : 0;
    return val === Range.Extreme_Range ? -8 : val * -2;
}

function getTotalModifier(rollType: string): number {
    return getModifier()
        + getJokerModifier(rollType)
        + getWoundsModifier(rollType)
        + getIllumModifier(rollType)
        + getMultiModifier(rollType)
        + getDistractedModifier(rollType)
        + getWildAttackModifier(rollType)
        + getCalledShotModifier(rollType)
        + getCoverModifier(rollType)
        + getRangeModifier(rollType)
        + getTheDropModifier(rollType)
        + getVulnerableModifier(rollType)
        + getGangUpModifier(rollType)
}

function isWildDieActive(): boolean {
    return getRollType() === CONST.ROLL_TYPES.TRAIT && getState(wildDieToggle)
}
function isBonusDamageActive(): boolean {
    return getRollType() === CONST.ROLL_TYPES.DAMAGE && getState(bonusDamageToggle)
}

function getWildDieValue(): number {
    return parseInt(wildDieType.value.slice(1))
}
class DiceConfig {
    modifier: number = 0
    sides: number = 0
    isWildDie: boolean = false
    isBonusDie: boolean = false
    themeColor: string = ''
    textColor: string = ''
}

function isDiceToRoll() {
    let count = 0;
    for (const die of document.querySelectorAll('.counter')) {
        if (die.parentElement!.style.display != 'none') {
            const num = parseInt(die.textContent && die.textContent != '' ? die.textContent : '0')
            count += num;
        }
    }
    return count > 0;
}

async function rollTheDice() {
    if (!isDiceToRoll()) return;
    RollCollection = new SWDR();
    DB.isReroll = false;
    DB.targetNumber = getTargetNumber();
    // Clear the dice box
    DB.clear()

    // Reassign the current roll type
    DB.rollType = getRollType();
    const DICE_CONFIGS: DiceConfig[] = [];

    // Build the dice configs for each die.
    for (const DIE of document.querySelectorAll('.counter')) {
        const num = parseInt(DIE.textContent && DIE.textContent != '' ? DIE.textContent : '0')
        const numsides = parseInt(DIE.id.slice(1))
        for (let i = 0; i < num; ++i) {
            DICE_CONFIGS.push({
                modifier: getTotalModifier(DB.rollType),
                sides: numsides,
                isWildDie: false,
                isBonusDie: false,
                themeColor: numsides < 100 ? CONST.COLOR_THEMES.PRIMARY : Util.randomizeHue(CONST.COLOR_THEMES.PRIMARY),
                textColor: CONST.COLOR_THEMES.NUMBER,
            });
        }
    }
    //add wild die to roll
    if (isWildDieActive()) {
        DICE_CONFIGS.push({
            modifier: getTotalModifier(DB.rollType),
            sides: getWildDieValue(),
            isWildDie: true,
            isBonusDie: false,
            themeColor: CONST.COLOR_THEMES.SECONDARY,
            textColor: CONST.COLOR_THEMES.NUMBER_SECONDARY,
        });
    }
    if (isBonusDamageActive()) {
        DICE_CONFIGS.push({
            modifier: getTotalModifier(DB.rollType),
            sides: 6,
            isWildDie: false,
            isBonusDie: true,
            themeColor: CONST.COLOR_THEMES.BONUS,
            textColor: CONST.COLOR_THEMES.NUMBER_BONUS,
        });

    }
    DB.acing = canAce(DB.rollType, getState(breakingObjectsToggle))
    DB.dieLabel = getDieLabel(DB.rollType)

    clearCounters();
    if (DICE_CONFIGS.length > 0) {
        playAudio();
        await DB.roll(DICE_CONFIGS, { newStartPoint: true });
    }
}
function canAce(rollType: string, breaking: boolean): boolean {
    let result = false;
    switch (rollType) {
        case CONST.ROLL_TYPES.TRAIT:
            result = true
            break;
        case CONST.ROLL_TYPES.DAMAGE:
            result = !breaking;
            break;
        case CONST.ROLL_TYPES.STANDARD:
            result = false;
            break;
    }
    return result;
}

function getDieLabel(rollType: string,): string {
    let result = CONST.DIELABELS.STANDARD;
    switch (rollType) {
        case CONST.ROLL_TYPES.TRAIT:
            result = CONST.DIELABELS.TRAIT;
            break;
        case CONST.ROLL_TYPES.DAMAGE:
            result = CONST.DIELABELS.DAMAGE;
            break;
        case CONST.ROLL_TYPES.STANDARD:
            result = CONST.DIELABELS.STANDARD;
            break;
    }
    return result;
}

async function rerollTheDice() {
    RollCollection = new SWDR();
    await setPlayer(RollCollection)
    const player_history: SWDR[] = [...ROLL_HISTORY].reverse().filter(item => item.playerId === RollCollection.playerId);
    if (player_history.length > 0) {
        const LAST_ROLL = player_history[0];
        DB.isReroll = true;
        DB.targetNumber = getTargetNumber();
        DB.rollType = LAST_ROLL.rollType;
        DB.acing = canAce(LAST_ROLL.rollType, getState(breakingObjectsToggle))
        DB.dieLabel = getDieLabel(LAST_ROLL.rollType)
        DB.clear();

        const DICE_CONFIGS = []

        for (const DIE_ROLL of LAST_ROLL.rollResult.filter(d => d.dieLabel !== 'Critical Failure Check')) {
            DICE_CONFIGS.push({
                sides: DIE_ROLL.sides,
                modifier: DIE_ROLL.modifier,
                isWildDie: DIE_ROLL.isWildDie,
                isBonusDie: DIE_ROLL.isBonusDie,
                themeColor: DIE_ROLL.themeColor,
                textColor: DIE_ROLL.isWildDie ? CONST.COLOR_THEMES.NUMBER_SECONDARY : DIE_ROLL.isBonusDie ? CONST.COLOR_THEMES.NUMBER_BONUS : CONST.COLOR_THEMES.NUMBER,
            });
        }

        if (LAST_ROLL.rollResult.length) {
            playAudio();
            await DB.roll(DICE_CONFIGS, { newStartPoint: true });
        }
    }
}

async function adjustTheRoll() {
    const pid = playerCache.ready ? playerCache.id : await OBR.player.getId();
    let update = false;
    const RECENT_ROLLS = [...ROLL_HISTORY].reverse()
    const LAST_ROLL = RECENT_ROLLS[0];
    const DBrollType = LAST_ROLL.rollType;
    const ROLL_TYPE = getRollType();
    const NEW_MODIFIER = getTotalModifier(DBrollType);
    const NEW_TARGET_NUMBER = getTargetNumber();
    const IS_JOKER = LAST_ROLL.isJoker;
    const IS_WOUND = LAST_ROLL.isWound;
    const LOG_ENTRY_WRAPPER_ELEMENTS: NodeListOf<HTMLElement> = document.querySelectorAll('.log-entry-wrapper');

    for (const LOG_ENTRY_WRAPPER_ELEMENT of LOG_ENTRY_WRAPPER_ELEMENTS) {
        let QUIT_LOOP = false
        if (LOG_ENTRY_WRAPPER_ELEMENT.dataset.pid === pid && DBrollType === ROLL_TYPE) {
            const INDEX = Array.from(LOG_ENTRY_WRAPPER_ELEMENTS).indexOf(LOG_ENTRY_WRAPPER_ELEMENT);
            const IS_REROLL = LOG_ENTRY_WRAPPER_ELEMENT.dataset.isReroll === 'true';
            const IS_NEW_ROLL = !IS_REROLL && INDEX === 0;
            const PREV_ENTRY: HTMLElement = LOG_ENTRY_WRAPPER_ELEMENT.previousElementSibling as HTMLElement
            const IS_ORIGINAL_ROLL = !IS_REROLL && PREV_ENTRY && PREV_ENTRY.dataset?.isReroll === 'true';

            if (IS_NEW_ROLL || IS_REROLL || IS_ORIGINAL_ROLL) {
                LOG_ENTRY_WRAPPER_ELEMENT.querySelector('.modifier')?.remove();
                const OUTPUT_ELEMENT = LOG_ENTRY_WRAPPER_ELEMENT.querySelector('.output') as HTMLElement;
                const TOTAL_ELEMENT = LOG_ENTRY_WRAPPER_ELEMENT.querySelector('.total') as HTMLElement;
                const DESCRIPTION_ELEMENT = LOG_ENTRY_WRAPPER_ELEMENT.querySelector('.description') as HTMLElement;
                let total = Number(TOTAL_ELEMENT!.innerText);
                const NEW_TOTAL = isNaN(total) ? 0 : total - RECENT_ROLLS[INDEX].modifier + NEW_MODIFIER;

                OUTPUT_ELEMENT.innerHTML = '';

                if (NEW_MODIFIER !== 0 || IS_JOKER || IS_WOUND) {
                    let mod = signModOutput(NEW_MODIFIER, IS_JOKER, IS_WOUND);
                    OUTPUT_ELEMENT.insertAdjacentHTML('afterbegin', mod);
                }

                const TRAIT_ROLLS = LAST_ROLL.rollResult.filter(d => d.dieLabel === CONST.DIELABELS.TRAIT);

                ///if (TRAIT_ROLLS.length === 1 || DBrollType !== CONST.ROLL_TYPES.TRAIT) {
                if ((DBrollType === CONST.ROLL_TYPES.TRAIT && TRAIT_ROLLS.length <= 1) || DBrollType !== CONST.ROLL_TYPES.TRAIT) {
                    TOTAL_ELEMENT.innerText = NEW_TOTAL.toString();
                    DESCRIPTION_ELEMENT.innerText = DBrollType === CONST.ROLL_TYPES.STANDARD ? '' : calculateRaises(NEW_TOTAL, NEW_TARGET_NUMBER)
                } else if (DBrollType === CONST.ROLL_TYPES.TRAIT && TRAIT_ROLLS.length > 1) {
                    const successfulDice = TRAIT_ROLLS.filter(d => d.value >= NEW_TARGET_NUMBER);
                    let successes = successfulDice.length;
                    let highest = successfulDice.length > 0 ? Math.max(...successfulDice.map(d => d.value)) : 0;
                    const WILD_DIE_RESULT = RECENT_ROLLS[INDEX].rollResult.find(d => d.isWildDie);
                    if (WILD_DIE_RESULT && WILD_DIE_RESULT.value >= NEW_TARGET_NUMBER) {
                        successes += 1;
                        highest = Math.max(highest, WILD_DIE_RESULT.value);
                    }
                    const raises = highest >= NEW_TARGET_NUMBER ? Math.floor((highest - NEW_TARGET_NUMBER) / 4) : 0;
                    const NEW_TOTAL = successes;
                    TOTAL_ELEMENT.innerText = NEW_TOTAL.toString();
                    TOTAL_ELEMENT.style.color = 'gold';
                    DESCRIPTION_ELEMENT.innerText = `${successes} Successes with ${raises} Raises`;
                }
                DESCRIPTION_ELEMENT.innerText = `${CONST.EMOJIS.ADJUST}${IS_REROLL ? CONST.EMOJIS.REROLL : ''}${DESCRIPTION_ELEMENT.innerText}`

                RECENT_ROLLS[INDEX].modifier = NEW_MODIFIER;
                RECENT_ROLLS[INDEX].total = NEW_TOTAL;
                RECENT_ROLLS[INDEX].targetNumber = NEW_TARGET_NUMBER;
                RECENT_ROLLS[INDEX].description = DESCRIPTION_ELEMENT.innerText;
                RECENT_ROLLS[INDEX].isAdjustment = true;
                let rollDetails = '';

                for (const DIE_ROLL of RECENT_ROLLS[INDEX].rollResult) {
                    DIE_ROLL.value = DIE_ROLL.value - DIE_ROLL.modifier + NEW_MODIFIER //remove old mod, add new mod
                    //DBrollType === CONST.ROLL_TYPES.TRAIT ? DIE_ROLL.value - DIE_ROLL.modifier + NEW_MODIFIER : DIE_ROLL.value;
                    DIE_ROLL.modifier = NEW_MODIFIER;
                    rollDetails += markupDieRollDetails(DIE_ROLL, DBrollType, RECENT_ROLLS[INDEX].isJoker, RECENT_ROLLS[INDEX].isWound, NEW_TARGET_NUMBER);
                }

                if (DBrollType === CONST.ROLL_TYPES.TRAIT && TRAIT_ROLLS.length > 1) {
                    TRAIT_ROLLS.forEach(die => {
                        rollDetails += markupDieRollDetails(die, DBrollType, RECENT_ROLLS[INDEX].isJoker, RECENT_ROLLS[INDEX].isWound, NEW_TARGET_NUMBER);
                    });
                    const WILD_DIE_RESULT = RECENT_ROLLS[INDEX].rollResult.find(d => d.isWildDie);
                    if (WILD_DIE_RESULT) {
                        rollDetails += markupDieRollDetails(WILD_DIE_RESULT, DBrollType, RECENT_ROLLS[INDEX].isJoker, RECENT_ROLLS[INDEX].isWound, NEW_TARGET_NUMBER);
                    }
                }

                OUTPUT_ELEMENT.insertAdjacentHTML('beforeend', rollDetails);
                update = true
            }

            if (IS_NEW_ROLL || IS_ORIGINAL_ROLL) {
                QUIT_LOOP = true
                break;
            }
        }
        if (QUIT_LOOP) {
            break;
        }
    }
    if (update) {
        updateStorage(ROLL_HISTORY)
    }
}

async function renderLog(ROLL_HISTORY: SWDR[]) {
    ROLL_HISTORY.forEach(roll => {
        const LOG_ENTRY_WRAPPER_ELEMENT = document.createElement('fieldset')
        LOG_ENTRY_WRAPPER_ELEMENT.classList.add('log-entry-wrapper')
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.rolltype = roll.rollType
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.isreroll = roll.isReroll.toString()
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.targetnumber = roll.targetNumber.toString()
        LOG_ENTRY_WRAPPER_ELEMENT.dataset.pid = roll.playerId
        buildOutputHTML(roll, roll.rollType, roll.rollResult, LOG_ENTRY_WRAPPER_ELEMENT)
    });
}
