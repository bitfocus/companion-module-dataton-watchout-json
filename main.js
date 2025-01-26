const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades.js')
const { getActions } = require('./actions')
const { getPresets } = require('./presets')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const UpdateFeedbacks = require('./feedbacks.js')
const { createVariableDefinitions, setDynamicVariables } = require('./variables.js')
const { createParser } = require('eventsource-parser')

// Function to simulate getting a readable stream from an SSE endpoint
const getSomeReadableStream = async (url) => {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to connect to ${url}`)
	}
	return response.body // This is the Node.js readable stream
}

class ModuleInstance extends InstanceBase {
	// Some basic objects and variables
	show
	snapshots
	baseUrl
	sseUrl
	playbackStatus = []
	mediaPresetsActive
	CHOICES_TIMELINES
	CHOICES_CUES
	CHOICES_SNAPSHOTS
	pollingShowInfo
	connected = false

	constructor(internal) {
		super(internal)
	}

	isObjEmpty(obj) {
		return Object.keys(obj).length === 0
	}

	/**
	 * initialization of the module
	 * @param {*} config
	 */
	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok, 'Initializing...')
		if (this.config.host !== undefined && this.config.host !== '') {
			this.baseUrl = `http://${this.config.host}:3019/v0`
			this.sseUrl = `http://${this.config.host}:3019/v1/sse`

			// Get base show info to load timelines
			createVariableDefinitions(this) // export variable definitions

			await this.getShowInfo()
			this.updateStatus(InstanceStatus.Ok, 'Connected')	
			if (this.connected) {
				this.readSSEStream(this.sseUrl).catch(console.error)
				// this.startPollingShowInfo()
			}
			this.updateFeedbacks()
		}
	}

	/**
	 * Get a readable stream from a SSE endpoint
	 * @param {*} url
	 * @returns Readable Stream
	 */
	getReadableStream = async (url) => {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return response.body // ReadableStream
	}
	// // Function to handle parsed events
	// const onParse = (event) => {
	// 	if (event.type === 'event') {
	// 		console.log('data: %s', event.data)
	// 	} else if (event.type === 'reconnect-interval') {
	// 		console.log('We should set reconnect interval to %d milliseconds', event.value)
	// 	}
	// }
	/**
	 * handle sse parse events
	 * @param {*} event
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
						// Collected data has an array of timelines
						collectedData.value.timelines.forEach(timeline => {
							// check if the timeline is in local cache
							let timelineIndex = this.playbackStatus.findIndex(t => t.id === timeline.id)
							if (timelineIndex > -1) {
								// update the timeline
								this.playbackStatus[timelineIndex] = timeline
							} else {
								// add the timeline
								this.playbackStatus.push(timeline)
							}
						});
						
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

	// /**
	//  * Main function to setup the SSE stream and parser
	//  * @param {*} url
	//  */
	// readSSEStream = async (url) => {
	// 	const parser = createParser(this.onParse)
	// 	const sseStream = await this.getReadableStream(url)

	// 	for await (const chunk of sseStream) {
	// 		parser.feed(chunk.toString())

	// 		readSSEStream(this.sseUrl).catch(console.error)

	// 	}
	// }

	// Main function to set up the SSE stream and parser
	readSSEStream = async (url) => {
		const parser = createParser(this.onParse)
		const sseStream = await getSomeReadableStream(url)

		for await (const chunk of sseStream) {
			parser.feed(chunk.toString())
		}
	}

	async startPollingShowInfo() {
		if (this.pollingShowInfo !== undefined) clearInterval(this.pollingShowInfo)

		this.pollingShowInfo = setInterval(async () => {
			await this.getShowInfo()
		}, 5000)
	}

	/**
	 * Get the timeline state from the API
	 */
	getTimeLineState = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/state`, { method: 'GET' })
			let resultData = await response.json()
			// console.log(resultData)
			collectedData.value.timelines.forEach(timeline => {
				// check if the timeline is in local cache
				let timelineIndex = this.playbackStatus.findIndex(t => t.id === timeline.id)
				if (timelineIndex > -1) {
					// update the timeline
					this.playbackStatus[timelineIndex] = timeline
				} else {
					// add the timeline
					this.playbackStatus.push(timeline)
				}
			});
			// this.playbackStatus = resultData
			let clockTime = resultData.clockTime
			let date = new Date(clockTime) // create Date object
			this.setVariableValues({
				heartbeat: date.toString(),
			})
			this.checkFeedbacks('timeLineState')
		} catch (e) {
			this.log('error', `API heartbeat Request failed (${e.message})`)
			this.connected = false
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}

	/**
	 * Get the show info from the API
	 **/
	getShowInfo = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/show`, { method: 'GET' })
			let resultData = await response.json()
			this.show = resultData.show
			this.snapshots = resultData.mediaPresets
			createVariableDefinitions(this)
			this.setVariableValues({
				director: this.show.hosts.director,
				asset_manager: this.show.hosts.asset_manager,
			})

			this.updateActions()
			this.updateVariables()
			this.updatePresets()
			this.updateFeedbacks()
			this.connected = true
		} catch (e) {
			this.log('error', `API ShowInfo Request failed (${e.message})`)
			this.connected = false
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}

	/**
	 * When the module is destroyed
	 */
	async destroy() {
		this.log('debug', 'destroy')

		this.connected = false

		parser.reset()
		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = undefined
		}
	}
	
	async configUpdated(config) {
		console.log('updating config')
		parser.reset()
		if (this.pollingShowInfo) {
			clearInterval(this.pollingShowInfo)
			this.pollingShowInfo = undefined
		}
		this.config = config
		this.baseUrl = `http://${this.config.host}:3019/v0`
		this.sseUrl = `http://${this.config.host}:3019/v0/sse`
		await this.getShowInfo()
		if (this.connected) {
			readSSEStream(this.sseUrl).catch(console.error)
			// this.startPollingTimeLineState()
			this.startPollingShowInfo()
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Director IP',
				width: 8,
				regex: Regex.IP,
			},
		]
	}

	/**
	 * Handle actions
	 */
	updateActions() {
		this.setActionDefinitions(getActions(this))
	}

	/**
	 * Handle presets
	 */

	updatePresets() {
		this.setPresetDefinitions(getPresets(this))
	}
	/**
	 * Handle feedbacks
	 */
	updateFeedbacks() {
		UpdateFeedbacks(this)
	}
	/**
	 * Handle variables
	 */
	updateVariables() {
		setDynamicVariables(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
