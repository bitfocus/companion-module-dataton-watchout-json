const { Regex } = require('@companion-module/base')

/**
 * Generates action definitions for the Companion Watchout module.
 * Populates instance choices for timelines, cues, and cue sets.
 * @param {Object} instance - The module instance object.
 * @returns {Object} actions - The action definitions object.
 */
const getActions = (instance) => {
	let actions = {}

	instance.CHOICES_TIMELINES = []
	instance.CHOICES_CUES = []
	instance.CHOICES_CUESETS = []

	// Populate cue sets safely
	if (instance.cueSets && typeof instance.cueSets === 'object') {
		for (const key1 in instance.cueSets) {
			if (Object.hasOwnProperty.call(instance.cueSets, key1)) {
				instance.CHOICES_CUESETS.push({ id: key1, label: key1 })
			}
		}
	}

	// Populate timelines and cues safely using sorted order
	const sortedTimelines = instance.getSortedTimelines()
	instance.log('info', `Processing ${sortedTimelines.length} timelines from Watchout`)
	
	for (const timeline of sortedTimelines) {
		instance.CHOICES_TIMELINES.push({ id: timeline.id, label: timeline.name })
		// instance.log('debug', `Timeline: ID=${timeline.id}, Name="${timeline.name}"`)

		// Process cues if they exist
		if (timeline.data.cues && !instance.isObjEmpty(timeline.data.cues)) {
			for (const key2 in timeline.data.cues) {
				if (Object.hasOwnProperty.call(timeline.data.cues, key2)) {
					const cue = timeline.data.cues[key2]
					if (cue) {
						instance.CHOICES_CUES.push({
							id: `${timeline.id}/${key2}`,
							label: `${timeline.name}: ${cue.state || 'unknown'} ${cue.name || 'no_name'} at ${cue.start || 0}ms`,
						})
					}
				}
			}
		}
	}

	// Log the sorting method and final order
	const sortMethod = instance.config.sortTimelines ? 'name (alphabetical)' : 'ID (Watchout order)'
	instance.log('info', `Timelines sorted by ${sortMethod}`)
	// instance.log('info', 'Final timeline order: ' + instance.CHOICES_TIMELINES.map(t => `${t.id}:"${t.label}"`).join(', '))

	/**
	 * Timeline Action: Play, Pause, or Stop a timeline.
	 */
	actions['timeline_action'] = {
		name: 'Timeline Action',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
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
		/**
		 * Sends the selected action to the timeline.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log('debug', `API send: ${instance.baseUrl}/${action.options.action}/${action.options.timeline}`)
			try {
				await fetch(`${instance.baseUrl}/${action.options.action}/${action.options.timeline}`, { method: 'POST' })
			} catch (error) {
				instance.log('error', `Failed to send timeline toggle action: ${error.message}`)
			}
		},
	}

	/**
	 * Timeline Toggle: Toggle play/pause for a timeline.
	 */
	actions['timeline_toggle'] = {
		name: 'Timeline Toggle',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
			},
		],
		/**
		 * Toggles play/pause state for the selected timeline.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			let actionToSend = 'play' // Default action

			// Find the timeline and determine the correct toggle action
			const timeline = instance.playbackStatus.find((tl) => tl.id === action.options.timeline)
			if (timeline && timeline.playbackStatus === 'run') {
				actionToSend = 'pause'
			}

			instance.log('debug', `API send: ${instance.baseUrl}/${actionToSend}/${action.options.timeline}`)
			try {
				await fetch(`${instance.baseUrl}/${actionToSend}/${action.options.timeline}`, { method: 'POST' })
			} catch (error) {
				instance.log('error', `Failed to send timeline toggle action: ${error.message}`)
			}
		},
	}

	/**
	 * Timeline Condition Start: Play timeline if another timeline is in a certain state.
	 */
	actions['timeline_condition_start'] = {
		name: 'Only play timeline if',
		options: [
			{
				type: 'dropdown',
				label: 'The following timeline will play',
				id: 'timeline',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
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
		/**
		 * Plays a timeline if another timeline matches the selected status.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			// Use for...of instead of forEach for proper async/await handling
			for (const timeline of instance.playbackStatus) {
				if (timeline.id === action.options.timeline && timeline.playbackStatus.toString() === action.options.status) {
					instance.log('debug', `API send: ${instance.baseUrl}/play/${action.options.timeline}`)
					try {
						await fetch(`${instance.baseUrl}/play/${action.options.timeline}`, { method: 'POST' })
					} catch (error) {
						instance.log('error', `Failed to send play action: ${error.message}`)
					}
					break // Only play the first matching timeline
				}
			}
		},
	}

	/**
	 * Timeline Condition Start Extra: Play timeline1 if timeline2 is in a certain state.
	 */
	actions['timeline_condition_start_extra'] = {
		name: 'Only play timeline if other timeline condition is met',
		options: [
			{
				type: 'dropdown',
				label: 'The following timeline will play',
				id: 'timeline1',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
			},
			{
				type: 'dropdown',
				label: 'When this timeline',
				id: 'timeline2',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
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
		/**
		 * Plays timeline1 if timeline2 matches the selected status.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			// Use for...of instead of forEach for proper async/await handling
			for (const timeline of instance.playbackStatus) {
				if (timeline.id === action.options.timeline2 && timeline.playbackStatus.toString() === action.options.status) {
					instance.log('debug', `API send: ${instance.baseUrl}/play/${action.options.timeline1}`)
					try {
						await fetch(`${instance.baseUrl}/play/${action.options.timeline1}`, { method: 'POST' })
					} catch (error) {
						instance.log('error', `Failed to send play action: ${error.message}`)
					}
					break // Only play the first matching timeline
				}
			}
		},
	}

	/**
	 * Jump to Time: Jumps a timeline to a specific time and state.
	 */
	actions['jump_to_time'] = {
		name: 'Jump to Time',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				default: '0',
				choices: instance.CHOICES_TIMELINES,
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
		/**
		 * Jumps the timeline to the specified time and state.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log(
				'debug',
				`API send: ${instance.baseUrl}/jump-to-time/${action.options.timeline}?time=${action.options.time}&state=${action.options.state}`,
			)
			try {
				await fetch(
					`${instance.baseUrl}/jump-to-time/${action.options.timeline}?time=${action.options.time}&state=${action.options.state}`,
					{ method: 'POST' },
				)
			} catch (error) {
				instance.log('error', `Failed to jump to time: ${error.message}`)
			}
		},
	}

	/**
	 * Jump to Cue: Jumps to a specific cue and state.
	 */
	actions['jump_to_cue'] = {
		name: 'Jump to Cue',
		options: [
			{
				type: 'dropdown',
				label: 'Cue',
				id: 'cue',
				default: '0',
				choices: instance.CHOICES_CUES,
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
		/**
		 * Jumps to the specified cue and state.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log(
				'debug',
				`API send: ${instance.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`,
			)
			try {
				await fetch(`${instance.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`, {
					method: 'POST',
				})
			} catch (error) {
				instance.log('error', `Failed to jump to cue: ${error.message}`)
			}
		},
	}

	/**
	 * Set group state by name and variant.
	 */
	actions['set_group_state_by_name'] = {
		name: 'Set group state by with variant',
		options: [
			{
				type: 'dropdown',
				label: 'Cue Group',
				id: 'cue_group',
				default: instance.CHOICES_CUESETS && instance.CHOICES_CUESETS.length > 0 ? instance.CHOICES_CUESETS[0].id : '',
				choices: instance.CHOICES_CUESETS || [],
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
		 * Sets the group state by cue group and variant name.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log(
				'debug',
				`API send: ${instance.baseUrl}/cue-group-state/by-name/${action.options.cue_group}/${action.options.variant_name}`,
			)
			try {
				const response = await fetch(
					`${instance.baseUrl}/cue-group-state/by-name/${action.options.cue_group}/${action.options.variant_name}`,
					{ method: 'POST' },
				)
				if (!response.ok) {
					throw new Error(`POST failed: ${response.statusText}`)
				}

				const response2 = await fetch(`${instance.baseUrl}/cue-group-state/by-name`, { method: 'GET' })
				if (!response2.ok) {
					throw new Error(`GET failed: ${response2.statusText}`)
				}

				const resultData2 = await response2.json()
				instance.log('debug', `API received: ${JSON.stringify(resultData2)}`)
				instance.CHOICES_CUESETS = resultData2
			} catch (error) {
				instance.log('error', `API error: ${error.message}`)
			}
		},
	}

	/**
	 * Reset all cue groups by name.
	 */
	actions['reset_all_cue_groups_by_name'] = {
		name: 'Reset all cue groups by Name',
		options: [],
		/**
		 * Resets all cue groups by sending a POST request.
		 */
		callback: async () => {
			/**
			 * 	curl -X POST http://localhost:3019/v0/cue-group-state/by-name \
			 *  -H "Content-Type: application/json" \
			 *  -d '{}'
			 *  */
			instance.log('debug', `API send: ${instance.baseUrl}/cue-group-state/by-name`)
			try {
				const response = await fetch(`${instance.baseUrl}/cue-group-state/by-name`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: '{}',
				})
				if (!response.ok) {
					throw new Error(`POST failed: ${response.statusText}`)
				}
			} catch (error) {
				instance.log('error', `API error: ${error.message}`)
			}
		},
	}

	/**
	 * Show information: Fetches and updates show information.
	 */
	actions['show_information'] = {
		name: 'Show information',
		options: [],
		/**
		 * Fetches show information and updates variables and actions.
		 */
		callback: async () => {
			instance.log('debug', `API send: ${instance.baseUrl}/show`)
			try {
				const response = await fetch(`${instance.baseUrl}/show`, { method: 'GET' })
				if (!response.ok) {
					throw new Error(`GET failed: ${response.statusText}`)
				}
				let resultData = await response.json()
				instance.show = resultData.show
				instance.setVariableValues({
					director: instance.show.hosts.director,
					asset_manager: instance.show.hosts.asset_manager,
				})
				instance.updateActions()
			} catch (error) {
				instance.log('error', `API error: ${error.message}`)
			}
		},
	}

	/**
	 * Shutdown node: Sends a shutdown command to a node by IP.
	 */
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
		/**
		 * Sends a shutdown command to the specified node IP.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log('debug', `API send: http://${action.options.ip}:3017/v0/shutdown`)
			try {
				await fetch(`http://${action.options.ip}:3017/v0/shutdown`, { method: 'POST' })
			} catch (error) {
				instance.log('error', `Failed to shutdown node: ${error.message}`)
			}
		},
	}

	/**
	 * Restart services: Sends a restart command to a node by IP.
	 */
	actions['restart_services'] = {
		name: 'Restart Services',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'IP Address node',
				id: 'ip',
				regex: Regex.IP,
			},
		],
		/**
		 * Sends a restart command to the specified node IP.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action) => {
			instance.log('debug', `API send: http://${action.options.ip}:3017/v0/restart`)
			try {
				await fetch(`http://${action.options.ip}:3017/v0/restart`, { method: 'POST' })
			} catch (error) {
				instance.log('error', `Failed to restart services: ${error.message}`)
			}
		},
	}

	/**
	 * Send Inputs: Send values to show variables/inputs.
	 */
	actions['send_inputs'] = {
		name: 'Send Input Value',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'Input Key',
				id: 'input_key',
				default: '',
				tooltip: 'The name/key of the input variable in the show',
			},
			{
				type: 'number',
				useVariables: true,
				label: 'Input Value',
				id: 'input_value',
				default: 0,
				min: -999999,
				max: 999999,
				step: 0.01,
				tooltip: 'The value to send to the input variable',
			},
		],
		/**
		 * Sends an input value to the specified variable.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action, context) => {
			const inputKey = await context.parseVariablesInString(action.options.input_key)
			const inputValue = await context.parseVariablesInString(action.options.input_value.toString())

			if (!inputKey || inputKey.trim() === '') {
				instance.log('warn', 'Input key is empty')
				return
			}

			const payload = [{ key: inputKey.trim(), value: parseFloat(inputValue) || 0 }]

			instance.log('debug', `API send inputs: ${JSON.stringify(payload)}`)
			try {
				const response = await fetch(`${instance.baseUrl}/inputs`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}
			} catch (error) {
				instance.log('error', `Failed to send input: ${error.message}`)
			}
		},
	}

	/**
	 * Send Multiple Inputs: Send multiple input values at once.
	 */
	actions['send_multiple_inputs'] = {
		name: 'Send Multiple Inputs',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'JSON Input Data',
				id: 'inputs_json',
				default: '[{"key": "InputName", "value": 0.5}]',
				tooltip: 'JSON array of input objects with key and value properties',
			},
		],
		/**
		 * Sends multiple input values from JSON data.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action, context) => {
			const inputsJson = await context.parseVariablesInString(action.options.inputs_json)

			try {
				const payload = JSON.parse(inputsJson)
				if (!Array.isArray(payload)) {
					throw new Error('Input data must be an array')
				}

				instance.log('debug', `API send multiple inputs: ${JSON.stringify(payload)}`)
				const response = await fetch(`${instance.baseUrl}/inputs`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}
			} catch (error) {
				instance.log('error', `Failed to send multiple inputs: ${error.message}`)
			}
		},
	}

	/**
	 * Load Show from JSON: Load a show from JSON data.
	 */
	actions['load_show_json'] = {
		name: 'Load Show from JSON',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'JSON Show Data',
				id: 'show_json',
				default: '{}',
				tooltip: 'JSON show data to load',
			},
		],
		/**
		 * Loads a show from JSON data.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action, context) => {
			const showJson = await context.parseVariablesInString(action.options.show_json)

			try {
				const payload = JSON.parse(showJson)

				instance.log('debug', `API load show from JSON`)
				const response = await fetch(`${instance.baseUrl}/show`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}

				// Refresh show info after loading
				await instance.getShowInfo()
				instance.updateActions()
				instance.updateVariables()
				instance.updatePresets()
			} catch (error) {
				instance.log('error', `Failed to load show from JSON: ${error.message}`)
			}
		},
	}

	/**
	 * Load Show from File: Load a show from a .watch file path.
	 */
	actions['load_show_file'] = {
		name: 'Load Show from File',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'Show File Path',
				id: 'show_file_path',
				default: '',
				tooltip: 'Path to the .watch file on the Watchout system',
			},
			{
				type: 'textinput',
				useVariables: true,
				label: 'Show Name (Optional)',
				id: 'show_name',
				default: '',
				tooltip: 'Optional show name to set when loading',
			},
		],
		/**
		 * Loads a show from a file path.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action, context) => {
			const filePath = await context.parseVariablesInString(action.options.show_file_path)
			const showName = await context.parseVariablesInString(action.options.show_name)

			if (!filePath || filePath.trim() === '') {
				instance.log('warn', 'Show file path is empty')
				return
			}

			try {
				let url = `${instance.baseUrl}/showfile`
				if (showName && showName.trim() !== '') {
					url += `?showName=${encodeURIComponent(showName.trim())}`
				}

				instance.log('debug', `API load show from file: ${filePath}`)
				const response = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/octet-stream' },
					body: filePath.trim(),
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}

				// Refresh show info after loading
				await instance.getShowInfo()
				instance.updateActions()
				instance.updateVariables()
				instance.updatePresets()
			} catch (error) {
				instance.log('error', `Failed to load show from file: ${error.message}`)
			}
		},
	}

	/**
	 * Set Multiple Cue Groups: Set multiple cue group variants at once.
	 */
	actions['set_multiple_cue_groups'] = {
		name: 'Set Multiple Cue Groups',
		options: [
			{
				type: 'textinput',
				useVariables: true,
				label: 'Cue Groups JSON',
				id: 'cue_groups_json',
				default: '{"GroupName1": "VariantName1", "GroupName2": "VariantName2"}',
				tooltip: 'JSON object with group names as keys and variant names as values',
			},
		],
		/**
		 * Sets multiple cue group variants from JSON data.
		 * @param {Object} action - The action object with options.
		 */
		callback: async (action, context) => {
			const cueGroupsJson = await context.parseVariablesInString(action.options.cue_groups_json)

			try {
				const payload = JSON.parse(cueGroupsJson)
				if (typeof payload !== 'object' || Array.isArray(payload)) {
					throw new Error('Cue groups data must be an object')
				}

				instance.log('debug', `API set multiple cue groups: ${JSON.stringify(payload)}`)
				const response = await fetch(`${instance.baseUrl}/cue-group-state/by-name`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}

				// Refresh cue sets after setting
				const response2 = await fetch(`${instance.baseUrl}/cue-group-state/by-name`, { method: 'GET' })
				if (response2.ok) {
					const resultData = await response2.json()
					instance.cueSets = resultData || {}
					instance.checkFeedbacks('cueSetActive')
				}
			} catch (error) {
				instance.log('error', `Failed to set multiple cue groups: ${error.message}`)
			}
		},
	}

	// Example for future snapshot actions (commented out)
	// actions['snapshot_single'] = { ... }
	// actions['snapshot_clear'] = { ... }

	return actions
}

module.exports = { getActions }
