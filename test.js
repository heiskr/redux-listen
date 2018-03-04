const {
  REDUX_LISTEN_RESOLVE,
  getListeners,
  getPendingCount,
  isPending,
  isRegExp,
  addListener,
  addListeners,
  removeListeners,
  once,
  decrementPendingCount,
  testListener,
  reduxListenMiddleware,
} = require('./index')

describe('redux-listener', () => {
  describe('#getListeners', () => {
    test('should be an array', () => {
      expect(getListeners()).toEqual([])
    })
  })

  describe('#testListener', () => {
    test('should match when identical', () => {
      expect(testListener('a', 'a')).toBe(true)
    })

    test('should match *', () => {
      expect(testListener('a', '*')).toBe(true)
    })

    test('should match a RegExp', () => {
      expect(testListener('a', null, /a/g)).toBe(true)
    })
  })

  describe('#isRegExp', () => {
    test('should true if RegExp', () => {
      expect(isRegExp(/\d+/g)).toBe(true)
    })

    test('should false if not RegExp', () => {
      expect(isRegExp('\d+')).toBe(false)
    })
  })

  describe('#addListener', () => {
    test('should add a listener', () => {
      const fn = jest.fn()
      const type = 'TYPE'
      addListener(type, fn)
      expect(getListeners()).toHaveLength(1)
      expect(getListeners()[0]).toEqual({ type, fn })
      removeListeners()
    })

    test('should add a RegExp listener', () => {
      const fn = jest.fn()
      const type = /TYPE/
      addListener(type, fn)
      expect(getListeners()).toHaveLength(1)
      expect(getListeners()[0]).toEqual({ match: type, fn })
      removeListeners()
    })
  })

  describe('#addListeners', () => {
    test('should add many listeners', () => {
      const listenerA = jest.fn()
      const listenerB = jest.fn()
      const typeA = 'TYPE_A'
      const typeB = 'TYPE_B'
      addListeners({
        [typeA]: listenerA,
        [typeB]: listenerB,
      })
      expect(getListeners()).toHaveLength(2)
      expect(getListeners()[0]).toEqual({ type: typeA, fn: listenerA })
      expect(getListeners()[1]).toEqual({ type: typeB, fn: listenerB })
      removeListeners()
    })
  })

  describe('#removeListeners', () => {
    let listenerA, listenerB, typeA, typeB

    beforeEach(() => {
      listenerA = jest.fn()
      listenerB = jest.fn()
      typeA = 'TYPE_A'
      typeB = 'TYPE_B'
      addListeners({
        [typeA]: listenerA,
        [typeB]: listenerB,
      })
    })

    afterEach(() => {
      removeListeners()
    })

    test('should remove all listeners', () => {
      expect(getListeners()).toHaveLength(2)
      removeListeners()
      expect(getListeners()).toHaveLength(0)
    })

    test('should remove listeners by type', () => {
      expect(getListeners()).toHaveLength(2)
      removeListeners({ type: typeB })
      expect(getListeners()).toHaveLength(1)
      expect(getListeners()[0]).toEqual({ type: typeA, fn: listenerA })
    })

    test('should remove listeners by fn', () => {
      expect(getListeners()).toHaveLength(2)
      removeListeners({ fn: listenerB })
      expect(getListeners()).toHaveLength(1)
      expect(getListeners()[0]).toEqual({ type: typeA, fn: listenerA })
    })

    test('should remove listeners by type and fn', () => {
      expect(getListeners()).toHaveLength(2)
      removeListeners({ type: typeB, fn: listenerB })
      expect(getListeners()).toHaveLength(1)
      expect(getListeners()[0]).toEqual({ type: typeA, fn: listenerA })
    })
  })

  describe('#getPendingCount', () => {
    test('should get pending count', () => {
      expect(getPendingCount()).toBe(0)
    })
  })

  describe('#isPending', () => {
    test('should be false if nothing', () => {
      expect(isPending()).toBe(false)
    })

    test('should be true if waiting', (done) => {
      function fn({}, _) {
        setTimeout(() => {
          _()
          done()
        })
      }
      addListener('FOO', fn)
      const store = { getState: () => ({}), dispatch: a => a }
      const next = jest.fn()
      const action = { type: 'FOO' }
      reduxListenMiddleware(store)(next)(action)
      expect(isPending()).toBe(true)
      removeListeners()
    })
  })

  describe('#once', () => {
    test('should only call the function once', () => {
      const fn = jest.fn()
      const wrapped = once(fn)
      wrapped()
      wrapped()
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('#decrementPendingCount', () => {
    test('should not decrement pending count', () => {
      expect(getPendingCount()).toEqual(0)
      decrementPendingCount(() => {}, () => {})()
      expect(getPendingCount()).toEqual(0)
    })

    test('should decrement pending count and should call resolve listeners', (done) => {
      function fn({}, _) {
        setTimeout(() => {
          expect(getPendingCount()).toEqual(2)
          _()
          expect(getPendingCount()).toEqual(1)
          _()  // this shouldn't do anything the second time
          expect(resolver).not.toBeCalled()
        }, 10)
      }
      function fn2({}, _) {
        setTimeout(() => {
          expect(getPendingCount()).toEqual(1)
          _()
          expect(getPendingCount()).toEqual(0)
          expect(resolver).toBeCalled()
          removeListeners()
          done()
        }, 20)
      }
      addListener('FOO', fn)
      addListener('FOO', fn2)
      const resolver = jest.fn()
      addListener(REDUX_LISTEN_RESOLVE, () => resolver())
      const store = { getState: () => ({}), dispatch: a => middleware(a) }
      const next = jest.fn()
      const middleware = reduxListenMiddleware(store)(next)
      const action = { type: 'FOO' }
      middleware(action)
      expect(getPendingCount()).toEqual(2)
    })
  })

  describe('#reduxListenMiddleware', () => {
    test('should fire matching listeners', () => {
      const state = {}
      const store = {
        getState() { return state },
        dispatch: jest.fn()
      }
      const next = jest.fn()
      const action = { type: 'TYPE' }
      const listener = jest.fn()
      addListener('TYPE', listener)
      reduxListenMiddleware(store)(next)(action)
      expect(next).toBeCalled()
      expect(listener).toBeCalled()
      removeListeners()
    })

    test('should log error', () => {
      const spy = jest.spyOn(global.console, 'error')
      function fn() {
        throw new Error('FOO')
      }
      const store = { getState() { return {} } }
      const next = jest.fn()
      const action = { type: 'FOO' }
      const listener = jest.fn()
      addListener('FOO', fn)
      reduxListenMiddleware(store)(next)(action)
      expect(spy).toBeCalled()
      removeListeners()
      spy.mockRestore()
    })
  })
})
