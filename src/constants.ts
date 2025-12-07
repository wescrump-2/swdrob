export enum Illumination {
	Light = 0,
	Dim = 1,
	Dark = 2,
	Pitch = 3
}

export enum MultiAction {
	One_Action = 0,
	Two_Actions = 1,
	Three_Actions = 2
}

export enum CalledShot {
	Called_Shot = 0,
	Limb = 1,
	Hand = 2,
	Head = 3,
	Item_Sword = 4,
	Item_Pistol = 5,
	Unarmored = 6,
	Eyeslit = 7,
}

export enum Cover {
	No_Cover = 0,
	Light_Cover = 1,
	Medium_Cover = 2,
	Heavy_Cover = 3,
	Near_Total_Cover = 4,
}

export enum Range {
	Short_Range = 0,
	Medium_Range = 1,
	Long_Range = 2,
	Extreme_Range = 3,
}

export enum GangUp {
	Gang_Up = 0,
	Gang_Up_1 = 1,
	Gang_Up_2 = 2,
	Gang_Up_3 = 3,
	Gang_Up_4 = 4,
}

export const getEnumKeys = <T extends object>(e: T): (keyof T)[] =>
	Object.keys(e).filter((k) => Number.isNaN(Number(k))) as (keyof T)[];

export const getEnumValues = <T extends object>(e: T): T[keyof T][] =>
	Object.values(e);

export function getEnumEntries<T extends Record<string, string | number>>(
	enumObject: T
): [keyof T, T[keyof T]][] {
	return getEnumKeys(enumObject).map((key) => [key, enumObject[key]]);
}

export const CONST = {
	ROLL_TYPES: {
		TRAIT: 'trait',
		DAMAGE: 'damage',
		STANDARD: 'standard',
		CRITICAL_FAILURE_CHECK: 'critical failure check'
	},
	EMOJIS: {
		FAILURE: '❌',
		SUCCESS: '⭐',
		ACE: '💥',
		RAISE: '🌟',
		CRITICAL_FAILURE: '💀',
		CRITICAL_FAILURE_JODI: '🙌',
		JOKER: '🃏',
		ADJUST: '🎛️',
		REROLL: '🔄',
		WOUND: '🩸'
	},
	COLOR_THEMES: {
		PRIMARY: '#c6c4af',
		SECONDARY: '#ecd69b',
		BONUS: '#808080',
		CRITICAL_FAILURE_DIE: '#7d0000',
		NUMBER: '#000000',
		NUMBER_SECONDARY: '#000000',
		NUMBER_BONUS: '#000000',
	},
	DIELABELS: {
		TRAIT: 'Trait',
		DAMAGE: 'Damage',
		STANDARD: 'Die',
		WILD: 'Wild',
		BONUS: 'Bonus',
	},
	DEFAULTS: {
		WILD_DIE: "d6",
		WILD_DIE_ENABLED: true,
		TARGET_NUMBER: "4",
		MODIFIER: "0",
		TARGET_NUMBER_MIN: "4",
		MODIFIER_MIN: "-14",
		TARGET_NUMBER_MAX: "24",
		MODIFIER_MAX: "14",
		BREAK_OBJECTS: false,
		BONUS_DAMAGE: false,
		OPPOSED_ENABLED: false,
		JOKER_DRAWN_ENABLED: false,
		WOUND_ENABLED: false,
		FATIGUE_ENABLED: false,
		ILLUMN_VALUE: Illumination.Light,
		DICE_MODE: "trait",
		DISTRACTED_ENABLED: false,
		MULTI_VALUE: MultiAction.One_Action,
		WILD_ATTACK_ENABLED: false,
		THE_DROP_ENABLED: false,
		VULNERABLE_ENABLED: false,
	}
};