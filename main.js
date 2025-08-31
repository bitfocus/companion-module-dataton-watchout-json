const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades.js')
const { EventSource } = require('eventsource')
const { getActions } = require('./actions')
const { getPresets } = require('./presets')
const UpdateFeedbacks = require('./feedbacks.js')
const { createVariableDefinitions, setDynamicVariables } = require('./variables.js')

/**
 * Main module instance for the Companion Watchout integration.
 * Handles initialization, API communication, SSE, polling, and state management.
 * @class
 * @extends InstanceBase
 */
class ModuleInstance extends InstanceBase {
	/**
	 * @constructor
	 * @param {*} internal - Internal instance object from Companion
	 */
	constructor(internal) {
		super(internal)

		// Initialize properties with default values
		this.show = { timelines: {}, hosts: {} }
		this.snapshots = { presets: {} }
		this.cueSets = {}
		this.baseUrl = ''
		this.sseUrl = ''
		this.playbackStatus = []
		this.mediaPresetsActive = []
		this.CHOICES_TIMELINES = []
		this.CHOICES_CUES = []
		this.CHOICES_SNAPSHOTS = []
		this.CHOICES_CUESETS = []
		this.pollingShowInfo = null
		this.connected = false
		this.es = null
	}
	/**
	 * Main function to setup the SSE stream and this.parser.
	 * Reads the SSE stream and feeds data to the parser.
	 * @async
	 * @param {string} url - The SSE endpoint URL.
	 * @returns {Promise<void>}
	 */
	readSSEStream = (url) => {
		this.log('debug', `Starting SSE stream: ${url}`)

		// Close existing connection
		if (this.es) {
			this.es.close()
			this.es = null
		}

		try {
			this.es = new EventSource(url)

			this.es.onopen = () => {
				this.log('debug', 'SSE connection opened')
				this.connected = true
				this.updateStatus(InstanceStatus.Ok, 'Connected via SSE')
			}

			this.es.onmessage = (event) => {
				this.onParse({ type: 'event', data: event.data })
			}

			this.es.onerror = (err) => {
				this.log('error', `SSE error: ${err.message || 'Connection failed'}`)
				this.connected = false
				this.updateStatus(InstanceStatus.ConnectionFailure, 'SSE Connection Lost')

				// Attempt to reconnect after a delay
				setTimeout(() => {
					if (!this.connected && this.sseUrl) {
						this.log('debug', 'Attempting SSE reconnection...')
						this.readSSEStream(this.sseUrl)
					}
				}, 5000)
			}
		} catch (error) {
			this.log('error', `Failed to create SSE connection: ${error.message}`)
			this.updateStatus(InstanceStatus.UnknownError, 'SSE Setup Failed')
		}
	}

	/**
	 * Checks if an object is empty (has no keys).
	 * @param {Object} obj - The object to check.
	 * @returns {boolean} True if the object is empty, false otherwise.
	 */
	isObjEmpty(obj) {
		return Object.keys(obj).length === 0
	}

