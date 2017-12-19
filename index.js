export const listeners = []

export function testListener(listenerType, actionType) {
  return !!(
    listenerType === actionType ||
    listenerType === '*' ||
    actionType.match(listenerType)
  )
}

export const reduxListenerMiddleware = store => next => (action) => {
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

export function addListener(type, listener) {
  listeners.push({ type, listener })
  return function removeListener() {
    const index = listeners.indexOf(listener)
    if (index > -1) { listeners.splice(index, 1) }
  }
}

export function addListeners(obj) {
  const removes = Object.keys(obj).map(type => addListener(type, obj[type]))
  return function removeListeners() {
    removes.forEach(rm => rm())
  }
}
