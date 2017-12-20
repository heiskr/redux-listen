let listeners = []

function getListeners() {
  return listeners
}

function testListener(listenerType, actionType) {
  return !!(
    listenerType === actionType ||
    listenerType === '*' ||
    actionType.match(listenerType)
  )
}

function addListener(type, listener) {
  listeners.push({ type, listener })
  return { [type]: listener }
}

function addListeners(obj) {
  Object.keys(obj).map(type => addListener(type, obj[type]))
  return obj
}

function removeListeners({ type, listener } = {}) {
  listeners = listeners
    .filter(_ => !(
      (type ? _.type === type : true) &&
      (listener ? _.listener === listener : true)
    ))
}

const reduxListenerMiddleware = store => next => (action) => {
  const result = next(action)
  const state = store.getState()
  const dispatch = store.dispatch
  try {
    listeners
      .filter(({ type, listener }) => testListener(type, action.type))
      .forEach(({ type, listener }) => listener({ action, state, dispatch }))
  } catch (e) {
    console.error(e)
  }
  return result
}

module.exports = {
  getListeners,
  testListener,
  addListener,
  addListeners,
  removeListeners,
  reduxListenerMiddleware,
}
