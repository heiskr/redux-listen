
redux-listener
--------------

Use the listener pattern with Redux middleware.

```javascript
// To add a listener
addListener(SET_VAR, ({ action, state, dispatch }) => {
  ...
})

// Or add many listeners
addListeners({
  [SET_VAR]({ action, state, dispatch }) {
    ...
  }
})

// Add it into your store
const store = createStore(reducer, applyMiddleware(reduxListenerMiddleware))
```
