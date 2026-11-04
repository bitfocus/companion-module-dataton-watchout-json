const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createServer } = require('node:http')
const { once } = require('node:events')
const { readFileSync } = require('node:fs')
const { createRequire } = require('node:module')
const { runInNewContext } = require('node:vm')
const { setTimeout: delay } = require('node:timers/promises')

// Capture the real entrypoint without starting Companion IPC. Only the host port is stubbed.
function instance() {
	let ModuleInstance
	class Host {
		values = {}
		log() {}
		updateStatus(status) {
			this.status = status
		}
		setVariableValues(values) {
			Object.assign(this.values, values)
		}
		setVariableDefinitions(definitions) {
			this.variables = definitions
		}
		setActionDefinitions(actions) {
			this.actions = actions
		}
		setPresetDefinitions() {}
		setFeedbackDefinitions(feedbacks) {
			this.feedbacks = feedbacks
		}
		checkFeedbacks() {}
	}
	const localRequire = createRequire(require.resolve('../main.js'))
	const base = localRequire('@companion-module/base')
	runInNewContext(readFileSync(require.resolve('../main.js'), 'utf8'), {
		require: (id) =>
			id === '@companion-module/base'
				? {
						...base,
						InstanceBase: Host,
						runEntrypoint: (value) => {
							ModuleInstance = value
						},
					}
				: localRequire(id),
		fetch,
		setInterval,
		clearInterval,
	})
	const result = new ModuleInstance()
	result.config = { sortTimelines: false }
	return result
}

async function until(predicate) {
	for (let n = 0; n < 100; n++) {
		if (predicate()) return
		await delay(20)
	}
	assert.fail('Timed out waiting for SSE update')
}

test('HTTP show loading, timeline actions, SSE feedback and lifecycle on the target runtime', async (t) => {
	const requests = []
	const streams = new Set()
	const server = createServer((req, res) => {
		requests.push([req.method, req.url])
		if (req.url === '/sse') {
			res.writeHead(200, { 'Content-Type': 'text/event-stream' })
			res.write('data: {"kind":"playbackState","value":{"timelines":[{"id":"2","playbackStatus":"run"}]}}\n\n')
			streams.add(res)
			res.on('close', () => streams.delete(res))
			return
		}
		res.setHeader('Content-Type', 'application/json')
		res.end(
			JSON.stringify(
				req.url === '/show'
					? {
							showName: 'Test show',
							show: {
								hosts: { director: 'director' },
								timelines: {
									2: { name: 'Zulu', cues: { 5: { name: 'Opening', state: 'play', start: 0 } } },
									10: { name: 'Alpha', cues: {} },
								},
							},
						}
					: req.url === '/cue-group-state/by-name'
						? { Winter: '2' }
						: {},
			),
		)
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	const module = instance()
	t.after(async () => {
		await module.destroy()
		for (const stream of streams) stream.end()
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
	})
	module.baseUrl = `http://127.0.0.1:${server.address().port}`
	await module.getShowInfo()
	module.updateActions()
	module.updateVariables()
	module.updateFeedbacks()
	assert.equal(module.values.show_name, 'Test show')
	assert.equal(module.values.timeline_2_cue_5, 'Opening')
	assert.equal(module.CHOICES_TIMELINES.map((x) => x.id).join(','), '2,10')
	module.config.sortTimelines = true
	assert.equal(
		module
			.getSortedTimelines()
			.map((x) => x.id)
			.join(','),
		'10,2',
	)
	await module.actions.timeline_action.callback({ options: { action: 'play', timeline: '2' } })
	assert.deepEqual(requests.at(-1), ['POST', '/play/2'])
	module.readSSEStream(`${module.baseUrl}/sse`)
	await until(() => module.connected && module.playbackStatus.length === 1)
	assert.equal(module.feedbacks.timeLineState.callback({ options: { timeline: '2', playbackStatus: 'run' } }), true)
	assert.equal(module.feedbacks.cueSetActive.callback({ options: { cueSet: 'Winter', variant_name: '2' } }), true)
	await module.actions.timeline_toggle.callback({ options: { timeline: '2' } })
	assert.deepEqual(requests.at(-1), ['POST', '/pause/2'])
	module.onParse({
		type: 'event',
		data: '{"kind":"timelineCountdowns","value":[{"timelineId":"2","cueId":"5","delta":-16475}]}',
	})
	assert.equal(module.values.timeline_2_cue_5, '-0:16')
	module.onParse({ type: 'event', data: 'invalid json' })
	await module.startPollingShowInfo()
	assert.ok(module.pollingShowInfo)
	await module.configUpdated({ host: '' })
	assert.equal(module.es, null)
	assert.equal(module.pollingShowInfo, null)
	assert.equal(module.connected, false)
})

test('failed show responses reject without reporting API reachability', async () => {
	const module = instance()
	module.baseUrl = 'http://127.0.0.1:0'
	await assert.rejects(module.getShowInfo())
	assert.equal(module.apiReachable, false)
	await module.destroy()
})
