import DiceBox from "@3d-dice/dice-box";
import { Util } from './util';
import './styles.css';
import { CONST } from "./constants";
import buttonsImage from './buttons.svg';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <object id="buttons-svg" width="0" height="0" data="${buttonsImage}" type="image/svg+xml"></object>   
`
window.addEventListener("load", () => {
    const svgButtons = document.getElementById('buttons-svg') as HTMLObjectElement
    if (svgButtons.contentDocument) {
        console.log("Button images loaded");
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
        Util.setImage('trash-can', removeDiceButton, '--button-size')

        Util.setImage('anticlockwise', resetButton, '--button-size')
        Util.setImage('shatter', colorButton, '--button-size')
        Util.setImage('broom', clearButton, '--button-size')
        Util.setImage('d4_die', d4Button, '--die-size')
        Util.setImage('d6_die', d6Button, '--die-size')
        Util.setImage('d8_die', d8Button, '--die-size')
        Util.setImage('d10_die', d10Button, '--die-size')
        Util.setImage('d12_die', d12Button, '--die-size')
        Util.setImage('d20_die', d20Button, '--die-size')
        Util.setImage('d100_die', d100Button, '--die-size')
    } else {
        console.error("Failed to load SVG document")
    }
})

// setting variables
// get inputs
const radios = document.querySelectorAll('.custom-radio') as NodeListOf<SVGElement>;
const traitdice = document.getElementById('traitdice') as unknown as SVGElement;
const damagedice = document.getElementById('damagedice') as unknown as SVGElement;
const standarddice = document.getElementById('standarddice') as unknown as SVGElement;
const targetNumberButton = document.getElementById('targetNumberButton') as unknown as SVGElement;
const targetNumberSpinner = document.getElementById('targetNumber') as HTMLInputElement;
const modifierButton = document.getElementById('modifierButton') as unknown as SVGElement;
const modifierSpinner = document.getElementById('modifier') as HTMLInputElement;
const wildDieToggle = document.getElementById('wildDieToggle') as unknown as SVGElement;
const wildDieType = document.getElementById('wildDieType') as unknown as HTMLSelectElement;
const bonusDamageToggle = document.getElementById('bonusDamageToggle') as unknown as SVGElement;
const breakingObjectsToggle = document.getElementById('breakingObjectsToggle') as unknown as SVGElement;
const opposedRollToggle = document.getElementById('opposedRollToggle') as unknown as SVGElement;
const jokerDrawnToggle = document.getElementById('jokerDrawnToggle') as unknown as SVGElement;
const adjustButton = document.getElementById('adjustButton') as unknown as SVGElement;
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

//setup click handlers
setupRadio();

setupSvgToggle(targetNumberButton);
setupSvgToggle(modifierButton);
setupSvgToggle(wildDieToggle);
setupSvgToggle(bonusDamageToggle);
setupSvgToggle(breakingObjectsToggle);
setupSvgToggle(opposedRollToggle);
setupSvgToggle(jokerDrawnToggle);
setupSvgToggle(adjustButton);
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

// initialize
resetToDefaults();

// Initial log
console.log('Initial Target Number:', targetNumberSpinner.value);
console.log('Initial Modifier:', modifierSpinner.value);
console.log('Globals: ', CONST)
console.log('Savage Dice for Owlbear is online and fully functional.')

// Radio button 
function setupRadio(): void {
    radios.forEach(radio => {
        radio.addEventListener('click', function () {
            setRadio(this);
        });
    });
}

function getRollType(): string {
    let ret = 'trait'
    for (let radio of radios) {
        if (radio.classList.contains('active')) {
            ret = radio.getAttribute('data-value')!
        }
    }
    return ret
}

function setState(svgElement: SVGElement, state: boolean) {
    if (state) {
        svgElement.classList.add('active');
        svgElement.classList.remove('inactive');
    } else {
        svgElement.classList.remove('active');
        svgElement.classList.add('inactive');
    }
}
function getState(svgElement: SVGElement) {
    return svgElement.classList.contains('active')
}

function toggleState(svgElement: SVGElement) {
    let state = !getState(svgElement);
    setState(svgElement, state);
}

// Reset functionality for spinners
function setSpinner(input: HTMLInputElement, val: string) {
    input.value = val;
}
function setSelect(input: HTMLSelectElement, val: string) {
    input.value = val;
}
// Reset functionality for all controls
function resetToDefaults() {
    setSpinner(targetNumberSpinner, CONST.DEFAULTS.TARGET_NUMBER);
    setSpinner(modifierSpinner, CONST.DEFAULTS.MODIFIER);
    setState(wildDieToggle, CONST.DEFAULTS.WILD_DIE_ENABLED);
    setSelect(wildDieType, CONST.DEFAULTS.WILD_DIE);
    setState(bonusDamageToggle, CONST.DEFAULTS.BONUS_DAMAGE);
    setState(breakingObjectsToggle, CONST.DEFAULTS.BREAK_OBJECTS);
    setState(opposedRollToggle, CONST.DEFAULTS.OPPOSED_ENABLED);
    setState(jokerDrawnToggle, CONST.DEFAULTS.JOKER_DRAWN_ENABLED);
    setRadio(traitdice);
    clearCounters();
}

// reset for counters
function clearCounters() {
    for (let sp of document.querySelectorAll<HTMLElement>('.counter')) {
        updateCounter(sp, -getCounter(sp))
    }
}

async function opposedRollSet() {
    const RECENT_ROLLS = [...ROLL_HISTORY].reverse();       //.toReversed();
    for (let lr of RECENT_ROLLS) {
        if (lr.rollType === CONST.ROLL_TYPES.TRAIT) {
            setSpinner(targetNumberSpinner, `${lr.total}`)
            break;
        }
    }
}

function setRadio(svg: SVGElement) {
    radios.forEach(r => setState(r, false));
    setState(svg, true);
    const selectedRadio = svg.getAttribute('data-value') || 'trait';
    showHideControls(selectedRadio);
    console.log('Selected:', selectedRadio);
}

// Toggle click handler
function setupSvgToggle(svgElement: SVGElement) {
    svgElement.addEventListener('click', function (): void {
        if (svgElement === targetNumberButton) {
            setSpinner(targetNumberSpinner, CONST.DEFAULTS.TARGET_NUMBER);
        } else if (svgElement === modifierButton) {
            setSpinner(modifierSpinner, CONST.DEFAULTS.MODIFIER);
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
            if (dice_color>DICECOLORS.length-1) dice_color=0;
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
    DB.clear();
}

function showHideControls(selectedRadio: string) {
    let show = ''
    let hide = 'none'
    switch (true) {
        case selectedRadio === 'trait': {
            targetNumberButton.style.display = show;
            targetNumberSpinner.style.display = show;
            modifierButton.style.display = show;
            modifierSpinner.style.display = show;
            wildDieToggle.style.display = show;
            wildDieType.style.display = show;
            opposedRollToggle.style.display = show;
            jokerDrawnToggle.style.display = show;
            bonusDamageToggle.style.display = hide;
            breakingObjectsToggle.style.display = hide;

            d4Button.parentElement!.style.display = show;
            d6Button.parentElement!.style.display = show;
            d8Button.parentElement!.style.display = show;
            d10Button.parentElement!.style.display = show;
            d12Button.parentElement!.style.display = show;
            d20Button.parentElement!.style.display = hide;
            d100Button.parentElement!.style.display = hide;
            break;
        }
        case selectedRadio === 'damage': {
            targetNumberButton.style.display = show;
            targetNumberSpinner.style.display = show;
            modifierButton.style.display = show;
            modifierSpinner.style.display = show;
            bonusDamageToggle.style.display = show;
            breakingObjectsToggle.style.display = show;
            jokerDrawnToggle.style.display = show;

            wildDieToggle.style.display = hide;
            wildDieType.style.display = hide;
            opposedRollToggle.style.display = hide;

            d4Button.parentElement!.style.display = show;
            d6Button.parentElement!.style.display = show;
            d8Button.parentElement!.style.display = show;
            d10Button.parentElement!.style.display = show;
            d12Button.parentElement!.style.display = show;
            d20Button.parentElement!.style.display = hide;
            d100Button.parentElement!.style.display = hide;
            break;
        }
        case selectedRadio === 'standard': {
            modifierButton.style.display = show;
            modifierSpinner.style.display = show;

            targetNumberButton.style.display = hide;
            targetNumberSpinner.style.display = hide;
            bonusDamageToggle.style.display = hide;
            breakingObjectsToggle.style.display = hide;
            wildDieToggle.style.display = hide;
            wildDieType.style.display = hide;
            opposedRollToggle.style.display = hide;
            jokerDrawnToggle.style.display = hide;

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

function setDiceColor(n:number) {
    n=Math.max(0,Math.min(n,DICECOLORS.length-1))
    CONST.COLOR_THEMES.PRIMARY = DICECOLORS[n];
    CONST.COLOR_THEMES.SECONDARY = Util.getContrast(CONST.COLOR_THEMES.PRIMARY);
    CONST.COLOR_THEMES.BONUS = Util.getMidpointColor(CONST.COLOR_THEMES.PRIMARY, CONST.COLOR_THEMES.SECONDARY)
}

//const BREAKING_THINGS_ELEMENT = document.querySelector('#breakingObjectsToggle')!;
//const TARGET_NUMBER_ELEMENT = document.querySelector('#target-number')!;
//const MODIFIER_INPUT_ELEMENT = document.querySelector('#modifier')!;
//const WILD_DIE_TYPE_ELEMENT = document.querySelector('#wildDieType')!;
const LOG_ENTRIES_ELEMENT = document.querySelector('#log-entries')!;
const LOCAL_STORAGE_KEYS = {
    //displayName: 'yourName',
    // webhookUrl: 'webhookUrl',
    rollHistory: 'rollHistory',
};

/*
////start new stuffs
// Get input/output elements

const HAS_WILD_DIE_ELEMENT = document.querySelector('#wild-die');

const BREAKING_THINGS_ELEMENT = document.querySelector('#breaking-things');
const TARGET_NUMBER_ELEMENT = document.querySelector('#target-number');
const MODIFIER_INPUT_ELEMENT = document.querySelector('#modifier-input');
const DICE_BAG_ELEMENT = document.querySelector('.dice-bag');
const DICE_CUP_ELEMENT = document.querySelector('.dice-cup');
//x Setup Discord variables 
const APP_NAME = "Savage Owlbear Dice";
const APP_URL = ''

const WEBHOOK_URL_ELEMENT = document.querySelector('#webhook-url');
const YOUR_NAME_ELEMENT = document.querySelector('#your-name');
const DISCORD_SETTINGS = {
    displayName: localStorage.getItem(LOCAL_STORAGE_KEYS.displayName),
    webhookURL: localStorage.getItem(LOCAL_STORAGE_KEYS.webhookUrl),
};
WEBHOOK_URL_ELEMENT.value = DISCORD_SETTINGS.webhookURL;
YOUR_NAME_ELEMENT.value = DISCORD_SETTINGS.displayName;

if (!DISCORD_SETTINGS.displayName) {
    DISCORD_SETTINGS.displayName = APP_NAME;
}
    */
class SWDR {
    criticalFailure: boolean = false
    description: string | null = ''
    rollType: string = ''
    isReroll: boolean = false
    modifier: number = 0
    rollResult: RollResult[] = []
    total: number = 0
    onesCount: number = 0
    isJoker: boolean = false
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
    modifier: number = 0
    qty: number = 0
    rolls: DieResult[] = []
    sides: string = 'd6'
    themeColor: string = '#ecd69b'
    value: number = 0
}
let RollCollection: SWDR = new SWDR();

const ROLL_HISTORY: SWDR[] = [];
const DICECOLORS = Util.generateColorCodes();
let dice_color=0;
setDiceColor(dice_color);
const DB = new DiceBox("#dice-tray", {
    id: 'dice-tray',
    assetPath: "/assets/",
    theme: "default",
    themeColor: CONST.COLOR_THEMES.PRIMARY,
    offscreen: true,
    scale: 4,
    friction: .75,
    restitution: 0,
    gravity: 15,
    throwForce: 20,
    spinForce: 20,
    settleTimeout: 3000,
    //mass: 40,
    delay: 100,
    //lightIntensity: 1,
    discordResponse: null,
    onDieComplete: async (dieResult: DieResult) => {
        if (DB.acing && dieResult.value === sidesNumber(dieResult.sides)) {
            await DB.add(dieResult);
        }
    },
    onRollComplete: async (rollResult: RollResult[]) => {
        RollCollection.rollType = DB.rollType;
        const LOG_ENTRY_WRAPPER_ELEMENT = document.createElement('div');
        LOG_ENTRY_WRAPPER_ELEMENT.classList.add('log-entry-wrapper');
        LOG_ENTRY_WRAPPER_ELEMENT.setAttribute('data-roll-type', DB.rollType);
        LOG_ENTRY_WRAPPER_ELEMENT.setAttribute('data-is-reroll', DB.isReroll);


        // Continue only if every roll has been resolved.
        const ROLL_IS_COMPLETE = rollResult.every(rr => rr.rolls?.every(dr => dr.value));

        if (ROLL_IS_COMPLETE) {
            for (const DIE_ROLL of rollResult) {
                switch (DB.rollType) {
                    case 'trait':
                        DIE_ROLL.dieLabel = DIE_ROLL.isWildDie ? CONST.DIELABELS.WILD : CONST.DIELABELS.TRAIT;
                        break;
                    case 'damage':
                        DIE_ROLL.dieLabel = DIE_ROLL.isBonusDie ? CONST.DIELABELS.BONUS : CONST.DIELABELS.DAMAGE;
                        break;
                    case 'standard':
                        DIE_ROLL.dieLabel = CONST.DIELABELS.STANDARD;
                        break;
                }

                DIE_ROLL.rollDetails = breakdownResult(DIE_ROLL);
            }

            RollCollection.isReroll = DB.isReroll;
            RollCollection.modifier = rollResult[0].modifier;
            RollCollection.isJoker = getState(jokerDrawnToggle);
            RollCollection.rollResult = rollResult;

            if (DB.rollType === CONST.ROLL_TYPES.TRAIT) {
                RollCollection.onesCount = rollResult.filter(d => d.rolls[0].value === 1).length;
                const TRAIT_DICE_ROLLED = rollResult.find(d => !d.isWildDie);
                const IS_SINGLE_TRAIT_DIE = DB.rollType === CONST.ROLL_TYPES.TRAIT && rollResult.filter(d => !d.isWildDie).length === 1;
                if (TRAIT_DICE_ROLLED != undefined) {
                    RollCollection.total = IS_SINGLE_TRAIT_DIE ? TRAIT_DICE_ROLLED.value : 0;
                } else {
                    RollCollection.total = 0
                }
                const WILD_DIE_RESULT = rollResult.find(d => d.isWildDie);

                if (WILD_DIE_RESULT && IS_SINGLE_TRAIT_DIE) {
                    // If it's not a crit fail and is a single die, compare the values.
                    if (TRAIT_DICE_ROLLED != undefined) {
                        const HIGHER = WILD_DIE_RESULT.value > TRAIT_DICE_ROLLED.value ? WILD_DIE_RESULT.value : TRAIT_DICE_ROLLED.value;
                        RollCollection.total = HIGHER;
                    }
                }

                const POTENTIAL_CRIT_FAIL = WILD_DIE_RESULT ? RollCollection.onesCount > Math.floor(rollResult.length / 2) : RollCollection.onesCount >= rollResult.length / 2;

                if (POTENTIAL_CRIT_FAIL) {
                    if (WILD_DIE_RESULT && WILD_DIE_RESULT?.rolls[0].value === 1) {
                        RollCollection.criticalFailure = true;
                        RollCollection.total = 0;
                    } else if (!WILD_DIE_RESULT) {
                        DB.acing = false;
                        DB.rollType = CONST.ROLL_TYPES.CRITICAL_FAILURE_CHECK;
                        const CRIT_FAIL_CHECK_DIE_RESULT = await DB.add({
                            sides: getWildDieValue(),
                            modifier: 0,
                            themeColor: CONST.COLOR_THEMES.CRITICAL_FAILURE_DIE,
                        }) as RollResult[];
                        const CRIT_DIE_ROLL = CRIT_FAIL_CHECK_DIE_RESULT[0];
                        CRIT_DIE_ROLL.dieLabel = 'Critical Failure Check',
                            CRIT_DIE_ROLL.isWildDie = false,
                            CRIT_DIE_ROLL.rollDetails = breakdownResult(CRIT_DIE_ROLL),
                            RollCollection.criticalFailure = CRIT_DIE_ROLL.value === 1;
                        const tdrvalue = TRAIT_DICE_ROLLED ? TRAIT_DICE_ROLLED.value : 0;
                        RollCollection.total = RollCollection.criticalFailure ? 0 : tdrvalue;
                        rollResult.push(CRIT_DIE_ROLL);
                        // Update the roll collection
                        RollCollection.rollResult = rollResult;
                    }
                }

                const TOTAL_VALUE = IS_SINGLE_TRAIT_DIE ? RollCollection.total : 0;
                let descriptionString: string | null = IS_SINGLE_TRAIT_DIE ? calculateRaises(RollCollection.total) : 'See results';

                // Build output HTML
                let rollDetails = '';

                for (const DIE_ROLL of rollResult) {
                    rollDetails += markupDieRollDetails(DIE_ROLL, RollCollection.isJoker);
                }

                // Format the roll details (i.e., break down of each die, if it aced, and whatever modifier might be applied).
                const ROLL_DETAILS_ELEMENT = createRollDetailsElement(`${RollCollection.modifier !== 0 ? signModOutput(RollCollection.modifier, RollCollection.isJoker) : ''}${rollDetails}`);

                if (RollCollection.criticalFailure) {
                    descriptionString = `Critical Failure! ${CONST.EMOJIS.CRITICAL_FAILURE}`;
                }

                RollCollection.description = descriptionString;
                const RESULTS = markupResult(TOTAL_VALUE, { description: descriptionString });
                LOG_ENTRY_WRAPPER_ELEMENT.append(ROLL_DETAILS_ELEMENT);

                for (const ELEMENT of RESULTS) {
                    LOG_ENTRY_WRAPPER_ELEMENT.append(ELEMENT);
                }

                LOG_ENTRIES_ELEMENT?.prepend(LOG_ENTRY_WRAPPER_ELEMENT);
                updateRollHistory({ ...RollCollection });
            } else if ([CONST.ROLL_TYPES.DAMAGE, CONST.ROLL_TYPES.STANDARD].includes(DB.rollType)) {
                RollCollection.total = 0;

                let rollDetailsElement = document.querySelector('.output');

                // Loop through each die roll and output.
                for (const DIE_ROLL of rollResult) {
                    DIE_ROLL.value = DIE_ROLL.value - DIE_ROLL.modifier;
                    RollCollection.total += DIE_ROLL.value;
                }

                // Add the modifier to the total.
                RollCollection.total += RollCollection.modifier;
                const DESCRIPTION_STRING = DB.rollType === CONST.ROLL_TYPES.DAMAGE ? calculateRaises(RollCollection.total) : null;
                RollCollection.description = DESCRIPTION_STRING ? DESCRIPTION_STRING : '';
                let rollDetails = '';

                for (const DIE_ROLL of rollResult) {
                    rollDetails += markupDieRollDetails(DIE_ROLL,RollCollection.isJoker);
                }

                // Format the roll details (i.e., break down of each die, if it aced, and whatever modifier might be applied).
                rollDetailsElement = createRollDetailsElement(`${RollCollection.modifier !== 0 ? signModOutput(RollCollection.modifier, RollCollection.isJoker) : ''}${rollDetails}`);
                LOG_ENTRY_WRAPPER_ELEMENT.append(rollDetailsElement);
                // Generate the HTML markup for the description and result value.
                const RESULTS = markupResult(RollCollection.total, { description: DESCRIPTION_STRING! });

                for (const ELEMENT of RESULTS) {
                    LOG_ENTRY_WRAPPER_ELEMENT.append(ELEMENT);
                }

                LOG_ENTRIES_ELEMENT?.prepend(LOG_ENTRY_WRAPPER_ELEMENT);
                updateRollHistory({ ...RollCollection });
            }

            resizeLogElement();

            if (window.innerWidth < 800) {
                document.querySelector('#dice-tray')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }

            // if (DISCORD_SETTINGS.webhookURL) {
            //     const LAST_ROLL = ROLL_HISTORY.toReversed()[0];
            //     LAST_ROLL.discordResponse = await sendToDiscord(LAST_ROLL);
            // }
        }
    }
});

DB.init();

function updateRollHistory(roll: SWDR) {
    ROLL_HISTORY.push(roll);
    localStorage.setItem(LOCAL_STORAGE_KEYS.rollHistory, JSON.stringify(ROLL_HISTORY));
}

function getTargetNumber(): number {
    return targetNumberSpinner.valueAsNumber
}
// Determine the amount of successes and raises and build description text.
function calculateRaises(rollResult: number) {
    // Get the target number and create empty variables for raises and description.
    let raises = 0;
    let description = '';
    let targetnumber = getTargetNumber()

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
function markupResult(rollTotal: number, options = { description: '' }) {
    const DESCRIPTION: string | null = options.description;
    const DIE_LABEL: string = RollCollection.rollResult[0]?.dieLabel;

    const RESULT_ELEMENT = document.createElement('h2');
    RESULT_ELEMENT.classList.add('total');
    RESULT_ELEMENT.innerText = rollTotal.toString();
    const DESCRIPTION_ELEMENT = document.createElement('p');
    DESCRIPTION_ELEMENT.classList.add('description');

    // If the description of successes and raises hasn't been created yet, generate one.
    if (!DESCRIPTION && [CONST.DIELABELS.TRAIT, CONST.DEFAULTS.BONUS_DAMAGE, CONST.DIELABELS.BONUS].includes(DIE_LABEL)) {
        RollCollection.description = calculateRaises(rollTotal);
    } else if (DESCRIPTION || DIE_LABEL === CONST.DIELABELS.STANDARD) {
        RollCollection.description = DESCRIPTION;
    }

    DESCRIPTION_ELEMENT.innerText = RollCollection.description!;

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
    let ROLLS: DieResult[] = []
    ROLLS = dieResult.rolls;
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

function signModOutput(modifier: number, joker: boolean) {
    return `<p class="modifier" data-modifier="${modifier}">Modifier: ${modifier < 0 ? '−' : '+'}${Math.abs(modifier)}${joker ? CONST.EMOJIS.JOKER : ''}</p>`;
}

function markupDieRollDetails(dieRoll: RollResult, joker:boolean) {
    const SHOW_MODIFIER = DB.rollType === CONST.ROLL_TYPES.TRAIT && (dieRoll.modifier !== 0 || joker);
    const SHOW_BREAKDOWN = dieRoll.rollDetails.includes(CONST.EMOJIS.ACE);
    const SHOW_MATH = SHOW_BREAKDOWN || SHOW_MODIFIER;
    const LABEL = `${dieRoll.dieLabel} (d${sidesNumber(dieRoll.sides)}):`;
    const BREAKDOWN = SHOW_MATH ? dieRoll.rollDetails : '';
    const MODIFIER = SHOW_MODIFIER ? `${dieRoll.modifier < 0 ? '-' : '+'} ${Math.abs(dieRoll.modifier)}` : '';

    return `
        <p data-die-sides="${sidesNumber(dieRoll.sides)}" data-roll-value="${dieRoll.value}">
            ${LABEL} ${BREAKDOWN} ${MODIFIER} ${SHOW_MATH ? '=' : ''} <strong>${dieRoll.value}</strong>
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

