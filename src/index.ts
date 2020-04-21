'use strict';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Lunascape Corporation. All rights reserved.
 *--------------------------------------------------------------------------------------------*/
import { Reducer, Middleware, AnyAction, Dispatch } from 'redux';

const REDUX_TYPE = '@@redux-type';
export const PENDING_TYPE = '@@redux-type/PENDING';
const COMPLETE_TYPE = '@@redux-type/COMPLETE';
const ELAPSE_COUNT_TYPE = '@@redux-type/ELAPS_COUNT';

export type TypeAction<Type, Payload> = {
  type: Type,
  payload: Payload,
};

export interface TypeAsyncAction<Type, Args, Payload, State> extends Promise<Payload> {
  type: '@@redux-type/PENDING';
  payload: Type;
  meta: {
    args: Args,
    creator: (args: Args, state: State) => Promise<Payload>,
    resolve: (payload: Payload) => void,
    reject: (error: any) => void,
    stateful: false,
    elapseTrackInterval: number;
  };
}

export interface TypeStatefulAction<Type, Args, Payload, State> extends Promise<Payload> {
  type: '@@redux-type/PENDING';
  payload: Type;
  meta: {
    args: Args,
    creator: (args: Args, dispatch: Dispatch<AnyAction>, getState: () => State) => Promise<Payload>,
    resolve: (payload: Payload) => void,
    reject: (error: any) => void,
    stateful: true,
    elapseTrackInterval: number;
  };
}

export type TypeResolveAction<Type, Args, Payload> = {
  type: Type,
  payload: Payload,
  error?: false,
  meta: Args,
};

export type TypeRejectAction<Type, Args> = {
  type: Type,
  payload?: Error,
  error: true,
  meta: Args,
};

export interface TypeReducer<State> extends Reducer<State> {
  (state: State | undefined, action: AnyAction): State;
}

export interface TypePartialReducer<Type, Payload, State> {
  (state: State, action: AnyAction): Partial<State> | undefined;
  type: Type;
}

export interface TypeActionCreator<Type, Args, Payload> {
  (args?: Args): TypeAction<Type, Payload>;
  type: Type;
  reducer<State>(reducer: (state: State, action: TypeAction<Type, Payload>) => Partial<State> | undefined): TypePartialReducer<Type, Payload, State>;
}

export interface TypeAsyncActionCreator<Type, Args, Payload, State> {
  (args?: Args): TypeAsyncAction<Type, Args, Payload, State>;
  type: Type;
  reducer<State>(reducer: (state: State, action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>) => Partial<State>): TypePartialReducer<Type, Payload, State>;
  pending<State>(reducer: (state: State, args: Args) => Partial<State>): TypePartialReducer<typeof PENDING_TYPE, Payload, State>;
  isPending<State>(state: State): boolean;
  elapseTime<State>(state: State): number;
}

export interface TypeStatefulActionCreator<Type, Args, Payload, State> {
  (args: Args): TypeStatefulAction<Type, Args, Payload, State>;
  type: Type;
  reducer<State>(reducer: (state: State, action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>) => Partial<State>): TypePartialReducer<Type, Payload, State>;
  pending<State>(reducer: (state: State, args: Args) => Partial<State>): TypePartialReducer<typeof PENDING_TYPE, Payload, State>;
  isPending<State>(state: State): boolean;
  elapseTime<State>(state: State): number;
}

export function createTypeAction<Type extends string, Args, Payload = Args>(
  type: Type,
  payloadCreator: (args: Args) => Payload,
): TypeActionCreator<Type, Args, Payload> {
  const actionCreator: any = (args: Args): TypeAction<Type, Payload> => ({ type, payload: payloadCreator(args) });
  actionCreator.type = type;
  actionCreator.reducer = (reducer: any) => {
    const typeReducer: any = (state: any, action: any) => reducer(state, action);
    typeReducer.type = type;
    return typeReducer;
  };
  return actionCreator;
}

