import {
  createTypeAction,
  createTypeReducer,
  createTypeAsyncAction,
  typeReduxMiddleware,
  isPending,
  typePendingReducerSet,
  createTypeReduxInitialState,
  isError,
  isTypeAsyncAction,
} from '../index';
import { createStore, combineReducers, applyMiddleware } from 'redux';

jest.useFakeTimers();

describe('redux-utils', () => {
  describe('createAction', () => {
    it('create action', () => {
      const testAction = createTypeAction('HOGE_ACTION', jest.fn());
      expect(testAction.type).toBe('HOGE_ACTION');
    });

    it('create partial reducer ', () => {
      const testAction = createTypeAction('FUGA_ACTION', jest.fn());
      const testReducer = testAction.reducer(jest.fn());
      expect(testReducer.type).toBe('FUGA_ACTION');
    });

    it('create reducer with initialState object', () => {
      const testReducer = createTypeReducer({ a: 1, b: 'two', c: { three: true } });
      const state = testReducer(undefined, { type: 'NOP' });
      expect(state).toEqual({ a: 1, b: 'two', c: { three: true } });
    });

    it('create reducer with initialState function', () => {
      const initialStateMock = jest.fn(() => ({ a: 1, b: 'two', c: { three: true } }));
      const testReducer = createTypeReducer(initialStateMock);
      const state = testReducer(undefined, { type: 'NOP' });
      expect(state).toEqual({ a: 1, b: 'two', c: { three: true } });
      expect(initialStateMock).toHaveBeenCalledTimes(1);
    });

    it('create reducer with initialState function but not used', () => {
      const initialStateMock: any = jest.fn(() => ({ a: 1, b: 'two', c: { three: true } }));
      const testReducer = createTypeReducer(initialStateMock);
      const state = testReducer({ a: 3, b: 'ni', c: { one: false } }, { type: 'NOP' });
      expect(state).toEqual({ a: 3, b: 'ni', c: { one: false } });
      expect(initialStateMock).toHaveBeenCalledTimes(0);
    });

    it('call reducer function', () => {
      const testAction = createTypeAction('PIYO_ACTION', jest.fn());
      const mock = jest.fn();
      const testPartialReducer = testAction.reducer(mock);
      const testReducer = createTypeReducer({ text: '' }, testPartialReducer);
      const store = createStore(testReducer);
      store.dispatch(testAction({ hoge: 'piyo' }));
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAsyncAction', () => {
    it('create action', () => {
      const testAction = createTypeAsyncAction('HOGE_ACTION', jest.fn());
      expect(testAction.type).toBe('HOGE_ACTION');
    });

    it('create reducer', () => {
      const testAction = createTypeAsyncAction('FUGA_ACTION', jest.fn());
      const testReducer = testAction.reducer(jest.fn());
      expect(testReducer.type).toBe('FUGA_ACTION');
    });

    it('action isPending', async () => {
      const testAction = createTypeAsyncAction('PIYO_ACTION', () =>
        new Promise((resolve) => setTimeout(resolve, 100000)));
      const mock = jest.fn((state) => state);
      const testReducer = createTypeReducer({}, testAction.reducer(mock));
      const reducer = combineReducers({
        ...typePendingReducerSet,
        test: testReducer,
      });
      const store = createStore(reducer, {}, applyMiddleware(typeReduxMiddleware));
      const promise = store.dispatch(testAction());
      expect(testAction.isPending(store.getState())).toBeTruthy();
      jest.runAllTimers();
      await promise;
      expect(testAction.isPending(store.getState())).toBeFalsy();
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('global isPending', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 100000));
      const testAction = createTypeAsyncAction('PIYO_ACTION', () => promise);
      const mock = jest.fn((state) => state);
      const testReducer = createTypeReducer({}, testAction.reducer(mock));
      const reducer = combineReducers({
        ...typePendingReducerSet,
        test: testReducer,
      });
      const store = createStore(reducer, {}, applyMiddleware(typeReduxMiddleware));
      store.dispatch(testAction());
      expect(isPending('PIYO_ACTION', store.getState())).toBeTruthy();
      jest.runAllTimers();
      await promise;
      expect(isPending('PIYO_ACTION', store.getState())).toBeFalsy();
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('dispatch asyncAction with state', async () => {
      const testAddNumberActionCreator = createTypeAsyncAction('TEST_ADD_NUMBER', async (args: number, state: { value: number }) => {
        return state.value + args;
      });
      const action = testAddNumberActionCreator(123);
      const store = createStore((state) => ({ value: 123, ...state }), { value: 123 }, applyMiddleware(typeReduxMiddleware));
      const result = await store.dispatch(action);
      expect(result).toBe(246);
    });
  });

  it('createTypeReduxInitialState', async () => {
    const initialState = createTypeReduxInitialState();
    expect(initialState).toEqual({
      '@@redux-type': {
        pendings: {}
      }
    });
  });

  it('isError true', () => {
    const result = isError<'TEST', {}, 'TEST'>({
      type: 'TEST',
      error: true,
      payload: new Error('TEST'),
      meta: {}
    });
    expect(result).toBeTruthy();
  });

  it('isError false', () => {
    const result = isError<'TEST', {}, 'TEST'>({
      type: 'TEST',
      payload: 'TEST',
      meta: {}
    });
    expect(result).toBeFalsy();
  });

  it('isTypeAsyncAction true by typeAsyncAction', () => {
    const sayAsyncHello = createTypeAsyncAction('HELLO', () => new Promise(resolve => setTimeout(resolve, 100000)));
    const action = sayAsyncHello();
    const result = isTypeAsyncAction(action);
    expect(result).toBeTruthy();
    jest.runAllTimers();
  });

  it('isTypeAsyncAction false by typeAction without async', () => {
    const sayHello = createTypeAction('HELLO', () => { });
    const action = sayHello();
    const result = isTypeAsyncAction(action);
    expect(result).toBeFalsy();
  });

  it('isTypeAsyncAction false by plain action', () => {
    const result = isTypeAsyncAction({
      type: 'PLAIN_ACTION',
      payload: { a: 1 }
    });
    expect(result).toBeFalsy();
  });

  it('middleware', async () => {
    const promise = new Promise<void>((r) => setTimeout(r, 100000));
    const actionCreator = createTypeAsyncAction('TEST_ACTION', () => promise);
    const reducer = createTypeReducer({}, actionCreator.reducer(r => ({
      a: 123
    })));
    const store = createStore(combineReducers({ ...typePendingReducerSet, test: reducer }), applyMiddleware(typeReduxMiddleware));
    store.dispatch(actionCreator());
    expect(store.getState()).toEqual({
      '@@redux-type': {
        pendings: {
          TEST_ACTION: 1
        },
      },
      test: {}
    });
    jest.runAllTimers();
    await promise;
    expect(store.getState()).toEqual({
      '@@redux-type': {
        pendings: {
          TEST_ACTION: 0
        }
      },
      test: {
        a: 123,
      }
    });
  });

  it('support throw in reducer', async () => {
    const testAction = createTypeAsyncAction('PIYO_ACTION', async () => 123);
    const testReducer = testAction.reducer((state, action) => {
      throw new Error('PIYO_REDUCER_ERROR');
    });
    const reducer = combineReducers({
      ...typePendingReducerSet,
      test: createTypeReducer({}, testReducer),
    });
    const store = createStore(reducer, {}, applyMiddleware(typeReduxMiddleware));
    const result = store.dispatch(testAction());
    await expect(result).rejects.toThrow('PIYO_REDUCER_ERROR');
  });

  it('pending reducer', async () => {
    const testAction = createTypeAsyncAction('ASYNC_ACTION', async (args: number) => args);
    const testPendingReducer = jest.fn((state, args: number) => {
      return { num: args };
    });
    const testPartialReducer = testAction.pending(testPendingReducer);
    const reducer = combineReducers({
      ...typePendingReducerSet,
      test: createTypeReducer({}, testPartialReducer),
    });
    const store = createStore(reducer, {}, applyMiddleware(typeReduxMiddleware));
    const result = store.dispatch(testAction(123123));
    await expect(result).resolves.toBe(123123);
    expect(testPendingReducer).toBeCalledWith({}, 123123);
    expect(store.getState()).toMatchObject({ test: { num: 123123 } });
  });

  describe('integration test', () => {
    it('Catch rejection sync', async () => {
      const error = new Error('test');
      const syncPayloadCreator = (args: number, state: { value: number }) => {
        throw error; // payloadCreator throws this.
      };
      const testAddNumberActionCreator = createTypeAsyncAction('TEST_ADD_NUMBER', syncPayloadCreator);
      const nopReducer = jest.fn((state, action) => state);
      const testAddNumberReducer = testAddNumberActionCreator.reducer(nopReducer);
      const reducer = createTypeReducer<{ value: number }>(() => ({ value: 0 }), testAddNumberReducer);
      const store = createStore(reducer, { value: 123 }, applyMiddleware(typeReduxMiddleware));
      const action = testAddNumberActionCreator(123);
      await expect(store.dispatch(action)).rejects.toBe(error);
      expect(nopReducer).toHaveBeenCalledWith({ value: 123 }, {
        type: 'TEST_ADD_NUMBER',
        error: true,
        payload: error,
        meta: 123
      });
    });

    it('Catch throw async', async () => {
      const error = new Error('test');
      const asyncPayloadCreator = async (args: number, state: { value: number }) => {
        throw error; // payloadCreator rejects this.
      };
      const testAddNumberActionCreator = createTypeAsyncAction('TEST_ADD_NUMBER', asyncPayloadCreator);
      const nopReducer = jest.fn((state, action) => state);
      const testAddNumberReducer = testAddNumberActionCreator.reducer(nopReducer);
      const reducer = createTypeReducer<{ value: number }>(() => ({ value: 0 }), testAddNumberReducer);
      const store = createStore(reducer, { value: 123 }, applyMiddleware(typeReduxMiddleware));
      const action = testAddNumberActionCreator(123);
      await expect(store.dispatch(action)).rejects.toBe(error);
      expect(nopReducer).toHaveBeenCalledWith({ value: 123 }, {
        type: 'TEST_ADD_NUMBER',
        error: true,
        payload: error,
        meta: 123
      });
    });
  });
});