function getModifier(): number {
    return modifierSpinner.valueAsNumber
}
function getJokerModifier(): number {
    const jokemod: number = getState(jokerDrawnToggle) && getRollType() != 'standard' ? 2 : 0;
    return getModifier() + jokemod
}
function isWildDieActive(): boolean {
    return getRollType() === 'trait' && getState(wildDieToggle)
}
function isBonusDamageActive(): boolean {
    return getRollType() === 'damage' && getState(bonusDamageToggle)
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
                modifier: getJokerModifier(),
                sides: numsides,
                isWildDie: false,
                isBonusDie: false,
                themeColor: CONST.COLOR_THEMES.PRIMARY,
            });
        }
    }
    //add wild die to roll
    if (isWildDieActive()) {
        DICE_CONFIGS.push({
            modifier: getJokerModifier(),
            sides: getWildDieValue(),
            isWildDie: true,
            isBonusDie: false,
            themeColor: CONST.COLOR_THEMES.SECONDARY,
        });
    }
    if (isBonusDamageActive()) {
        DICE_CONFIGS.push({
            modifier: getJokerModifier(),
            sides: 6,
            isWildDie: false,
            isBonusDie: true,
            themeColor: CONST.COLOR_THEMES.BONUS,
        });

    }

    switch (DB.rollType) {
        case CONST.ROLL_TYPES.TRAIT:
            DB.acing = true;
            DB.dieLabel = CONST.DIELABELS.TRAIT;
            break;
        case CONST.ROLL_TYPES.DAMAGE:
            DB.acing = !getState(breakingObjectsToggle);
            DB.dieLabel = CONST.DIELABELS.DAMAGE;
            break;
        case CONST.ROLL_TYPES.STANDARD:
            DB.acing = false;
            DB.dieLabel = CONST.DIELABELS.STANDARD;
            break;
    }

    clearCounters();
    await DB.roll(DICE_CONFIGS);
}

