const createVariableDefinitions = (instance) => {
	
	instance.setVariableDefinitions([
		{ variableId: 'heartbeat', name: 'Last reply from Watchout' },
		{ variableId: 'asset_manager', name: 'Asset Manager' },
		{ variableId: 'director', name: 'Director' },
		{ variableId: 'show_name', name: 'Show name' },
		// ...dynamicVariables,
	])
}

const setDynamicVariables = (instance) => {
	let dynamicVariables = []
	for (const key in instance.show.timelines) {
		if (Object.hasOwnProperty.call(instance.show.timelines, key)) {
			const element = instance.show.timelines[key]
			dynamicVariables.push({ variableId: `${key}`, name: `Timeline ${element.name}` })
		}
	}
	for (const key in instance.snapshots.presets) {
		if (Object.hasOwnProperty.call(instance.snapshots.presets, key)) {
			const element = instance.snapshots.presets[key]
			dynamicVariables.push({ variableId: `${key}`, name: `Snapshot ${element.name}` })
		}
	}
	instance.setVariableDefinitions([
		{ variableId: 'heartbeat', name: 'Last reply from Watchout' },
		{ variableId: 'asset_manager', name: 'Asset Manager' },
		{ variableId: 'director', name: 'Director' },
		{ variableId: 'show_name', name: 'Show name' },
		...dynamicVariables,
	])
	let valuesVariables = {}
	for (const key in instance.snapshots.presets) {
		if (Object.hasOwnProperty.call(instance.snapshots.presets, key)) {
			const element = instance.snapshots.presets[key]
			valuesVariables[key] = element.name
		}
	}
	for (const key in instance.show.timelines) {
		if (Object.hasOwnProperty.call(instance.show.timelines, key)) {
			const element = instance.show.timelines[key]
			valuesVariables[key] = element.name
		}
	}
	instance.setVariableValues(valuesVariables)
}

module.exports = { createVariableDefinitions, setDynamicVariables }
