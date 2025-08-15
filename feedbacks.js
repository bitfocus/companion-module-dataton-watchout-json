const { combineRgb } = require('@companion-module/base')

/**
 * Defines feedbacks for the Companion Watchout module.
 * @param {Object} instance - The module instance object.
 */
module.exports = async function (instance) {
	/**
	 * Sets feedback definitions for timeline state, cue set state, and (optionally) media preset state.
	 */
	instance.setFeedbackDefinitions({
		timeLineState: {
			name: 'Timeline State',
			type: 'boolean',
			label: 'Timeline State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline',
					default:
						instance.CHOICES_TIMELINES && instance.CHOICES_TIMELINES.length > 0
							? instance.CHOICES_TIMELINES[0].id
							: '0',
					choices: instance.CHOICES_TIMELINES || [],
				},
				{
					type: 'dropdown',
					label: 'Status',
					id: 'playbackStatus',
					default: 'stop',
					choices: [
						{ id: 'stop', label: 'Stop' },
						{ id: 'run', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
					],
				},
			],
			/**
			 * Callback to determine if the timeline state feedback should be active.
			 * @param {Object} feedback - The feedback object containing options.
			 * @returns {boolean} True if the timeline matches the selected status, false otherwise.
			 */
			callback: (feedback) => {
				if (instance.playbackStatus) {
					return instance.playbackStatus.some((timeline) => {
						return (
							timeline.id === feedback.options.timeline &&
							timeline.playbackStatus.toString() === feedback.options.playbackStatus
						)
					})
				} else {
					return false
				}
			},
		},
		cueSetActive: {
			name: 'Cue Set State',
			type: 'boolean',
			label: 'Cue Set State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Cue Set',
					id: 'cueSet',
					default:
						instance.CHOICES_CUE_SETS && instance.CHOICES_CUE_SETS.length > 0 ? instance.CHOICES_CUE_SETS[0].id : '',
					choices: instance.CHOICES_CUE_SETS || [],
				},
				{
					type: 'textinput',
					label: 'Variant Name',
					id: 'variant_name',
					default: '',
					tooltip: 'The name of the variant to be used',
				},
			],
			/**
			 * Callback to determine if the cue set state feedback should be active.
			 * @param {Object} feedback - The feedback object containing options.
			 * @returns {boolean} True if the cue set and variant name match, false otherwise.
			 */
			callback: (feedback) => {
				if (instance.cueSets) {
					// instance.cueSets is an object like { "Winter": "2", "Summer": "1" }
					const variant = instance.cueSets[feedback.options.cueSet]
					return variant !== undefined && variant.toString() === feedback.options.variant_name
				} else {
					return false
				}
			},
		},
		// mediaPresetActive: {
		// 	name: 'Media Preset State',
		// 	type: 'boolean',
		// 	label: 'Media Preset State',
		// 	defaultStyle: {
		// 		bgcolor: combineRgb(0, 255, 0),
		// 		color: combineRgb(0, 0, 0),
		// 	},
		// 	options: [
		// 		{
		// 			type: 'dropdown',
		// 			label: 'Media Preset',
		// 			id: 'mediaPreset',
		// 			default: '0',
		// 			choices: instance.CHOICES_SNAPSHOTS,
		// 		},
		// 	],
		// 	/**
		// 	 * Callback to determine if the media preset state feedback should be active.
		// 	 * @param {Object} feedback - The feedback object containing options.
		// 	 * @returns {boolean} True if the media preset is active, false otherwise.
		// 	 */
		// 	callback: (feedback) => {
		// 		if (instance.mediaPresetsActive) {
		// 			return instance.mediaPresetsActive.some((preset) => {
		// 				return preset === feedback.options.mediaPreset
		// 			})
		// 		} else {
		// 			return false
		// 		}
		// 	},
		// },
	})
}