async function rerollTheDice() {
    if (ROLL_HISTORY.length > 0) {
        RollCollection = new SWDR();
        const LAST_ROLL = ROLL_HISTORY[ROLL_HISTORY.length - 1];
        DB.isReroll = true;
        DB.clear();
        DB.rollType = LAST_ROLL.rollType;
        const DICE_CONFIGS = []

        for (const DIE_ROLL of LAST_ROLL.rollResult.filter(d => d.dieLabel !== 'Critical Failure Check')) {
            DICE_CONFIGS.push({
                sides: DIE_ROLL.sides,
                modifier: DIE_ROLL.modifier,
                isWildDie: DIE_ROLL.isWildDie,
                isBonusDie: DIE_ROLL.isBonusDie,
                themeColor: DIE_ROLL.themeColor,
            });
        }

        if (LAST_ROLL.rollResult.length) {
            await DB.roll(DICE_CONFIGS);
        }
    }
}

async function adjustTheRoll() {
    const RECENT_ROLLS = [...ROLL_HISTORY].reverse();       //.toReversed();
    const LAST_ROLL = RECENT_ROLLS[0];
    const NEW_MODIFIER = getJokerModifier();
    const LOG_ENTRY_WRAPPER_ELEMENTS: NodeListOf<HTMLElement> = document.querySelectorAll('.log-entry-wrapper');

    for (const LOG_ENTRY_WRAPPER_ELEMENT of LOG_ENTRY_WRAPPER_ELEMENTS) {
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
            const NEW_TOTAL = Number(TOTAL_ELEMENT!.innerText) - RECENT_ROLLS[INDEX].modifier + NEW_MODIFIER;

            OUTPUT_ELEMENT.innerHTML = '';

            if (NEW_MODIFIER !== 0) {
                OUTPUT_ELEMENT.insertAdjacentHTML('afterbegin', signModOutput(NEW_MODIFIER, getState(jokerDrawnToggle)));
            }

            const TRAIT_ROLLS = LAST_ROLL.rollResult.filter(d => d.dieLabel === CONST.DIELABELS.TRAIT);

            if (TRAIT_ROLLS.length === 1 || DB.rollType !== CONST.ROLL_TYPES.TRAIT) {
                TOTAL_ELEMENT.innerText = NEW_TOTAL.toString();
                DESCRIPTION_ELEMENT.innerText = DB.rollType === CONST.ROLL_TYPES.STANDARD ? '' : calculateRaises(NEW_TOTAL);
            }

            RECENT_ROLLS[INDEX].modifier = NEW_MODIFIER;
            RECENT_ROLLS[INDEX].total = NEW_TOTAL;
            RECENT_ROLLS[INDEX].description = DESCRIPTION_ELEMENT.innerText;
            let rollDetails = '';

            for (const DIE_ROLL of RECENT_ROLLS[INDEX].rollResult) {
                DIE_ROLL.value = DB.rollType === CONST.ROLL_TYPES.TRAIT ? DIE_ROLL.value - DIE_ROLL.modifier + NEW_MODIFIER : DIE_ROLL.value;
                DIE_ROLL.modifier = NEW_MODIFIER;
                rollDetails += markupDieRollDetails(DIE_ROLL,RECENT_ROLLS[INDEX].isJoker);
            }

            OUTPUT_ELEMENT.insertAdjacentHTML('beforeend', rollDetails);

            // Send to Discord
            // Send to OBR die rolls for all to see
            //TODO
            // if (DISCORD_SETTINGS.webhookURL && RECENT_ROLLS[INDEX].rollResult?.length) {
            //     // Pass in the discord response to use the ID to update that specific message.
            //     RECENT_ROLLS[INDEX].discordResponse = await sendToDiscord(RECENT_ROLLS[INDEX]);
            // }
        }

        if (IS_NEW_ROLL || IS_ORIGINAL_ROLL) {
            break;
        }
    }
}

