const REDUX_LISTEN_RESOLVE = 'REDUX_LISTEN_RESOLVE'

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

function isRegExp(o) {
  return Object.prototype.toString.call(o) === '[object RegExp]'
}

function testListener(actionType, listenerType, listenerMatch) {
  return !!(
    (listenerType && (listenerType === actionType || listenerType === '*')) ||
    (listenerMatch && actionType.match(listenerMatch))
  )
}

function getListeners() {
  return this.listeners
}

function getPendingCount() {
  return this.pendingCount
}

function isPending() {
  return this.pendingCount > 0
}

function addListener(type, fn) {
  this.listeners.push({ fn, [isRegExp(type) ? 'match' : 'type']: type })
  return fn
}

function addListeners(obj) {
  Object.keys(obj).map(type => this.addListener(type, obj[type]))
  return obj
}

function removeListeners({ type, fn } = {}) {
  this.listeners = this.listeners.filter(
    _ => (type && _.type !== type) || (fn && _.fn !== fn)
  )
  return this.listeners
}

function decrementPendingCount(dispatch) {
  return once(() => {
    if (this.pendingCount < 1) {
      return this.pendingCount
    }
    this.pendingCount -= 1
    if (this.pendingCount === 0) {
      dispatch({ type: REDUX_LISTEN_RESOLVE })
    }
    return this.pendingCount
  })
}

function handleAction(getState, action, dispatch) {
  const matches = this.listeners.filter(({ type, match }) =>
    testListener(action.type, type, match)
  )
  this.pendingCount += matches.filter(({ fn }) => fn.length > 1).length
  return matches.map(({ fn }) =>
    fn(
      { getState, action, dispatch },
      fn.length > 1 && this.decrementPendingCount(dispatch)
    )
  )
}

function middleware(store) {
  return next => action => {
    const result = next(action)
    try {
      this.handleAction(store.getState, action, store.dispatch)
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
    }
    return result
  }
}

function ReduxListen() {
  this.listeners = []
  this.pendingCount = 0
}

ReduxListen.prototype = {
  getListeners,
  getPendingCount,
  isPending,
  addListener,
  addListeners,
  removeListeners,
  decrementPendingCount,
  handleAction,
  middleware,
}

module.exports = ReduxListen
