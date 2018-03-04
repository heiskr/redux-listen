let listeners = []
let pendingCount = 0
let resolveListeners = []

function getListeners() {
  return listeners
}

function getPendingCount() {
  return pendingCount
}

function getResolveListeners() {
  return resolveListeners
}

function isPending() {
  return pendingCount > 0
}

function isRegExp(o) {
  return Object.prototype.toString.call(o) === '[object RegExp]'
}

function addListener(type, fn) {
  listeners.push({ fn, [isRegExp(type) ? 'match' : 'type']: type })
  return fn
}

function addListeners(obj) {
  Object.keys(obj).map(type => addListener(type, obj[type]))
  return obj
}

function removeListeners({ type, fn } = {}) {
  return (listeners = listeners.filter(
    _ => (type && _.type !== type) || (fn && _.fn !== fn)
  ))
}

function onResolve(fn) {
  resolveListeners.push(fn)
  return fn
}

function once(fn) {
  let called = false
  let result
  return () => {
    if (!called) {
      result = fn()
    }
    called = true
    return result
  }
}

function callResolveListeners(getState, dispatch) {
  resolveListeners.forEach(fn => fn({ getState, dispatch }))
  return (resolveListeners = [])
}

function decrementPendingCount(getState, dispatch) {
  return once(() => {
    if (pendingCount < 1) {
      return pendingCount
    }
    pendingCount -= 1
    if (pendingCount === 0) {
      callResolveListeners(getState, dispatch)
    }
    return pendingCount
  })
}

function testListener(actionType, listenerType, listenerMatch) {
  return !!(
    (listenerType && (listenerType === actionType || listenerType === '*')) ||
    (listenerMatch && actionType.match(listenerMatch))
  )
}

function handleAction(getState, action, dispatch) {
  const matches = listeners.filter(({ type, match }) =>
    testListener(action.type, type, match)
  )
  pendingCount += matches.filter(({ fn }) => fn.length > 1).length
  return matches.map(({ fn }) =>
    fn(
      { getState, action, dispatch },
      fn.length > 1 && decrementPendingCount(getState, dispatch)
    )
  )
}

const reduxListenMiddleware = store => next => action => {
  const result = next(action)
  try {
    handleAction(store.getState, action, store.dispatch)
  } catch (e) {
    console.error(e)
  }
  return result
}

module.exports = {
  getListeners,
  getPendingCount,
  getResolveListeners,
  isPending,
  isRegExp,
  addListener,
  addListeners,
  removeListeners,
  onResolve,
  once,
  callResolveListeners,
  decrementPendingCount,
  testListener,
  reduxListenMiddleware,
}