// Discord Webhook
// // Event Listeners for Discord configuration  
// document.querySelector('#save-discord-config').addEventListener('click', function () {
//     localStorage.setItem(LOCAL_STORAGE_KEYS.webhookUrl, WEBHOOK_URL_ELEMENT.value);
//     DISCORD_SETTINGS.webhookURL = WEBHOOK_URL_ELEMENT.value;
//     localStorage.setItem(LOCAL_STORAGE_KEYS.displayName, YOUR_NAME_ELEMENT.value);
//     DISCORD_SETTINGS.displayName = YOUR_NAME_ELEMENT.value;
// });

// document.querySelector('#clear-discord-config').addEventListener('click', function () {
//     WEBHOOK_URL_ELEMENT.value = '';
//     YOUR_NAME_ELEMENT.value = '';
//     localStorage.clear();
// });

// async function sendToDiscord(roll) {
//     // This is a new message and not an update if the the length of existing embeds is equal to 10, which is Discord's embed max limit.
//     const IS_DISCORD_UPDATE = roll.discordResponse?.embeds?.length === 10 || !roll.discordResponse?.id ? false : !!roll.discordResponse;
//     // Set the fetch URL based on whether it's a new webhook message or an updated one.
//     const FETCH_URL = IS_DISCORD_UPDATE ? `${DISCORD_SETTINGS.webhookURL}/messages/${roll.discordResponse.id}` : DISCORD_SETTINGS.webhookURL;
//     // Set the method based on whether it's a new webhook message or an updated one.
//     const METHOD = IS_DISCORD_UPDATE ? 'PATCH' : 'POST';
//     // Get the current modifier.
//     const MODIFIER = roll.modifier;
//     // Set the username.
//     const USERNAME = DISCORD_SETTINGS.displayName ? DISCORD_SETTINGS.displayName : null;
//     // Create a string of die rolls for the die rolls field.
//     let rollDetails = '';

