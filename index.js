let listeners = []
let pendingCount = 0
let pendingListeners = []

function getListeners() {
  return listeners
}

function testListener(actionType, listenerType, listenerMatch) {
  return !!(
    (listenerType && (
      listenerType === actionType ||
      listenerType === '*')) ||
    (listenerMatch &&
      actionType.match(listenerMatch))
  )
}

function isRegExp(o) {
  return Object.prototype.toString.call(o) === '[object RegExp]'
}

function addListener(type, fn) {
  const typeIsRegExp = isRegExp(type)
  listeners.push({
    type: !typeIsRegExp && type,
    match: typeIsRegExp && type,
    fn,
  })
  return { [type]: fn }
}

function addListeners(obj) {
  Object.keys(obj).map(type => addListener(type, obj[type]))
  return obj
}

function removeListeners({ type, fn } = {}) {
  listeners = listeners
    .filter(_ => !(
      (type ? _.type === type : true) &&
      (fn ? _.fn === fn : true)
    ))
  return getListeners()
}

function getPendingCount() {
  return pendingCount
}

function getPendingListeners() {
  return pendingListeners
}

function isPending() {
  return getPendingCount() > 0
}

function onResolve(fn) {
  pendingListeners.push(fn)
  return fn
}

function decrementPendingCount() {
  if (pendingCount > 0) {
    pendingCount -= 1
    if (pendingCount === 0) {
      pendingListeners.forEach(fn => fn())
      pendingListeners = []
    }
  }
  return getPendingCount()
}

const reduxListenMiddleware = store => next => action => {
  const result = next(action)
  const state = store.getState()
  const dispatch = store.dispatch
  try {
    const matches = listeners.filter(({ type, match }) => testListener(action.type, type, match))
    pendingCount += matches.filter(({ fn }) => fn.length > 1).length
    matches.forEach(({ fn }) => fn({ action, state, dispatch }, decrementPendingCount))
  } catch (e) {
    console.error(e)
  }
  return result
}

module.exports = {
  getListeners,
  testListener,
  isRegExp,
  addListener,
  addListeners,
  removeListeners,
  getPendingCount,
  getPendingListeners,
  isPending,
  onResolve,
  decrementPendingCount,
  reduxListenMiddleware,
}
