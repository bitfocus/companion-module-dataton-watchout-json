const createVariableDefinitions = (base) => {
	
	base.setVariableDefinitions([
		{ variableId: 'heartbeat', name: 'Last reply from Watchout' },
		{ variableId: 'asset_manager', name: 'Asset Manager' },
		{ variableId: 'director', name: 'Director' },
		// ...dynamicVariables,
	])
}

const setDynamicVariables = (base) => {
	dynamicVariables = []
	for (const key in base.show.timelines) {
		if (Object.hasOwnProperty.call(base.show.timelines, key)) {
			const element = base.show.timelines[key]
			dynamicVariables.push({ variableId: `${key}`, name: `Timeline ${element.name}` })
		}
	}
	base.setVariableDefinitions([
		{ variableId: 'heartbeat', name: 'Last reply from Watchout' },
		{ variableId: 'asset_manager', name: 'Asset Manager' },
		{ variableId: 'director', name: 'Director' },
		...dynamicVariables,
	])
	valuesVariables = {}
	for (const key in base.show.timelines) {
		if (Object.hasOwnProperty.call(base.show.timelines, key)) {
			const element = base.show.timelines[key]
			valuesVariables[key] = element.name
		}
	}
	base.setVariableValues(valuesVariables)
}

module.exports = { createVariableDefinitions, setDynamicVariables }
