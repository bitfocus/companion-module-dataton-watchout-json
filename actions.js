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

    // Populate cue sets
    for (const key1 in instance.cueSets) {
        if (Object.hasOwnProperty.call(instance.cueSets, key1)) {
            const element = instance.cueSets[key1]
            instance.CHOICES_CUESETS.push({ id: key1, label: key1 })
        }
    }

    // Populate timelines and cues
    for (const key1 in instance.show.timelines) {
        if (Object.hasOwnProperty.call(instance.show.timelines, key1)) {
            const element = instance.show.timelines[key1]
            instance.CHOICES_TIMELINES.push({ id: key1, label: element.name })
            if (!instance.isObjEmpty(element.cues)) {
                for (const key2 in element.cues) {
                    if (Object.hasOwnProperty.call(element.cues, key2)) {
                        const cue = element.cues[key2]
                        instance.CHOICES_CUES.push({
                            id: `${key1}/${key2}`,
                            label: `${element.name}: ${cue.state} ${cue.name !== null ? cue.name : 'no_name'} at ${cue.start}ms`,
                        })
                    }
                }
            }
        }
    }

    // Sort timelines if configured
    if (instance.config.sortTimelines) {
        instance.CHOICES_TIMELINES.sort((a, b) => a.label.localeCompare(b.label))
    } else {
        instance.CHOICES_TIMELINES.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    }

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
            instance.playbackStatus.forEach((timeline) => {
                if (timeline.id === action.options.timeline && timeline.playbackStatus === 'run') {
                    action.options.action = 'pause'
                } else {
                    action.options.action = 'play'
                }
            })
            instance.log('debug', `API send: ${instance.baseUrl}/${action.options.action}/${action.options.timeline}`)
            try {
                await fetch(`${instance.baseUrl}/${action.options.action}/${action.options.timeline}`, { method: 'POST' })
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
            instance.playbackStatus.forEach(async (timeline) => {
                if (timeline.id === action.options.timeline && timeline.playbackStatus.toString() === action.options.status) {
                    instance.log('debug', `API send: ${instance.baseUrl}/play/${action.options.timeline}`)
                    try {
                        await fetch(`${instance.baseUrl}/play/${action.options.timeline}`, { method: 'POST' })
                    } catch (error) {
                        instance.log('error', `Failed to send play action: ${error.message}`)
                    }
                }
            })
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
            instance.playbackStatus.forEach(async (timeline) => {
                if (timeline.id === action.options.timeline2 && timeline.playbackStatus.toString() === action.options.status) {
                    instance.log('debug', `API send: ${instance.baseUrl}/play/${action.options.timeline1}`)
                    try {
                        await fetch(`${instance.baseUrl}/play/${action.options.timeline1}`, { method: 'POST' })
                    } catch (error) {
                        instance.log('error', `Failed to send play action: ${error.message}`)
                    }
                }
            })
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
            instance.log('debug', `API send: ${instance.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`)
            try {
                await fetch(`${instance.baseUrl}/jump-to-cue/${action.options.cue}?state=${action.options.state}`, { method: 'POST' })
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
                default: instance.CHOICES_CUESETS[0].id,
                choices: instance.CHOICES_CUESETS,
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

    // Example for future snapshot actions (commented out)
    // actions['snapshot_single'] = { ... }
    // actions['snapshot_clear'] = { ... }

    return actions
}

module.exports = { getActions }