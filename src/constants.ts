export enum Illumination {
	Light=0,
	Dim=1,
	Dark=2,
	Pitch=3
}

export enum MultiAction {
	One=0,
	Two=1,
	Three=2
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
		ADJUST: '🎚',
		REROLL: '🔄',
		WOUND: '🩹'
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
		 MULTI_VALUE: MultiAction.One,
		 WILD_ATTACK_ENABLED: false,
	}
};