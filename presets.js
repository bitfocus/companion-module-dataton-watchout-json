const { combineRgb } = require('@companion-module/base')

/**
 * Generates preset button definitions for the Companion Watchout module.
 * Presets include timeline controls, snapshot controls, and utility actions.
 * @param {Object} instance - The module instance object.
 * @returns {Object} presets - The preset definitions object.
 */
const getPresets = (instance) => {
    /** @type {Object} */
    const presets = {}

    /**
     * Preset: Update timeline info
     */
    presets[`show_info`] = {
        type: 'button',
        category: 'Basic',
        name: `Update timeline info`,
        style: {
            text: `Update Timelines`,
            size: 'auto',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'show_information',
                        options: {},
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    }

    /**
     * Preset: Jump to Cue
     */
    presets[`jump_to_cue`] = {
        type: 'button',
        category: 'Basic',
        name: `Jump to Cue`,
        style: {
            text: `Jump to Cue`,
            size: 'auto',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'jump_to_cue',
                        options: {
                            cue: '',
                            state: 'play',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    }

    /**
     * Preset: Jump to Time
     */
    presets[`jump_to_time`] = {
        type: 'button',
        category: 'Basic',
        name: `Jump to Time`,
        style: {
            text: `Jump to Time`,
            size: 'auto',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'jump_to_time',
                        options: {
                            timeline: '0',
                            time: '0',
                            state: 'pause',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    }

    /**
     * Preset: Shutdown node
     */
    presets[`shutdown`] = {
        type: 'button',
        category: 'MISC',
        name: `Shutdown_node`,
        style: {
            text: `Shutdown node`,
            size: '14px',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [
            {
                down: [],
                up: [],
                2000: {
                    // Execute the actions after 2s while the button is held or only after it is released
                    options: { runWhileHeld: true },
                    actions: [
                        {
                            actionId: 'shutdown_node',
                            options: {
                                ip: '',
                            },
                        },
                    ],
                },
            },
        ],
        feedbacks: [],
    }

    // Timeline control presets for each timeline
    for (const key in instance.show.timelines) {
        if (Object.hasOwnProperty.call(instance.show.timelines, key)) {
            /**
             * Preset: Play timeline
             */
            presets[`timeline_playback_control_id${key}`] = {
                type: 'button',
                category: 'Play',
                name: `Play timeline`,
                style: {
                    text: `Play $(watchout-json:${key})`,
                    size: '14px',
                    color: combineRgb(255, 255, 255),
                    bgcolor: combineRgb(0, 0, 0),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: 'timeline_action',
                                options: {
                                    timeline: key,
                                    action: 'play',
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'run',
                        },
                        style: {
                            color: combineRgb(255, 255, 255),
                            bgcolor: combineRgb(0, 204, 0),
                        },
                    },
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'pause',
                        },
                        style: {
                            color: combineRgb(0, 0, 0),
                            bgcolor: combineRgb(255, 255, 0),
                        },
                    },
                ],
            }
            /**
             * Preset: Pause timeline
             */
            presets[`timeline_pause_control_id${key}`] = {
                type: 'button',
                category: 'Pause',
                name: `Pause timeline`,
                style: {
                    text: `Pause $(watchout-json:${key})`,
                    size: '14px',
                    color: combineRgb(255, 255, 255),
                    bgcolor: combineRgb(0, 0, 0),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: 'timeline_action',
                                options: {
                                    timeline: key,
                                    action: 'pause',
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'pause',
                        },
                        style: {
                            color: combineRgb(0, 0, 0),
                            bgcolor: combineRgb(255, 255, 0),
                        },
                    },
                ],
            }
            /**
             * Preset: Toggle timeline
             */
            presets[`timeline_toggle_control_id${key}`] = {
                type: 'button',
                category: 'Toggle',
                name: `Toggle timeline`,
                style: {
                    text: `Toggle $(watchout-json:${key})`,
                    size: '14px',
                    color: combineRgb(255, 255, 255),
                    bgcolor: combineRgb(0, 0, 0),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: 'timeline_toggle',
                                options: {
                                    timeline: key,
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'run',
                        },
                        style: {
                            color: combineRgb(255, 255, 255),
                            bgcolor: combineRgb(0, 204, 0),
                        },
                    },
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'pause',
                        },
                        style: {
                            color: combineRgb(0, 0, 0),
                            bgcolor: combineRgb(255, 255, 0),
                        },
                    },
                ],
            }
            /**
             * Preset: Stop timeline
             */
            presets[`timeline_stop_control_id${key}`] = {
                type: 'button',
                category: 'Stop',
                name: `Stop timeline`,
                style: {
                    text: `Stop $(watchout-json:${key})`,
                    size: '14px',
                    color: combineRgb(255, 255, 255),
                    bgcolor: combineRgb(0, 0, 0),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: 'timeline_action',
                                options: {
                                    timeline: key,
                                    action: 'stop',
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: 'timeLineState',
                        options: {
                            timeline: key,
                            playbackStatus: 'stop',
                        },
                        style: {
                            color: combineRgb(255, 255, 255),
                            bgcolor: combineRgb(0, 0, 204),
                        },
                    },
                ],
            }
        }
    }

    /**
     * Preset: Clear all active snapshots
     */
    presets[`snapshot_clear`] = {
        type: 'button',
        category: 'Snapshot',
        name: `Clear snapshots`,
        style: {
            text: `Clear all active snapshots`,
            size: '14px',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'snapshot_clear',
                        options: {},
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    }

    // Snapshot toggle presets for each snapshot
    for (const key in instance.snapshots.presets) {
        if (Object.hasOwnProperty.call(instance.snapshots.presets, key)) {
            /**
             * Preset: Toggle snapshot
             */
            presets[`snapshot_toggle_control_id${key}`] = {
                type: 'button',
                category: 'Snapshot',
                name: `Toggle snapshot`,
                style: {
                    text: `Toggle Snapshot $(watchout-json:${key})`,
                    size: '14px',
                    color: combineRgb(255, 255, 255),
                    bgcolor: combineRgb(0, 0, 0),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: 'snapshot_single',
                                options: {
                                    snapshot: key,
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: 'mediaPresetActive',
                        options: {
                            mediaPreset: key,
                        },
                        style: {
                            color: combineRgb(255, 255, 255),
                            bgcolor: combineRgb(0, 204, 0),
                        },
                    },
                ],
            }
        }
    }
    return presets
}

module.exports = { getPresets }