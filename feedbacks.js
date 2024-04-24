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
					label: 'Running',
					id: 'running',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Play' },
						{ id: 'false', label: 'Pause' },
					],
				},
			],
			callback: (feedback) => {
				if (base.playbackStatus && base.playbackStatus.timelines) {
					return base.playbackStatus.timelines.some((timeline) => {
						return timeline.id === feedback.options.timeline && timeline.running.toString() === feedback.options.running;
					});
				} else {
					return false
				}
			},
		},
	})
}
