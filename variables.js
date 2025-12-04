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
	let valuesVariables = {}
	// Safely process timelines
	if (instance.show && instance.show.timelines && typeof instance.show.timelines === 'object') {
		for (const key in instance.show.timelines) {
			if (Object.hasOwnProperty.call(instance.show.timelines, key)) {
				const element = instance.show.timelines[key]
				for (const key2 in element.cues) {
					if (Object.hasOwnProperty.call(element.cues, key2)) {
						const cueElement = element.cues[key2]
						
						if (cueElement && cueElement.name) {
							dynamicVariables.push({ variableId: `timeline_${key}_cue_${key2}`, name: `Cue ${cueElement.name} (Timeline ${element.name})` })
							valuesVariables[`timeline_${key}_cue_${key2}`] = null ? 'no data': cueElement.name
						}
					}
				}
				if (element && element.name) {
					dynamicVariables.push({ variableId: `${key}`, name: `Timeline ${element.name}` })
					valuesVariables[key] = element.name
				}
			}
		}
	}

	// Safely process snapshots
	if (instance.snapshots && instance.snapshots.presets && typeof instance.snapshots.presets === 'object') {
		for (const key in instance.snapshots.presets) {
			if (Object.hasOwnProperty.call(instance.snapshots.presets, key)) {
				const element = instance.snapshots.presets[key]
				if (element && element.name) {
					dynamicVariables.push({ variableId: `${key}`, name: `Snapshot ${element.name}` })
					valuesVariables[key] = element.name
				}
			}
		}
	}

	// Set variable definitions
	instance.setVariableDefinitions([
		{ variableId: 'heartbeat', name: 'Last reply from Watchout' },
		{ variableId: 'asset_manager', name: 'Asset Manager' },
		{ variableId: 'director', name: 'Director' },
		{ variableId: 'show_name', name: 'Show name' },
		...dynamicVariables,
	])

	// Set variable values
	instance.setVariableValues(valuesVariables)
}

module.exports = { createVariableDefinitions, setDynamicVariables }