export function createTypeAsyncAction<Type extends string, Args, Payload, State>(
  type: Type,
  payloadCreator: (args: Args, state: State, elapseTrackInterval: number) => Promise<Payload>,
  elapseTrackInterval = 0,
): TypeAsyncActionCreator<Type, Args, Payload, State> {
  const actionCreator: any = (args: Args): TypeAsyncAction<Type, Args, Payload, State> => {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }) as any;
    promise.type = PENDING_TYPE;
    promise.payload = type;
    promise.meta = {
      args,
      creator: payloadCreator,
      resolve,
      reject,
      stateful: false,
      elapseTrackInterval: elapseTrackInterval,
    };
    return promise;
  };
  actionCreator.type = type;
  actionCreator.reducer = (reducer: any) => {
    const typeReducer: any = (state: any, action: any) => reducer(state, action);
    typeReducer.type = type;
    return typeReducer;
  };
  actionCreator.pending = (reducer: any) => {
    const typeReducer: any = (state: any, action: any) => {
      if (action.payload !== type) {
        return undefined;
      }
      return reducer(state, action.meta);
    };
    typeReducer.type = PENDING_TYPE;
    return typeReducer;
  };
  actionCreator.isPending = (state: any) => isPending(type, state);
  actionCreator.elapseTime = (state: any) => elapseTime(type, state);
  return actionCreator;
}

export function createTypeStatefulAction<Type extends string, Args, Payload, State>(
  type: Type,
  payloadCreator: (args: Args, dispatch: Dispatch<AnyAction>, getState: () => State) => Promise<Payload>,
  elapseTrackInterval = 1000,
): TypeStatefulActionCreator<Type, Args, Payload, State> {
  const actionCreator: any = (args: Args): TypeStatefulAction<Type, Args, Payload, State> => {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }) as any;
    promise.type = PENDING_TYPE;
    promise.payload = type;
    promise.meta = {
      args,
      creator: payloadCreator,
      resolve,
      reject,
      stateful: true,
      elapseTrackInterval: elapseTrackInterval,
    };
    return promise;
  };
  actionCreator.type = type;
  actionCreator.reducer = (reducer: any) => {
    const typeReducer: any = (state: any, action: any) => reducer(state, action);
    typeReducer.type = type;
    return typeReducer;
  };
  actionCreator.pending = (reducer: any) => {
    const typeReducer: any = (state: any, action: any) => {
      if (action.payload !== type) {
        return undefined;
      }
      return reducer(state, action.meta);
    };
    typeReducer.type = PENDING_TYPE;
    return typeReducer;
  };
  actionCreator.isPending = (state: any) => isPending(type, state);
  actionCreator.elapseTime = (state: any) => elapseTime(type, state);
  return actionCreator;
}

export function createTypeReducer<State>(
  initialState: State | (() => State),
  ...handlers: TypePartialReducer<string, any, State>[]
): TypeReducer<State> {
  const partialReducersMap = handlers.reduce(
    (r, reducer) => {
      (r[reducer.type] || (r[reducer.type] = [])).push(reducer);
      return r;
    },
    {} as { [type: string]: ((state: State, action: any) => Partial<State> | undefined)[] });
  const reducerMap = Object.keys(partialReducersMap).reduce((r, type, index) => {
    const partialReducers = partialReducersMap[type];
    r[type] = (state: State, action: AnyAction) => {
      return partialReducers.reduce<State>((s, pr) => ({
        ...s as any,
        ...pr(s, action) as any,
      }), state);
    };
    return r;
  }, {} as { [type: string]: (state: State, action: any) => State });
  return (state = typeof initialState === 'function' ? (initialState as Function)() : initialState, action: any) => {
    const reducer = reducerMap[action.type];
    return reducer ? reducer(state, action) : state;
  };
}