//     // Build each roll's roll details
//     for (const DIE_ROLL of roll.rollResult) {
//         // Show the modifier if it's a trait roll and the modifier is not zero.
//         const SHOW_MODIFIER = roll.rollType === CONST.ROLL_TYPES.TRAIT && DIE_ROLL.modifier !== 0;
//         // Show the roll breakdown if the die roll aced.
//         const SHOW_BREAKDOWN = DIE_ROLL.rollDetails.includes(CONST.EMOJIS.ACE);
//         // Show the math if the die roll aced or if the modifier is to be shown.
//         const SHOW_MATH = SHOW_BREAKDOWN || SHOW_MODIFIER;
//         // Write the label for the individual roll.
//         const LABEL = `${DIE_ROLL.dieLabel} (d${sidesNumber(DIE_ROLL.sides)}):`;
//         // Set the Breakdown string to the roll details or an empty string if only the roll's unmodified value is needed.
//         const BREAKDOWN = SHOW_MATH ? DIE_ROLL.rollDetails : '';
//         // If the modifier is to be shown, write out the string for its math expression (value +/- modifier) or set it as an empty string.
//         const MODIFIER = SHOW_MODIFIER ? ` ${DIE_ROLL.modifier < 0 ? '-' : '+'} ${Math.abs(DIE_ROLL.modifier)}` : '';
//         // Write out the roll details using the above defined string variables.
//         rollDetails += `${LABEL}\`\`\`${BREAKDOWN}${MODIFIER}${SHOW_MATH ? ' = ' : ''}${DIE_ROLL.value}\`\`\`${roll.rollResult.indexOf(DIE_ROLL) === roll.rollResult.length - 1 ? '' : '\n'}`;
//     }

