const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
// const UpdateFeedbacks = require('./feedbacks')
// const UpdateVariableDefinitions = require('./variables')

const got = require('got')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}
	
	async init(config) {
		this.config = config
		if(!this.config.host) {
		const baseUrl = `http://${config.host}:3019/v0/`
		
					try {
						const response = await got.get(baseUrl+"show")

							let resultData = response.body

							if (response.statusCode !== 200) {
									resultData = JSON.parse(resultData)
									this.log('debug', `HTTP GET Request successful (${response.statusCode})`)
									console.log("resultData", resultData)
							} else {
								this.log('error', `HTTP GET Request failed (${response.statusCode})`)
								this.updateStatus(InstanceStatus.UnknownError, response.statusCode)
							}
						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `API Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				}

		this.updateActions() // export actions
		// this.updateFeedbacks() // export feedbacks
		// this.updateVariableDefinitions() // export variable definitions
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Producer IP',
				width: 8,
				regex: Regex.IP,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
