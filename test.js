const ReduxListen = require('./index')

const REDUX_LISTEN_RESOLVE = 'REDUX_LISTEN_RESOLVE'

describe('Redux Listen', () => {
  describe('#getListeners', () => {
    test('should be an array', () => {
      const rl = new ReduxListen()
      expect(rl.listeners).toEqual([])
    })
  })

  describe('#addListener', () => {
    test('should add a listener', () => {
      const rl = new ReduxListen()
      const fn = jest.fn()
      const type = 'TYPE'
      rl.addListener(type, fn)
      expect(rl.listeners).toHaveLength(1)
      expect(rl.listeners[0]).toEqual({ type, fn })
      rl.removeListeners()
    })

    test('should add a RegExp listener', () => {
      const rl = new ReduxListen()
      const fn = jest.fn()
      const type = /TYPE/
      rl.addListener(type, fn)
      expect(rl.listeners).toHaveLength(1)
      expect(rl.listeners[0]).toEqual({ match: type, fn })
      const next = jest.fn()
      rl.middleware({})(next)({type: 'TYPE'})
      expect(next).toBeCalled()
      rl.removeListeners()
    })
  })

  describe('#addListeners', () => {
    test('should add many listeners', () => {
      const rl = new ReduxListen()
      const listenerA = jest.fn()
      const listenerB = jest.fn()
      const typeA = 'TYPE_A'
      const typeB = 'TYPE_B'
      rl.addListeners({
        [typeA]: listenerA,
        [typeB]: listenerB,
      })
      expect(rl.listeners).toHaveLength(2)
      expect(rl.listeners[0]).toEqual({ type: typeA, fn: listenerA })
      expect(rl.listeners[1]).toEqual({ type: typeB, fn: listenerB })
      rl.removeListeners()
    })
  })

  describe('#removeListeners', () => {
    let rl
    let listenerA
    let listenerB
    let typeA
    let typeB

    beforeEach(() => {
      rl = new ReduxListen()
      listenerA = jest.fn()
      listenerB = jest.fn()
      typeA = 'TYPE_A'
      typeB = 'TYPE_B'
      rl.addListeners({
        [typeA]: listenerA,
        [typeB]: listenerB,
      })
    })

    afterEach(() => {
      rl.removeListeners()
    })

    test('should remove all listeners', () => {
      expect(rl.listeners).toHaveLength(2)
      rl.removeListeners()
      expect(rl.listeners).toHaveLength(0)
    })

    test('should remove listeners by type', () => {
      expect(rl.listeners).toHaveLength(2)
      rl.removeListeners({ type: typeB })
      expect(rl.listeners).toHaveLength(1)
      expect(rl.listeners[0]).toEqual({ type: typeA, fn: listenerA })
    })

    test('should remove listeners by fn', () => {
      expect(rl.listeners).toHaveLength(2)
      rl.removeListeners({ fn: listenerB })
      expect(rl.listeners).toHaveLength(1)
      expect(rl.listeners[0]).toEqual({ type: typeA, fn: listenerA })
    })

    test('should remove listeners by type and fn', () => {
      expect(rl.listeners).toHaveLength(2)
      rl.removeListeners({ type: typeB, fn: listenerB })
      expect(rl.listeners).toHaveLength(1)
      expect(rl.listeners[0]).toEqual({ type: typeA, fn: listenerA })
    })
  })

  describe('#getPendingCount', () => {
    test('should get pending count', () => {
      const rl = new ReduxListen()
      expect(rl.pendingCount).toBe(0)
    })
  })

  describe('#isPending', () => {
    test('should be false if nothing', () => {
      const rl = new ReduxListen()
      expect(rl.isPending()).toBe(false)
    })

    test('should be true if waiting', done => {
      const rl = new ReduxListen()
      const store = { getState: () => ({}), dispatch: a => a }
      const next = jest.fn()
      const action = { type: 'FOO' }
      rl.addListener('FOO', (x, _) => {
        setTimeout(() => {
          _()
          expect(rl.isPending()).toBe(false)
          rl.removeListeners()
          done()
        })
      })
      expect(rl.isPending()).toBe(false)
      rl.middleware(store)(next)(action)
      expect(rl.isPending()).toBe(true)
    })
  })

  describe('#decrementPendingCount', () => {
    test('should not decrement pending count', () => {
      const rl = new ReduxListen()
      expect(rl.pendingCount).toEqual(0)
      rl.decrementPendingCount(() => {}, () => {})()
      expect(rl.pendingCount).toEqual(0)
    })

    test('should decrement pending count and should call resolve listeners', done => {
      const rl = new ReduxListen()
      let middleware
      const store = { getState: () => ({}), dispatch: a => middleware(a) }
      const next = jest.fn()
      middleware = rl.middleware(store)(next)
      const resolver = jest.fn()
      rl.addListener('FOO', (x, _) => {
        setTimeout(() => {
          expect(rl.pendingCount).toEqual(2)
          _()
          expect(rl.pendingCount).toEqual(1)
          _() // should have no effect
          expect(resolver).not.toBeCalled()
        }, 10)
      })
      rl.addListener('FOO', (x, _) => {
        setTimeout(() => {
          expect(rl.pendingCount).toEqual(1)
          _()
          expect(rl.pendingCount).toEqual(0)
          expect(resolver).toBeCalled()
          rl.removeListeners()
          done()
        }, 20)
      })
      rl.addListener(REDUX_LISTEN_RESOLVE, () => resolver())
      middleware({ type: 'FOO' })
      expect(rl.pendingCount).toEqual(2)
    })
  })

  describe('#middleware', () => {
    test('should fire matching listeners', () => {
      const rl = new ReduxListen()
      const state = {}
      const store = {
        getState() {
          return state
        },
        dispatch: jest.fn(),
      }
      const next = jest.fn()
      const action = { type: 'TYPE' }
      const listener = jest.fn()
      rl.addListener('TYPE', listener)
      rl.middleware(store)(next)(action)
      expect(next).toBeCalled()
      expect(listener).toBeCalled()
      rl.removeListeners()
    })

    test('should log error', () => {
      const rl = new ReduxListen()
      const spy = jest.spyOn(global.console, 'error')
      function fn() {
        throw new Error('FOO')
      }
      const store = {
        getState() {
          return {}
        },
      }
      const next = jest.fn()
      const action = { type: 'FOO' }
      rl.addListener('FOO', fn)
      rl.middleware(store)(next)(action)
      expect(spy).toBeCalled()
      rl.removeListeners()
      spy.mockRestore()
    })
  })
})
