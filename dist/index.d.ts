import { Reducer, Middleware, AnyAction, Dispatch } from 'redux';
declare const REDUX_TYPE = "@@redux-type";
export declare const PENDING_TYPE = "@@redux-type/PENDING";
export declare type TypeAction<Type, Payload> = {
    type: Type;
    payload: Payload;
};
export interface TypeAsyncAction<Type, Args, Payload, State> extends Promise<Payload> {
    type: '@@redux-type/PENDING';
    payload: Type;
    meta: {
        args: Args;
        creator: (args: Args, state: State) => Promise<Payload>;
        resolve: (payload: Payload) => void;
        reject: (error: any) => void;
        stateful: false;
    };
}
export interface TypeStatefulAction<Type, Args, Payload, State> extends Promise<Payload> {
    type: '@@redux-type/PENDING';
    payload: Type;
    meta: {
        args: Args;
        creator: (args: Args, dispatch: Dispatch<AnyAction>, getState: () => State) => Promise<Payload>;
        resolve: (payload: Payload) => void;
        reject: (error: any) => void;
        stateful: true;
    };
}
export declare type TypeResolveAction<Type, Args, Payload> = {
    type: Type;
    payload: Payload;
    error?: false;
    meta: Args;
};
export declare type TypeRejectAction<Type, Args> = {
    type: Type;
    payload?: Error;
    error: true;
    meta: Args;
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
}
export interface TypeStatefulActionCreator<Type, Args, Payload, State> {
    (args: Args): TypeStatefulAction<Type, Args, Payload, State>;
    type: Type;
    reducer<State>(reducer: (state: State, action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>) => Partial<State>): TypePartialReducer<Type, Payload, State>;
    pending<State>(reducer: (state: State, args: Args) => Partial<State>): TypePartialReducer<typeof PENDING_TYPE, Payload, State>;
    isPending<State>(state: State): boolean;
}
export declare function createTypeAction<Type extends string, Args, Payload = Args>(type: Type, payloadCreator: (args: Args) => Payload): TypeActionCreator<Type, Args, Payload>;
export declare function createTypeAsyncAction<Type extends string, Args, Payload, State>(type: Type, payloadCreator: (args: Args, state: State) => Promise<Payload>): TypeAsyncActionCreator<Type, Args, Payload, State>;
export declare function createTypeStatefulAction<Type extends string, Args, Payload, State>(type: Type, payloadCreator: (args: Args, dispatch: Dispatch<AnyAction>, getState: () => State) => Promise<Payload>): TypeStatefulActionCreator<Type, Args, Payload, State>;
export declare function createTypeReducer<State>(initialState: State | (() => State), ...handlers: TypePartialReducer<string, any, State>[]): TypeReducer<State>;
export declare const typeReduxMiddleware: Middleware;
export interface TypeReduxPendingState {
    [REDUX_TYPE]: {
        pendings: {
            [key: string]: number;
        };
    };
}
export declare const typePendingReducerSet: {
    [REDUX_TYPE]: (state: {
        pendings: {
            [key: string]: number;
        };
    } | undefined, action: AnyAction) => {
        pendings: {
            [key: string]: number;
        };
    };
};
export declare function isPending<Type = string>(type: Type, state: any): boolean;
export declare function createTypeReduxInitialState(): TypeReduxPendingState;
export declare function isError<Type, Args, Payload>(action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>): action is TypeRejectAction<Type, Args>;
export declare function isTypeAsyncAction<Type, Args, Payload, State>(action: any): action is TypeAsyncAction<Type, Args, Payload, State>;
export declare function isNeedCreatePayload<Type, Args, Payload, State>(action: any): action is (TypeAsyncAction<Type, Args, Payload, State> | TypeStatefulAction<Type, Args, Payload, State>);
export declare function isTypeStatefulAction<Type, Args, Payload, State>(action: any): action is TypeStatefulAction<Type, Args, Payload, State>;
export {};
