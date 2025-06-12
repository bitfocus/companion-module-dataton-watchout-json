const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades.js')
const {EventSource} = require('eventsource')
console.log('EventSource loaded:', typeof EventSource)
const { getActions } = require('./actions')
const { getPresets } = require('./presets')
// Node.js v18+ includes fetch globally.
const UpdateFeedbacks = require('./feedbacks.js')
const { createVariableDefinitions, setDynamicVariables } = require('./variables.js')

/**
 * Main module instance for the Companion Watchout integration.
 * Handles initialization, API communication, SSE, polling, and state management.
 * @class
 * @extends InstanceBase
 */
class ModuleInstance extends InstanceBase {
	// Some basic objects and variables
	show
	snapshots
	cueSets
	baseUrl
	parser
	sseUrl
	playbackStatus = []
	mediaPresetsActive
	CHOICES_TIMELINES
	CHOICES_CUES
	CHOICES_SNAPSHOTS
	CHOICES_CUESETS
	pollingShowInfo
	connected = false
	es = null

	/**
	 * @constructor
	 * @param {*} internal - Internal instance object from Companion
	 */
	constructor(internal) {
		super(internal)
	}
	/**
	 * Main function to setup the SSE stream and this.parser.
	 * Reads the SSE stream and feeds data to the parser.
	 * @async
	 * @param {string} url - The SSE endpoint URL.
	 * @returns {Promise<void>}
	 */
	readSSEStream = (url) => {
		console.log('readSSEStream', url)
		if (this.es) {
			this.es.close()
		}
		this.es = new EventSource(url)
		console.log('EventSource created:', this.es)
		this.es.onmessage = (event) => {
			this.onParse({ type: 'event', data: event.data })
		}
		this.es.onerror = (err) => {
			console.error('SSE error:', err)
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
		this.updateStatus(InstanceStatus.Ok, 'Initializing...')
		if (this.config.host !== undefined && this.config.host !== '') {
			this.baseUrl = `http://${this.config.host}:3019/v0`
			this.sseUrl = `http://${this.config.host}:3019/v1/sse`
			// Get base show info to load timelines
			createVariableDefinitions(this) // export variable definitions

			this.getShowInfo()
				.then(() => {
					this.updateActions()
					this.updateVariables()
					this.updatePresets()
					this.updateFeedbacks()
					// Now that we have the show info, we can start the SSE stream
					this.readSSEStream(this.sseUrl)
					// Start polling the show info
					// this.startPollingShowInfo()
					this.updateStatus(InstanceStatus.Ok, 'Connected')
				})
				.catch((e) => {
					this.log('error', ` Error while getting showInfo, (${e.message})`)
					this.updateStatus(InstanceStatus.UnknownError, 'connection fails')
				})
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
		if (event.type === 'event') {
			try {
				const collectedData = JSON.parse(event.data)
				// console.log('collectedData', collectedData)
				switch (collectedData.kind) {
					case 'playbackState':
						// update heartbeat variable
						let date = new Date(collectedData.value.clockTime) // create Date object
						this.setVariableValues({
							heartbeat: date.toString(),
						})
						this.updateTimelinesFromArray(collectedData.value.timelines)
						this.checkFeedbacks('timeLineState')
						break
					case 'reconnect-interval':
						console.log('reconnect-interval: %s', collectedData)
						break
					case 'showRevision':
						// console.log('Show Revision', collectedData.value.revision)
						break
					case 'inputs':
						// console.log('Inputs', collectedData.value.inputs)
						break
					case 'cueVisibility':
						// console.log('cueVisibility')
						break
					case 'mediaPresetsChange':
						// console.log('mediaPresetsChange')
						break
					case 'mediaPresetsActive':
						this.mediaPresetsActive = collectedData.value
						console.log('mediaPresetsActive', this.mediaPresetsActive)
						this.checkFeedbacks('mediaPresetActive')
						break

					default:
						console.log('no case for: %s', collectedData.kind)
						break
				}
			} catch (error) {
				console.log(error)
			}
		}
	}

	/**
	 * Starts polling the show info at a regular interval.
	 * @returns {void}
	 */
	async startPollingShowInfo() {
		if (this.pollingShowInfo !== undefined) clearInterval(this.pollingShowInfo)

		this.pollingShowInfo = setInterval(() => {
			this.getShowInfo()
		}, 5000)
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
	getShowInfo = () => {
		return new Promise(async (resolve, reject) => {
			try {
				const response = await fetch(`${this.baseUrl}/show`, { method: 'GET' })
				let resultData = await response.json()

				this.show = resultData.show
				this.snapshots = resultData.mediaPresets
				this.setVariableValues({
					director: this.show.hosts.director,
					asset_manager: this.show.hosts.asset_manager,
					show_name: resultData.showName,
				})
				const response2 = await fetch(`${this.baseUrl}/cue-group-state/by-name`, { method: 'GET' })
				if (response2.ok) {
					const resultData2 = await response2.json()
					this.cueSets = resultData2
				} else {
					this.log('error', `API error: ${response2.statusText}`)
				}
				resolve()
			} catch (e) {
				this.log('error', `API ShowInfo Request failed (${e.message})`)
				this.updateStatus(InstanceStatus.UnknownError, e.code)
				reject(e)
			}
		})
	}

	/**
	 * Called when the module is destroyed.
	 * Cleans up parser and polling intervals.
	 * @async
	 * @returns {Promise<void>}
	 */
	async destroy() {
		this.log('debug', 'destroy')
		// stop the this.parser
		if (this.parser) {
			this.parser.reset()
			this.parser = null
		}
		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = undefined
		}
	}

	/**
	 * Called when the module configuration is updated.
	 * Resets connections and reloads show info.
	 * @async
	 * @param {*} config - The updated configuration object.
	 * @returns {Promise<void>}
	 */
	async configUpdated(config) {
		this.log('debug', JSON.stringify(config))
		this.config = config
		if (this.parser) {
			this.parser.reset()
			this.parser = null
		}
		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = undefined
		}
		this.baseUrl = `http://${this.config.host}:3019/v0`
		this.sseUrl = `http://${this.config.host}:3019/v1/sse`
		console.log('configUpdated', this.baseUrl, this.sseUrl)
		createVariableDefinitions(this)
		this.getShowInfo()
			.then(() => {
				this.updateActions()
				this.updateVariables()
				this.updatePresets()
				this.updateFeedbacks()
				// Now that we have the show info, we can start the SSE stream
				this.readSSEStream(this.sseUrl)
				// Start polling the show info
				this.startPollingShowInfo()
				this.log('debug', 'Connected')
				this.updateStatus(InstanceStatus.Ok, 'Connected')
			})
			.catch((e) => {
				this.log('error', 'Error while getting showInfo', e.message)
				this.updateStatus(InstanceStatus.UnknownError, 'connection fails')
			})
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
			},
		]
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
