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
	 * Preset: Jump to Cue
	 */
	presets[`jump_to_cue`] = {
		type: 'button',
		category: 'Navigation',
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
		category: 'Navigation',
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
	 * Preset: Send Input Value
	 */
	presets[`send_input`] = {
		type: 'button',
		category: 'Inputs',
		name: `Send Input Value`,
		style: {
			text: `Send Input`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'send_inputs',
						options: {
							input_key: '',
							input_value: 0,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Preset: Send Multiple Inputs
	 */
	presets[`send_multiple_inputs`] = {
		type: 'button',
		category: 'Inputs',
		name: `Send Multiple Inputs`,
		style: {
			text: `Send Multiple\\nInputs`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'send_multiple_inputs',
						options: {
							inputs_json: '[{"key": "InputName", "value": 0.5}]',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Preset: Load Show from JSON
	 */
	presets[`load_show_json`] = {
		type: 'button',
		category: 'Show Management',
		name: `Load Show JSON`,
		style: {
			text: `Load Show\\nfrom JSON`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'load_show_json',
						options: {
							show_json: '{}',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Preset: Load Show from File
	 */
	presets[`load_show_file`] = {
		type: 'button',
		category: 'Show Management',
		name: `Load Show File`,
		style: {
			text: `Load Show\\nfrom File`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'load_show_file',
						options: {
							show_file_path: '',
							show_name: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Preset: Set Multiple Cue Groups
	 */
	presets[`set_multiple_cue_groups`] = {
		type: 'button',
		category: 'Cue Sets',
		name: `Set Multiple Cue Groups`,
		style: {
			text: `Set Multiple\\nCue Groups`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'set_multiple_cue_groups',
						options: {
							cue_groups_json: '{"GroupName1": "VariantName1"}',
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

	// Timeline control presets for each timeline (in sorted order)
	const sortedTimelines = instance.getSortedTimelines()
	// instance.log('info', `Creating presets for ${sortedTimelines.length} timelines in order: ${sortedTimelines.map(t => `${t.id}:"${t.name}"`).join(', ')}`)
	
	sortedTimelines.forEach((timeline, index) => {
		const key = timeline.id
		const sortIndex = String(index + 1).padStart(3, '0') // 001, 002, 003, etc.
		// instance.log('debug', `Creating presets for timeline: ID=${key}, Name="${timeline.name}", Sort=${sortIndex}`)
		
		/**
		 * Preset: Play timeline
		 */
		presets[`${sortIndex}_timeline_play_id${key}`] = {
			type: 'button',
			category: 'Play',
			name: `Play timeline`,
			style: {
				text: `\\n$(watchout-json:${key})`,
				size: '14px',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAC4jAAAuIwF4pT92AAADdklEQVR4nO3YT2gcVRzA8e/vzeySxPontQasiQE1FkWqBfHfxXpSaUNExUPx4kUPBRGtp6YipBQRq9SD54JCqQcFG6lCvYiYosWj1WoViuh6iDWJlTW7+34ys02g2938tuKlj9/nMrszO+/w5c3smxGU0k0LMPkj1AMMAAKbY5RJhQcQbgGG27s5C5xGmSMwGxv6TcjaB2Yn4Ker2uPpysCXubxzh8CdUWUPMIlQ7XLOBmAC4RGUV0Ims6B7gRMkKKx8aErxRXbmKl8AT0DXOJ0yhClEPg8qLzZXR0tH/ugp0AjrWjIdhZniUvkPBjWw/95fZP0m1elyjNtIQr5lAVpBHl+GmWIWdVqOSlSoBgjSO18ERv9i98amfNdq6XskIixFhv+GA93iNFXZOvIc2za+TB4Gqbd0zZtvcYnFKm/KACMkIlCRpxBGLz6kqMJ91z7D1A2vs2vTl9y9/jGasT2riuM9XKdBniYRxW11aq0fLMdz5XZ06C6evflDdk7MMn7FFuqt9gzrRoTtJCIo3H4pJ9xx9bZyNu0YP8BwZay893RSLddNSQgC55d2/auEAbaOPM+O8XdolbPowpkkyjoSUSwUl86vkvsWtcHc/EE+rb1WLoQ6KbSvywTkIpxU5cZ+T/h+8RhHft3DqaXj5KE9QCcJnCYRuSofAQ/3+kE1DJXbWv0kR3+b4ev5Q+V9ZyAr9nZfF0nkYxKRE/QwUaaB6y88JIgoJ/44xLeLR/ms9haLzaUyTN4jTEGFecn0XRKRD8G8Bl5otDjcuVjMRTj2+9urK+nBbO0HkYpCHXada1IjEfnPY8VG38//lM0bzrJbOx44q8X/XB9EoTbEG8sVPUhCZOUfemwRnvxBXmoIe6X9SuhSNDLl1Q9u1X1nrkzrfdDqfMkUouj+f3J9EMqbbOxzjE9CxkOa6b6s3zMu5xdmEb4i6vaQcU9UKV6a3a/KuMA1xXEVFoAzAY43RI9kwlxxEaYxXy4m2uN5yrUl+A7w/+WBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IEMHsjggQweyOCBDB7I4IFY278IffcsVrnVjAAAAABJRU5ErkJggg==',
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
		presets[`${sortIndex}_timeline_pause_id${key}`] = {
			type: 'button',
			category: 'Pause',
			name: `Pause timeline`,
			style: {
				text: `\\n$(watchout-json:${key})`,
				size: '14px',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAC4jAAAuIwF4pT92AAAB80lEQVR4nO3YzWoTURyG8Wdm+oEkNI2lKRbsDbl3L+69DkEQxFUXbtyIl+IVuBWDSj/MJMaSscnMKSdN6aS2eRXcOLy/RcjJ/BnIwyFhThJC4Mrp5+Rl2uZJp8s0TaAoyMY539anPCXhw3wy8Gi2zqutHbqbG5RlCaOcjAkvdh6G5zRMUg+Uj5Kf3Q6tcrFOgaqCL31epynPsgxC4P3ePo9jwCreYDF3ckx/txcOaJi1+mKrw1kJrat1FV9S2D9gwiIGMIlv5tfmGwpi0Pu7nNFAS4FigOv9dC3ulrrbZpIbM40MdNsXX/X53878j+LPh63gQIIDCQ4kOJDgQIIDCQ4kOJDgQIID/YuH1eTG+k9mGrmDwh3PnGUFVbwY7p6pQjOfV5d20HhEe7tzeb5TPzD72udelkK2No/U2ntweQRSPzA7PqHd69HsHTT7wZt8yJjAIIVBUTAcHPFxO+VdPEXbmMLmjLeDIz79OmcYZ6qK/Pspw6zgkAZaOnK13/lfTHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYEEBxIcSHAgwYFY7QLsEXoNuREH4wAAAABJRU5ErkJggg==',
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
		presets[`${sortIndex}_timeline_toggle_id${key}`] = {
			type: 'button',
			category: 'Toggle',
			name: `Toggle timeline`,
			style: {
				text: `\\n$(watchout-json:${key})`,
				size: '14px',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAC4jAAAuIwF4pT92AAADBElEQVR4nO3Y30tTYRjA8e/54dSm04yiLDJFyQiMirwJdhMGwQiKqKuCEdRt1/0B9Q90VzHqKoqgi9FFUBeLggqiCKRfIkVCaIlrzs3t7LzxHpSibM9uOzyfq7m958C+PG7vO8cYg/o3t8lrCvDXejKdz3UDZ4BjwE5gXQv3qgAfgHvAjUImu0AMOH/+i6XzuXHgKjAmXVwLGwTG4DkO9i6hMbS7nv37LXCukMk+Jk6B0vncHuAR0NfsIgNUGwEjXb0c2ridHckUtTDkdXGWR3NfKNaXbagSMFHIZJ8Rh0DpfK4DeArslS6qNAKObhni/OAYqbZENEUORJP0cbHI5XfP+VhesJHsJB0oZLKLxOBD+mQrcaphwMEN/VwY3kfC9VgM6tE02Wj28VCyh4uj46xva6dhwlHgNP+xPwM1ZYCE43Fq205cxyEw4V9rlhp1hpM9HNk8yHLYsE+dICaBdkuLgzCkv7OLwWRq9c2vqW5C9vduiibMwAgxCZSSFocYUn4i+qZqtsEMDXT5bavrksQkUEle7FAKatH0OI7T9KbloL66rkxMAk1Ki33XZaayyKfyj2g6/qXN9XhZnIv2SQ5MEZNAd6TFjt0cmga3Z95jMPjO3yeVdZ7P9FKR+1+nVyPe5T/2+zu8BbyRLuhwfR5/m+HK1KvoW8x+1nR4Pp2eT7ef4HOlxKV3L/heq+I5rj163CRGO+n9wEOgp5Wd9K5UHxMbB9jamaQehkyW5nkw+4n5WtVOzxJwuJDJPiFmZ7GDwDXAbvJaPotZjegs5trJmVo5i9ljC7EKZKXzuV7gLHAcGAA6W7hXFfi8cpq/XshkvxEDawZSv+gPZgINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDSTQQAINJNBAAg0k0EACDURzPwEeDfqak7oTSwAAAABJRU5ErkJggg==',
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
		presets[`${sortIndex}_timeline_stop_id${key}`] = {
			type: 'button',
			category: 'Stop',
			name: `Stop timeline`,
			style: {
				text: `\\n$(watchout-json:${key})`,
				size: '14px',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAt0lEQVR4nO3YIQ4DMQwAwbjq/7/s4oLLSoXVDLPCVjbJ7O7h2evyhkDt/TXN/H5vu3P+kA0KAgWBgkBBoCBQECgIFAQKAgWBgkBh/Afd2aAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgc7dB38yCYt6iY9EAAAAAElFTkSuQmCC',
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
})	/**
	 * Preset: Set Cue Group Variant
	 */
	presets[`set_cue_group`] = {
		type: 'button',
		category: 'Cue Sets',
		name: `Set Cue Group Variant`,
		style: {
			text: `Set Cue Group\\nVariant`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'set_group_state_by_name',
						options: {
							cue_group: '',
							variant_name: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Preset: Reset All Cue Groups
	 */
	presets[`reset_cue_groups`] = {
		type: 'button',
		category: 'Cue Sets',
		name: `Reset All Cue Groups`,
		style: {
			text: `Reset All\\nCue Groups`,
			size: '14px',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(204, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'reset_all_cue_groups_by_name',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Snapshot toggle presets for each snapshot
	if (instance.snapshots && instance.snapshots.presets && typeof instance.snapshots.presets === 'object') {
		for (const key in instance.snapshots.presets) {
			if (Object.hasOwnProperty.call(instance.snapshots.presets, key)) {
				const snapshot = instance.snapshots.presets[key]
				if (!snapshot || !snapshot.name) continue

				/**
				 * Preset: Toggle snapshot
				 */
				presets[`snapshot_toggle_control_id${key}`] = {
					type: 'button',
					category: 'Media Presets',
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
}

module.exports = { getPresets }
