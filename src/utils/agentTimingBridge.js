// Timing bridge for agent evaluation. Do not modify this file during test integration.
const TEAM_SECRET_KEY = 'TEAM_SECRET_PLACEHOLDER'
const TIMING_REPORT_URL = ''

const BRIDGE_STATE_KEY = '__AGENT_TIMING_BRIDGE_STATE__'
const START_METHOD_NAME = 'startAgentTiming'

function getGlobalScope() {
  if (typeof window !== 'undefined') return window
  if (typeof globalThis !== 'undefined') return globalThis
  return {}
}

function getBridgeState() {
  const scope = getGlobalScope()
  if (!scope[BRIDGE_STATE_KEY]) {
    scope[BRIDGE_STATE_KEY] = {
      currentSession: null
    }
  }
  return scope[BRIDGE_STATE_KEY]
}

function noop() {}

function safeClone(value) {
  if (value === undefined) return null

  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return {
      __nonSerializable: true,
      value: String(value)
    }
  }
}

function safeAsyncFetch(url, payload) {
  if (!url || typeof fetch !== 'function') return

  Promise.resolve()
    .then(() => fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Team-Key': TEAM_SECRET_KEY
      },
      body: JSON.stringify(payload),
      keepalive: true
    }))
    .catch(noop)
}

function toLocalDateTimeString(value) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const sec = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}.${ms}`
}

function buildPublicSession(session) {
  if (!session) return null

  return Object.freeze({
    startedAt: session.startedAt,
    attachmentName: session.attachmentName,
    prompt: session.prompt
  })
}

function getRequiredPrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('startAgentTiming requires a non-empty prompt.')
  }
  return prompt.trim()
}

function buildSession(options) {
  const attachmentName = typeof options.attachmentName === 'string'
    ? options.attachmentName.trim()
    : ''
  const sessionId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    sessionId,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    attachmentName,
    prompt: getRequiredPrompt(options.prompt),
    parseResult: null,
    submitPayload: null,
    submitTriggeredAt: '',
    submittedAt: ''
  }
}

function reportTimingEvent(session, formPayload) {
  safeAsyncFetch(TIMING_REPORT_URL, {
    teamKey: TEAM_SECRET_KEY,
    startedAt: toLocalDateTimeString(session ? session.startedAt : null),
    finishedAt: toLocalDateTimeString(session ? session.finishedAt : null),
    submittedAt: toLocalDateTimeString(session ? session.submittedAt : null),
    attachmentName: session ? session.attachmentName : '',
    prompt: session ? session.prompt : '',
    parseResult: session ? safeClone(session.parseResult) : null,
    formPayload: safeClone(formPayload)
  })
}

function finalizeSession(session) {
  if (!session || session.finishedAt) return false

  session.finishedAt = new Date().toISOString()

  return true
}

function finishAgentTimingInternally(parseResult) {
  const state = getBridgeState()
  const currentSession = state.currentSession

  if (!currentSession) return null

  finalizeSession(currentSession)
  currentSession.parseResult = safeClone(parseResult)

  return currentSession
}

function startAgentTiming(options = {}) {
  const state = getBridgeState()
  const nextSession = buildSession(options)
  state.currentSession = nextSession
  return buildPublicSession(nextSession)
}

function defineLockedMethod(name, method) {
  const scope = getGlobalScope()
  if (Object.prototype.hasOwnProperty.call(scope, name)) return

  Object.defineProperty(scope, name, {
    value: method,
    writable: false,
    configurable: false,
    enumerable: false
  })
}

export function getCurrentAgentTimingSession() {
  const state = getBridgeState()
  return state.currentSession
}

export function buildTrackedSubmissionPayload(formData) {
  const session = finishAgentTimingInternally(formData)
  const payload = {
    ...formData,
    agentParseResult: session ? safeClone(session.parseResult) : safeClone(formData),
    agentTiming: session ? {
      attachmentName: session.attachmentName,
      prompt: session.prompt,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt
    } : null
  }

  return payload
}

export function notifyTrackedFormSubmitted(formPayload) {
  const session = getCurrentAgentTimingSession()
  if (!session) return

  session.submittedAt = new Date().toISOString()
  session.submitPayload = safeClone(formPayload)

  reportTimingEvent(session, formPayload)
}

defineLockedMethod(START_METHOD_NAME, startAgentTiming)
