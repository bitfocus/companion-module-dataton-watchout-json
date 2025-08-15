module.exports = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */

	/**
	 * Upgrade script for version 2.4.0
	 * - Added new actions: send_inputs, send_multiple_inputs, load_show_json, load_show_file, set_multiple_cue_groups
	 * - Changed preset categories: Basic -> Navigation for jump actions, Snapshot -> Media Presets
	 * - Added new preset categories: Inputs, Show Management, Cue Sets
	 */
	function (context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// Log the upgrade
		if (context && context.logger) {
			context.logger.info('Upgrading Watchout JSON module to v2.4.0 - Added input management and show loading features')
		}

		// No action ID changes were made, so no action updates needed
		// The new actions are automatically available after upgrade

		// Preset categories changed but presets are recreated on module start,
		// so no specific preset updates needed

		return result
	},
]