export const typeReduxMiddleware: Middleware = (store) => (next) => (action) => {
  if (!isNeedCreatePayload(action)) {
    return next(action);
  }
  const { type, payload, meta: {
    args,
    resolve,
    reject,
  } } = action;
  next({ type, payload, meta: args });
  try {
    const promise = action.meta.stateful ?
      action.meta.creator(args, store.dispatch, store.getState) :
      action.meta.creator(args, store.getState());

    const interval = action.meta.elapseTrackInterval;
    let elapse = interval;
    const elapseTimer = interval > 0 ? setInterval(() => {
      next({ type: ELAPSE_COUNT_TYPE, payload, meta: elapse });
      elapse += interval;
    }, interval) : undefined;
    promise.then((result: any) => {
      elapseTimer && clearInterval(elapseTimer);
      next({ type: payload, payload: result, meta: args });
      next({ type: COMPLETE_TYPE, payload });
      resolve(result);
    }, (error: any) => {
      elapseTimer && clearInterval(elapseTimer);
      next({ type: payload, payload: error, error: true, meta: args });
      next({ type: COMPLETE_TYPE, payload });
      reject(error);
    }).catch((err) => {
      elapseTimer && clearInterval(elapseTimer);
      next({ type: COMPLETE_TYPE, payload });
      reject(err);
    });
  } catch (error) {
    next({ type: payload, payload: error, error: true, meta: args });
    next({ type: COMPLETE_TYPE, payload });
    reject(error);
  }
  return action;
};

export interface TypeReduxPendingState {
  [REDUX_TYPE]: {
    pendings: { [key: string]: number };
    elapses: { [key: string]: number };
  };
}

export const typePendingReducerSet = {
  [REDUX_TYPE]: (state: { pendings: { [key: string]: number; }; elapses: { [key: string]: number; }; } = { pendings: {}, elapses: {} }, action: AnyAction): typeof state => {
    if (!action) {
      return state;
    }
    if (action.type === PENDING_TYPE) {
      const { pendings } = state;
      const pendingCount = (pendings[action.payload]) || 0;
      return {
        pendings: {
          ...pendings,
          [action.payload]: pendingCount + 1,
        },
        elapses: state.elapses
      };
    } else if (action.type === COMPLETE_TYPE) {
      const { pendings, elapses } = state;
      const pendingCount = Math.max((pendings && pendings[action.payload]) || 1, 1);
      return {
        pendings: {
          ...pendings,
          [action.payload]: pendingCount - 1,
        },
        elapses: {
          ...elapses,
          [action.payload]: 0,
        }
      };
    } else if (action.type === ELAPSE_COUNT_TYPE) {
      const { pendings, elapses } = state;
      return {
        pendings,
        elapses: {
          ...elapses,
          [action.payload]: action.meta,
        }
      }
    }
    return state;
  }
};

export function isPending<Type = string>(type: Type, state: any): boolean {
  return !!(state[REDUX_TYPE].pendings && state[REDUX_TYPE].pendings[type]);
}

export function elapseTime<Type = string>(type: Type, state: any): number {
  return (state[REDUX_TYPE].elapses && state[REDUX_TYPE].elapses[type]);
}

export function createTypeReduxInitialState(): TypeReduxPendingState {
  return {
    [REDUX_TYPE]: {
      pendings: {},
      elapses: {},
    }
  };
}

export function isError<Type, Args, Payload>(action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>): action is TypeRejectAction<Type, Args> {
  return action && !!action.error;
}

export function isTypeAsyncAction<Type, Args, Payload, State>(action: any): action is TypeAsyncAction<Type, Args, Payload, State> {
  return isNeedCreatePayload(action) && !action.meta.stateful;
}

export function isNeedCreatePayload<Type, Args, Payload, State>(action: any): action is (TypeAsyncAction<Type, Args, Payload, State> | TypeStatefulAction<Type, Args, Payload, State>) {
  return action && typeof action.then === 'function' && action.type === PENDING_TYPE && action.meta;
}

export function isTypeStatefulAction<Type, Args, Payload, State>(action: any): action is TypeStatefulAction<Type, Args, Payload, State> {
  return isNeedCreatePayload(action) && action.meta.stateful;
}
