const { combineRgb } = require('@companion-module/base')

const getPresets = (base) => {
	const presets = {}
	presets[`show_info`] = {
		type: 'button', // This must be 'button' for now
		category: 'Basic', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
		name: `Update timeline info`, // A name for the preset. Shown to the user when they hover over it
		style: {
			// This is the minimal set of style properties you must define
			text: `Update Timelines`, // You can use variables from your module here
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: 'show_information',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [], // You can add some presets from your module here
	}
	
	presets[`jump_to_cue`] = {
		type: 'button', // This must be 'button' for now
		category: 'Basic', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
		name: `Jump to Cue`, // A name for the preset. Shown to the user when they hover over it
		style: {
			// This is the minimal set of style properties you must define
			text: `Jump to Cue`, // You can use variables from your module here
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: 'jump_to_cue',
						options: {
							cue: '',
							state: 'play',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [], // You can add some presets from your module here
	}
	presets[`jump_to_time`] = {
		type: 'button', // This must be 'button' for now
		category: 'Basic', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
		name: `Jump to Time`, // A name for the preset. Shown to the user when they hover over it
		style: {
			// This is the minimal set of style properties you must define
			text: `Jump to Time`, // You can use variables from your module here
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: 'jump_to_time',
						options: {
							timeline: '0',
							time: '0',
							state: 'pause',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [], // You can add some presets from your module here
	}

	for (const key in base.show.timelines) {
		if (Object.hasOwnProperty.call(base.show.timelines, key)) {
			presets[`timeline_playback_control_id${key}`] = {
				type: 'button', // This must be 'button' for now
				category: 'Play', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
				name: `Play timeline`, // A name for the preset. Shown to the user when they hover over it
				style: {
					// This is the minimal set of style properties you must define
					text: `Play $(watchout-json:${key})`, // You can use variables from your module here
					size: '14px',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: 'timeline_action',
								options: {
									timeline: key,
									action: 'play',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'true',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 204, 0),
						},
					},
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'false',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(255, 255, 0),
						},
					},
				], // You can add some presets from your module here
			}
			presets[`timeline_pause_control_id${key}`] = {
				type: 'button', // This must be 'button' for now
				category: 'Pause', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
				name: `Pause timeline`, // A name for the preset. Shown to the user when they hover over it
				style: {
					// This is the minimal set of style properties you must define
					text: `Pause $(watchout-json:${key})`, // You can use variables from your module here
					size: '14px',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: 'timeline_action',
								options: {
									timeline: key,
									action: 'pause',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'true',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 204, 0),
						},
					},
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'false',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(255, 255, 0),
						},
					},
				], // You can add some presets from your module here
			}
			presets[`timeline_stop_control_id${key}`] = {
				type: 'button', // This must be 'button' for now
				category: 'Stop', // This groups presets into categories in the ui. Try to create logical groups to help users find presets
				name: `Stop timeline`, // A name for the preset. Shown to the user when they hover over it
				style: {
					// This is the minimal set of style properties you must define
					text: `Stop $(watchout-json:${key})`, // You can use variables from your module here
					size: '14px',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: 'timeline_action',
								options: {
									timeline: key,
									action: 'stop',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'true',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 204, 0),
						},
					},
					{
						feedbackId: 'timeLineState',
						options: {
							timeline: key,
							running: 'false',
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(255, 255, 0),
						},
					},
				], // You can add some presets from your module here
			}
			
		}
	}

	return presets
}

module.exports = { getPresets }
