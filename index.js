const REDUX_LISTEN_RESOLVE = 'REDUX_LISTEN_RESOLVE'

function isRegExp(o) {
  return Object.prototype.toString.call(o) === '[object RegExp]'
}

function testListener(actionType, listenerType, listenerMatch) {
  return !!(
    (listenerType && (listenerType === actionType || listenerType === '*')) ||
    (listenerMatch && actionType.match(listenerMatch))
  )
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
  return () => {
    this.pendingCount -= 1
    if (this.pendingCount <= 0) {
      this.pendingCount = 0
      dispatch({ type: REDUX_LISTEN_RESOLVE })
    }
    return this.pendingCount
  }
}

function middleware(store) {
  return next => action => {
    const result = next(action)
    try {
      const { getState, dispatch } = store
      const matches = this.listeners.filter(({ type, match }) =>
        testListener(action.type, type, match)
      )
      this.pendingCount += matches.filter(({ fn }) => fn.length > 1).length
      matches.map(({ fn }) =>
        fn(
          { getState, action, dispatch },
          fn.length > 1 && this.decrementPendingCount(dispatch)
        )
      )
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
  isPending,
  addListener,
  addListeners,
  removeListeners,
  decrementPendingCount,
  middleware,
}

module.exports = ReduxListen
