const { Regex } = require('@companion-module/base')

const getActions = (base) => {
	let actions = {}

	base.CHOICES_TIMELINES = []
	base.CHOICES_CUES = []
	base.CHOICES_SNAPSHOTS = []

	for (const key1 in base.snapshots.presets) {
		if (Object.hasOwnProperty.call(base.snapshots.presets, key1)) {
			const element = base.snapshots.presets[key1]
			base.CHOICES_SNAPSHOTS.push({ id: key1, label: element.name })
		}
	}
	for (const key1 in base.show.timelines) {
		if (Object.hasOwnProperty.call(base.show.timelines, key1)) {
			const element = base.show.timelines[key1]
			base.CHOICES_TIMELINES.push({ id: key1, label: element.name })
			if (!base.isObjEmpty(element.cues)) {
				for (const key2 in element.cues) {
					if (Object.hasOwnProperty.call(element.cues, key2)) {
						const cue = element.cues[key2]
						base.CHOICES_CUES.push({
							id: `${key1}/${key2}`,
							label: `${element.name}: ${cue.state} ${cue.name !== null ? cue.name : 'no_name'} at ${cue.start}ms`,
						})
					}
				}
			}
		}
	}

	actions['timeline_action'] = {
		name: 'Timeline Action',
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
				label: 'Action',
				id: 'action',
				default: 'play',
				choices: [
					{ id: 'play', label: 'Play' },
					{ id: 'pause', label: 'Pause' },
					{ id: 'stop', label: 'Stop' },
				],
			},
		],
		callback: (action) => {
			base.log('debug', `API send: ${base.baseUrl}/${action.options.action}/${action.options.timeline}`)
			fetch(`${base.baseUrl}/${action.options.action}/${action.options.timeline}`, { method: 'POST' })
		},
	}
	actions['timeline_toggle'] = {
		name: 'Timeline Toggle',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				default: '0',
				choices: base.CHOICES_TIMELINES,
			},
		],
		callback: (action) => {
			base.playbackStatus.forEach((timeline) => {
				// check if a timeline is present in the list (then we have status otherwise play)
				if (timeline.id === action.options.timeline && timeline.playbackStatus === 'run') {
					action.options.action = 'pause'
				} else {
					action.options.action = 'play'
				}
			})
			base.log('debug', `API send: ${base.baseUrl}/${action.options.action}/${action.options.timeline}`)
			fetch(`${base.baseUrl}/${action.options.action}/${action.options.timeline}`, { method: 'POST' })
		},
	}
	actions['timeline_condition_start'] = {
		name: 'Only play timeline if',
		options: [
			{
				type: 'dropdown',
				label: 'The following timeline will play',
				id: 'timeline',
				default: '0',
				choices: base.CHOICES_TIMELINES,
			},
			{
				type: 'dropdown',
				label: 'when the following condition is met',
				id: 'status',
				default: 'pause',
				choices: [
					{ id: 'run', label: 'Play' },
					{ id: 'pause', label: 'Pause' },
					{ id: 'stop', label: 'Stop' },
				],
			},
		],
		callback: (action) => {
			base.playbackStatus.forEach((timeline) => {
				if (timeline.id === action.options.timeline && timeline.playbackStatus.toString() === action.options.status) {
					base.log('debug', `API send: ${base.baseUrl}/play/${action.options.timeline}`)
					fetch(`${base.baseUrl}/play/${action.options.timeline}`, { method: 'POST' })
				}
			})
		},
	}
	actions['timeline_condition_start_extra'] = {
		name: 'Only play timeline if other timeline condition is met',
		options: [
			{
				type: 'dropdown',
				label: 'The following timeline will play',
				id: 'timeline1',
				default: '0',
				choices: base.CHOICES_TIMELINES,
			},
			{
				type: 'dropdown',
				label: 'When this timeline',
				id: 'timeline2',
				default: '0',
				choices: base.CHOICES_TIMELINES,
			},
			{
				type: 'dropdown',
				label: 'has this state',
				id: 'status',
				default: 'pause',
				choices: [
					{ id: 'run', label: 'Play' },
					{ id: 'pause', label: 'Pause' },
					{ id: 'stop', label: 'Stop' },
				],
			},
		],
		callback: (action) => {
			base.playbackStatus.forEach((timeline) => {
				if (timeline.id === action.options.timeline2 && timeline.playbackStatus.toString() === action.options.status) {
					base.log('debug', `API send: ${base.baseUrl}/play/${action.options.timeline1}`)
					fetch(`${base.baseUrl}/play/${action.options.timeline1}`, { method: 'POST' })
				}
			})
		},
	}
	/*** 
    format "/v0/jump-to-time/{tl_id}?time={time}&state={state}"
    {tl_id} is timeline id
    {time} is given in milliseconds
    {state} is play or pause
***/
	actions['jump_to_time'] = {
		name: 'Jump to Time',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				default: '0',
				choices: base.CHOICES_TIMELINES,
			},
			{
				type: 'number',
				label: 'Time (ms)',
				id: 'time',
				min: 0,
				max: 1000000,
				default: '1000',
			},
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'play',
				choices: [
					{ id: 'play', label: 'Play' },
					{ id: 'pause', label: 'Pause' },
				],
			},
		],
		callback: (action) => {
			base.log(
				'debug',
				`API send: ${base.baseUrl}/jump-to-time/${action.options.timeline}?time=${action.options.time}&state=${action.options.state}`,
			)
			fetch(
				`${base.baseUrl}/jump-to-time/${action.options.timeline}?time=${action.options.time}&state=${action.options.state}`,
				{ method: 'POST' },
			)
		},
	}
	/*** 
    format "/v0/jump-to-cue/{tl_id}/{cue_id}?state={state}"
    {tl_id} is timeline id
    {cue_id} is cue id
    {state} is play or pause
***/
	actions['jump_to_cue'] = {
		name: 'Jump to Cue',
		options: [
			{
				type: 'dropdown',
				label: 'Cue',
				id: 'cue',
				default: '0',
				choices: base.CHOICES_CUES,
			},
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'play',
				choices: [
					{ id: 'play', label: 'Play' },
					{ id: 'pause', label: 'Pause' },
				],
			},
		],
		callback: (action) => {
			base.log('debug', `API send: ${base.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`)
			fetch(`${base.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`, { method: 'POST' })
		},
	}
	// actions['current_playback_status'] = {
	// 	name: 'Current Playback Status',
	// 	options: [],
	// 	callback: async () => {
	// 		base.log('debug', `API send: ${base.baseUrl}/state`)
	// 		const response = await fetch(`${base.baseUrl}/state`, { method: 'GET' })
	// 		let resultData = await response.json()
	// 		base.playbackStatus = resultData
	// 		base.log('debug', JSON.stringify(resultData))
	// 		let clockTime = resultData.clockTime
	// 		let date = new Date(clockTime); // create Date object
	// 		console.log('clockTime', date.toString())
	// 		base.checkFeedbacks('timeLineState')
	// 	},
	// }
	actions['show_information'] = {
		name: 'Show information',
		options: [],
		callback: async () => {
			base.log('debug', `API send: ${base.baseUrl}/show`)
			const response = await fetch(`${base.baseUrl}/show`, { method: 'GET' })
			let resultData = await response.json()
			base.show = resultData.show
			base.setVariableValues({
				director: base.show.hosts.director,
				asset_manager: base.show.hosts.asset_manager,
			})
			base.updateActions()
		},
	}
	actions['shutdown_node'] = {
		name: 'shutdown node',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'IP Address node',
				id: 'ip',
				regex: Regex.IP,
			},
		],
		callback: async (action) => {
			base.log('debug', `API send: http://${action.options.ip}:3017/v0/shutdown`)
			fetch(`http://${action.options.ip}:3017/v0/shutdown`, { method: 'POST' })
		},
	}
	actions['snapshot_single'] = {
		name: 'Toggle a single snapshot',
		options: [
			{
				type: 'dropdown',
				label: 'Media snapshot',
				choices: base.CHOICES_SNAPSHOTS,
				id: 'snapshot',
			},
		],
		callback: async (action) => {
			base.log('debug', `API send: ${base.baseUrl}/active-media-snapshots/${action.options.snapshot}/toggle`)
			fetch(`${base.baseUrl}/active-media-snapshots/${action.options.snapshot}/toggle`, { method: 'POST' })
		},
	}
	actions['snapshot_clear'] = {
		name: 'Clear the active snapshots',
		options: [],
		callback: async () => {
			base.log('debug', `API send: ${base.baseUrl}/active-media-snapshots with empty array`)
			fetch(`${base.baseUrl}/active-media-snapshots`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: '[]',
			})
		},
	}

	return actions
}

module.exports = { getActions }
