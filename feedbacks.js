const { combineRgb } = require('@companion-module/base')

module.exports = async function (base) {
	base.setFeedbackDefinitions({
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
					default: '0',
					choices: base.CHOICES_TIMELINES,
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
			callback: (feedback) => {
				if (base.playbackStatus && base.playbackStatus) {
					return base.playbackStatus.some((timeline) => {
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
		mediaPresetActive: {
			name: 'Media Preset State',
			type: 'boolean',
			label: 'Media Preset State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Media Preset',
					id: 'mediaPreset',
					default: '0',
					choices: base.CHOICES_SNAPSHOTS,
				},
			],
			callback: (feedback) => {
				if (base.mediaPresetsActive) {
					return base.mediaPresetsActive.some((preset) => {
						return preset === feedback.options.mediaPreset
					})
				} else {
					return false
				}
			},
		},
	})
}
