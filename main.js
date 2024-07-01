const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades.js')
const { getActions } = require('./actions')
const { getPresets } = require('./presets')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const UpdateFeedbacks = require('./feedbacks.js')
const { createVariableDefinitions, setDynamicVariables } = require('./variables.js')
const { createParser } = require('eventsource-parser')

/**
 * Main module class
 */
class ModuleInstance extends InstanceBase {
	// Some basic objects and variables
	show
	baseUrl
	playbackStatus
	CHOICES_TIMELINES
	CHOICES_CUES
	pollingTimeLineState
	pollingShowInfo
	connected = false

	constructor(internal) {
		super(internal)
	}

	isObjEmpty(obj) {
		return Object.keys(obj).length === 0
	}

	/**
	 * initialisation of the module
	 * @param {*} config
	 */
	async init(config) {
		this.config = config
		if (this.config.host !== undefined && this.config.host !== '') {
			this.baseUrl = `http://${this.config.host}:3019/v0`
			this.sseUrl = `${this.baseUrl}/sse`

			// Get base show info to load timelines
			createVariableDefinitions(this) // export variable definitions
			await this.getShowInfo()
			if (this.connected) {
				this.getTimeLineState()
				this.readSSEStream(this.sseUrl).catch(console.error)
				// this.startPollingTimeLineState()
				this.startPollingShowInfo()
			}
		}
		this.updateFeedbacks()
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

	/**
	 * handle sse parse events
	 * @param {*} event
	 */
	onParse = (event) => {
		switch (event.type) {
			case 'event':
				try {
					let parsedData = JSON.parse(event.data)
					if (parsedData.type === 'playbackState') {
						// update heartbeat variable
						let date = new Date(parsedData.clockTime) // create Date object
						this.setVariableValues({
							heartbeat: date.toString(),
						})
						this.playbackStatus = parsedData
						this.checkFeedbacks('timeLineState')
					}
				} catch (error) {
					console.error('error parsing data: %s', error)
				}
				break
			case 'reconnect-interval':
				console.log('reconnect-interval: %s', event.data)
				break

			default:
				console.log('no case for: %s', event.type)
				break
		}
	}

	/**
	 * Main function to setup the SSE stream and parser
	 * @param {*} url
	 */
	readSSEStream = async (url) => {
		const parser = createParser(this.onParse)
		const sseStream = await this.getReadableStream(url)

		for await (const chunk of sseStream) {
			parser.feed(chunk.toString())
		}
	}
	/**
	 * Create a polling intervals to get the timeline states and show info
	 */
	async startPollingTimeLineState() {
		if (this.pollingTimeLineState !== undefined) clearInterval(this.pollingTimeLineState)

		this.pollingTimeLineState = setInterval(async () => {
			await this.getTimeLineState()
		}, 1000)
	}
	async startPollingShowInfo() {
		if (this.pollingShowInfo !== undefined) clearInterval(this.pollingShowInfo)

		this.pollingShowInfo = setInterval(async () => {
			await this.getShowInfo()
		}, 15000)
	}

	/**
	 * Get the timeline state from the API
	 */
	getTimeLineState = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/state`, { method: 'GET' })
			let resultData = await response.json()
			this.playbackStatus = resultData
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
	 */
	getShowInfo = async () => {
		try {
			const response = await fetch(`${this.baseUrl}/show`, { method: 'GET' })
			let resultData = await response.json()
			this.show = resultData.show
			this.updateStatus(InstanceStatus.Ok)
			createVariableDefinitions(this) // export variable definitions
			this.setVariableValues({
				director: this.show.hosts.director,
				asset_manager: this.show.hosts.asset_manager,
			})
			this.updateActions()
			this.updateVariables()
			this.updatePresets()
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
		clearInterval(this.pollingTimeLineState)
		clearInterval(this.pollingShowInfo)
	}
	/**
	 * When the config is updated
	 * @param {*} config
	 */
	async configUpdated(config) {
		parser.reset()
		clearInterval(this.pollingTimeLineState)
		clearInterval(this.pollingShowInfo)
		this.config = config
		this.baseUrl = `http://${this.config.host}:3019/v0`
		this.sseUrl = `${this.baseUrl}/sse`
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
