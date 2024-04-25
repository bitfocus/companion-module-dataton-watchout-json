const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades.js')
const { getActions } = require('./actions')
const { getPresets } = require('./presets')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const UpdateFeedbacks = require('./feedbacks.js')
const { createVariableDefinitions, setDynamicVariables } = require('./variables.js')


class ModuleInstance extends InstanceBase {
	// Some basic objects and variables
	show
	baseUrl
	playbackStatus
	CHOICES_TIMELINES
	CHOICES_CUES
	pollingTimeLineState
	pollingShowInfo

	constructor(internal) {
		super(internal)
	}

	isObjEmpty(obj) {
		return Object.keys(obj).length === 0
	}

	async init(config) {
		this.config = config
		if (this.config.host !== undefined && this.config.host !== '') {
			this.baseUrl = `http://${this.config.host}:3019/v0`

			// Get base show info to load timelines
			await this.getShowInfo()
			this.updateStatus(InstanceStatus.Ok)
			this.updateActions() // export actions
			this.updateFeedbacks() // export feedbacks
			this.updatePresets() // export presets
			createVariableDefinitions(this) // export variable definitions
			this.startPollingTimeLineState()
			this.startPollingShowInfo()
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
		}, 5000)
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
			this.setVariableValues({
				director: this.show.hosts.director,
				asset_manager: this.show.hosts.asset_manager,
			})
			this.updateActions()
			this.updateVariables()
			this.updatePresets()
		} catch (e) {
			this.log('error', `API ShowInfo Request failed (${e.message})`)
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
		clearInterval(this.pollingTimeLineState)
		clearInterval(this.pollingShowInfo)
	}

	async configUpdated(config) {
		this.config = config
		this.baseUrl = `http://${this.config.host}:3019/v0`
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

	updateActions() {
		this.setActionDefinitions(getActions(this))
	}
	
	updatePresets() {
		this.setPresetDefinitions(getPresets(this))
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariables() {
		setDynamicVariables(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