//     // Create fields for the embed
//     const FIELDS = [
//         {
//             name: 'Total',
//             value: `\`\`\`${roll.total}\`\`\``,
//             inline: true,
//         },
//         {
//             name: 'Die Rolls',
//             value: rollDetails,
//         },
//     ];

//     const TRAIT_ROLLS = roll.rollResult.filter(d => d.dieLabel === CONST.DIELABELS.TRAIT);

//     if (TRAIT_ROLLS.length > 1) {
//         FIELDS.shift();
//     }

//     if (roll.rollType !== CONST.ROLL_TYPES.STANDARD) {
//         // Add Result description at the start if it's not a standard roll.
//         FIELDS.splice(0, 0,
//             {
//                 name: 'Result',
//                 value: `**${roll.description}**`,
//             },
//         );

//         // Add the Target Number before the Total if it's not a standard roll.
//         const TOTAL_FIELD = FIELDS.find(f => f.name === 'Total');
//         const TARGET_INDEX = TOTAL_FIELD ? FIELDS.indexOf(TOTAL_FIELD) : 0;

//         if (!(TRAIT_ROLLS.length === 1)) {
//             FIELDS.splice(TARGET_INDEX, 0,
//                 {
//                     name: 'Target',
//                     value: `\`\`\`${getTargetNumber()}\`\`\``,
//                     inline: true,
//                 },
//             );
//         }
//     }

