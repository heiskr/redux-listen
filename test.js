const { expect } = require('chai')
const {
  getListeners,
  testListener,
  reduxListenerMiddleware,
  addListener,
  addListeners,
  removeListeners
} = require('./index')
const sinon = require('sinon')

describe('redux-listener', () => {
  describe('#getListeners', () => {
    it('should be an array', () => {
      expect(getListeners()).an('array')
    })
  })

  describe('#testListener', () => {
    it('should match when identical', () => {
      expect(testListener('a', 'a')).true
    })

    it('should match *', () => {
      expect(testListener('*', 'a')).true
    })

    it('should match a RegExp', () => {
      expect(testListener(/a/g, 'a')).true
    })
  })

  describe('#addListener', () => {
    it('should add a listener', () => {
      const listener = sinon.spy()
      const type = 'TYPE'
      addListener(type, listener)
      expect(getListeners()).length(1)
      expect(getListeners()[0]).deep.equal({ type, listener })
      removeListeners()
    })
  })

  describe('#addListeners', () => {
    it('should add many listeners', () => {
      const listenerA = sinon.spy()
      const listenerB = sinon.spy()
      const typeA = 'TYPE_A'
      const typeB = 'TYPE_B'
      addListeners({
        [typeA]: listenerA,
        [typeB]: listenerB,
      })
      expect(getListeners()).length(2)
      expect(getListeners()[0]).deep.equal({ type: typeA, listener: listenerA })
      expect(getListeners()[1]).deep.equal({ type: typeB, listener: listenerB })
      removeListeners()
    })
  })

  describe('#removeListeners', () => {
    let listenerA, listenerB, typeA, typeB

    beforeEach(() => {
      listenerA = sinon.spy()
      listenerB = sinon.spy()
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

    it('should remove all listeners', () => {
      expect(getListeners()).length(2)
      removeListeners()
      expect(getListeners()).length(0)
    })

    it('should remove listeners by type', () => {
      expect(getListeners()).length(2)
      removeListeners({ type: typeB })
      expect(getListeners()).length(1)
      expect(getListeners()[0]).deep.equal({ type: typeA, listener: listenerA })
    })

    it('should remove listeners by fn', () => {
      expect(getListeners()).length(2)
      removeListeners({ listener: listenerB })
      expect(getListeners()).length(1)
      expect(getListeners()[0]).deep.equal({ type: typeA, listener: listenerA })
    })

    it('should remove listeners by type and fn', () => {
      expect(getListeners()).length(2)
      removeListeners({ type: typeB, listener: listenerB })
      expect(getListeners()).length(1)
      expect(getListeners()[0]).deep.equal({ type: typeA, listener: listenerA })
    })
  })

  describe('#reduxListenerMiddleware', () => {
    it('should fire matching listeners', () => {
      const state = {}
      const store = {
        getState() { return state },
        dispatch: sinon.spy()
      }
      const next = sinon.spy()
      const action = { type: 'TYPE' }
      const listener = sinon.spy()
      addListener('TYPE', listener)
      reduxListenerMiddleware(store)(next)(action)
      expect(next.called).true
      expect(listener.called).true
      removeListeners()
    })
  })
})