	/**
	 * Initialization of the module.
	 * Sets up API URLs, loads show info, and starts SSE and polling.
	 * @param {*} config - Module configuration object.
	 * @returns {Promise<void>}
	 */
	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting, 'Initializing...')

		if (!this.config.host || this.config.host.trim() === '') {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}

		this.baseUrl = `http://${this.config.host}:3019/v0`
		this.sseUrl = `http://${this.config.host}:3019/v1/sse`

		// Get base show info to load timelines
		createVariableDefinitions(this) // export variable definitions

		try {
			await this.getShowInfo()
			this.updateActions()
			this.updateVariables()
			this.updatePresets()
			this.updateFeedbacks()

			// Now that we have the show info, we can start the SSE stream
			this.readSSEStream(this.sseUrl)

			// Start polling for show info updates (timeline structure changes)
			this.startPollingShowInfo()

			this.updateStatus(InstanceStatus.Ok, 'Connected')
		} catch (e) {
			this.log('error', `Error while getting showInfo: ${e.message}`)
			this.updateStatus(InstanceStatus.UnknownError, `Connection failed: ${e.message}`)
		}
	}

	/**
	 * Get a readable stream from a SSE endpoint.
	 * @async
	 * @param {string} url - The SSE endpoint URL.
	 * @returns {Promise<ReadableStream>} The response body as a readable stream.
	 * @throws {Error} If the fetch request fails.
	 */
	getReadableStream = async (url) => {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return response.body // ReadableStream
	}

	/**
	 * Updates the local playbackStatus array with timelines from the given array.
	 * @param {Array<Object>} timelines - Array of timeline objects to update.
	 */
	updateTimelinesFromArray(timelines) {
		timelines.forEach((timeline) => {
			const timelineIndex = this.playbackStatus.findIndex((t) => t.id === timeline.id)
			if (timelineIndex > -1) {
				this.playbackStatus[timelineIndex] = timeline
			} else {
				this.playbackStatus.push(timeline)
			}
		})
	}

	/**
	 * Handles SSE parse events.
	 * Updates state and variables based on event kind.
	 * @param {*} event - The SSE event object.
	 */
	onParse = (event) => {
		if (event.type !== 'event') {
			return
		}

		try {
			const collectedData = JSON.parse(event.data)

			switch (collectedData.kind) {
				case 'playbackState':
					// update heartbeat variable
					if (collectedData.value && collectedData.value.clockTime) {
						const date = new Date(collectedData.value.clockTime)
						this.setVariableValues({
							heartbeat: date.toString(),
						})
					}

					if (collectedData.value && collectedData.value.timelines) {
						this.updateTimelinesFromArray(collectedData.value.timelines)
						this.checkFeedbacks('timeLineState')
					}
					break

				case 'reconnect-interval':
					this.log('debug', `Reconnect interval: ${JSON.stringify(collectedData)}`)
					break

				case 'showRevision':
					this.log('debug', `Show revision: ${collectedData.value?.revision || 'unknown'}`)
					break

				case 'inputs':
					this.log('debug', 'Inputs updated')
					break

				case 'cueVisibility':
					this.log('debug', 'Cue visibility changed')
					break

				case 'mediaPresetsChange':
					this.log('debug', 'Media presets changed')
					break

				case 'mediaPresetsActive':
					if (collectedData.value) {
						this.mediaPresetsActive = collectedData.value
						this.log('debug', `Media presets active: ${JSON.stringify(this.mediaPresetsActive)}`)
						this.checkFeedbacks('mediaPresetActive')
					}
					break

				default:
					this.log('debug', `Unhandled SSE event kind: ${collectedData.kind}`)
					break
			}
		} catch (error) {
			this.log('error', `Failed to parse SSE event: ${error.message}`)
		}
	}

	/**
	 * Starts polling the show info at a regular interval.
	 * @returns {void}
	 */
	async startPollingShowInfo() {
		if (this.pollingShowInfo !== undefined) clearInterval(this.pollingShowInfo)

		this.pollingShowInfo = setInterval(async () => {
			try {
				await this.getShowInfo()
				// Update UI elements when timeline structure changes
				this.updateActions()
				this.updateVariables()
				this.updatePresets()
			} catch (error) {
				this.log('debug', `Polling show info failed: ${error.message}`)
			}
		}, 10000) // Poll every 10 seconds instead of 5 to reduce load
	}

	/**
	 * Get the timeline state from the API and update local state.
	 * @async
	 * @returns {Promise<void>}
	 */
	getTimeLineState = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/state`, { method: 'GET' })
			let resultData = await response.json()
			this.updateTimelinesFromArray(resultData.value.timelines)
			let clockTime = resultData.clockTime
			let date = new Date(clockTime) // create Date object
			this.setVariableValues({
				heartbeat: date.toString(),
			})
			this.checkFeedbacks('timeLineState')
		} catch (e) {
			this.log('error', `API heartbeat Request failed (${e.message})`)
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}

	/**
	 * Get the show info from the API and update local state.
	 * @async
	 * @returns {Promise<void>}
	 */
	getShowInfo = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/show`, { method: 'GET' })

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const resultData = await response.json()

			// Validate response structure
			if (!resultData.show || !resultData.show.timelines) {
				throw new Error('Invalid response structure from show endpoint')
			}

			this.show = resultData.show
			this.snapshots = resultData.mediaPresets || { presets: {} }

			// // Log timeline data structure for debugging
			// if (this.show.timelines) {
			// 	this.log('info', 'Timeline data received from Watchout:')
			// 	this.log('info', JSON.stringify(this.show.timelines, null, 2))
			// }

			// Set variables safely
			this.setVariableValues({
				director: this.show.hosts?.director || 'Unknown',
				asset_manager: this.show.hosts?.asset_manager || 'Unknown',
				show_name: resultData.showName || 'Unknown',
			})

			// Get cue sets
			try {
				const response2 = await fetch(`${this.baseUrl}/cue-group-state/by-name`, { method: 'GET' })
				if (response2.ok) {
					const resultData2 = await response2.json()
					this.cueSets = resultData2 || {}
				} else {
					this.log('warn', `Cue groups not available: ${response2.statusText}`)
					this.cueSets = {}
				}
			} catch (cueError) {
				this.log('warn', `Failed to get cue groups: ${cueError.message}`)
				this.cueSets = {}
			}
		} catch (e) {
			this.log('error', `API ShowInfo Request failed: ${e.message}`)
			this.updateStatus(InstanceStatus.UnknownError, `Show info failed: ${e.message}`)
			throw e
		}
	}

	/**
	 * Called when the module is destroyed.
	 * Cleans up SSE connection and polling intervals.
	 * @async
	 * @returns {Promise<void>}
	 */
	async destroy() {
		this.log('debug', 'Destroying module')

		// Clean up SSE connection
		if (this.es) {
			this.es.close()
			this.es = null
		}

		// Clean up polling interval
		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = null
		}

		this.connected = false
	}

	/**
	 * Called when the module configuration is updated.
	 * Resets connections and reloads show info.
	 * @async
	 * @param {*} config - The updated configuration object.
	 * @returns {Promise<void>}
	 */
	async configUpdated(config) {
		this.log('debug', `Config updated: ${JSON.stringify(config)}`)
		this.config = config

		// Clean up existing connections
		if (this.es) {
			this.es.close()
			this.es = null
		}

		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = null
		}

		// Reset connection state
		this.connected = false

		// Re-initialize with new config
		await this.init(config)
	}

	/**
	 * Returns the configuration fields for the web config UI.
	 * @returns {Array<Object>} Array of config field definitions.
	 */
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Director IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'checkbox',
				id: 'sortTimelines',
				label: 'Sort timelines on name',
				width: 8,
				default: false,
			},
			{
				type: 'dropdown',
				id: 'defaultToggleBehavior',
				label: 'Default toggle behavior',
				width: 8,
				default: 'play',
				choices: [
					{ id: 'play', label: 'Play (default when timeline is stopped)' },
					{ id: 'pause', label: 'Pause (default when timeline is stopped)' },
				],
			},
		]
	}

	/**
	 * Get sorted timelines based on configuration
	 * @returns {Array} Array of timeline objects with id and name properties
	 */
	getSortedTimelines() {
		const timelines = []
		
		// Collect all timelines
		if (this.show && this.show.timelines && typeof this.show.timelines === 'object') {
			for (const key in this.show.timelines) {
				if (Object.hasOwnProperty.call(this.show.timelines, key)) {
					const timeline = this.show.timelines[key]
					if (timeline && timeline.name) {
						timelines.push({ id: key, name: timeline.name, data: timeline })
					}
				}
			}
		}
		
		// Sort based on configuration
		if (this.config.sortTimelines) {
			// Sort by name when config enabled
			timelines.sort((a, b) => a.name.localeCompare(b.name))
		} else {
			// Default: Sort by ID to preserve Watchout's order
			timelines.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
		}
		
		return timelines
	}

	/**
	 * Updates the action definitions for the module.
	 * @returns {void}
	 */
	updateActions() {
		this.setActionDefinitions(getActions(this))
	}

	/**
	 * Updates the preset definitions for the module.
	 * @returns {void}
	 */
	updatePresets() {
		this.setPresetDefinitions(getPresets(this))
	}

	/**
	 * Updates the feedback definitions for the module.
	 * @returns {void}
	 */
	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	/**
	 * Updates the variable definitions and values for the module.
	 * @returns {void}
	 */
	updateVariables() {
		setDynamicVariables(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