//     // Add the modifier field before the die rolls if there's a modififer.
//     if (MODIFIER !== 0) {
//         const DIE_ROLLS_FIELD = FIELDS.find(f => f.name === 'Die Rolls');
//         const MODIFIER_INDEX = FIELDS.indexOf(DIE_ROLLS_FIELD);
//         FIELDS.splice(MODIFIER_INDEX, 0, {
//             name: 'Modifier',
//             value: `\`\`\`${MODIFIER}\`\`\``,
//         });
//     }

//     // Create the base data object.
//     const DATA = {
//         username: USERNAME,
//         avatar_url: `../images/android-chrome-512x512.png`,
//     };

//     // Create the base new embed if needed.
//     function getColor() {
//         const hexColor = roll.criticalFailure ? CONST.COLOR_THEMES.CRITICAL_FAILURE_DIE : CONST.COLOR_THEMES.PRIMARY;
//         return parseInt(hexColor.replace("#", ""), 16);
//     }

//     const NEW_EMBED = {
//         type: 'rich',
//         color: getColor(),
//         title: APP_NAME,
//         description: roll.isReroll ? '**Reroll**\n----' : null,
//         fields: FIELDS,
//         footer: {
//             text: 'Made on The Immaterial Plane (2.2.1)',
//             icon_url: 'https://immaterialplane.com/wp-content/uploads/2020/05/cropped-logo-1-1-32x32.png',
//         }
//     };

//     if (IS_DISCORD_UPDATE) {
//         // Update the last embed
//         // Get the index of the last of the response embeds array.
//         const EMBED = roll.discordResponse.embeds[0];

//         if (NEW_EMBED?.description?.includes('Reroll')) {
//             // Updated reroll.
//             NEW_EMBED.description = '**Reroll (Updated)**\n----';
//         } else {
//             // Updated original roll.
//             NEW_EMBED.description = '**(Updated)\n**----';
//         }
//     }

//     // Default for an original roll: Add the embed.
//     DATA.embeds = [NEW_EMBED];

//     //if (messageReference) DATA.message_reference = messageReference;
//     return await fetch(`${FETCH_URL}?wait=true`, {
//         method: METHOD,
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(DATA),
//     }).then((response) => response.json())
//         .then((messageData) => {
//             return messageData;
//         });
// }

