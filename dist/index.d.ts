import { Reducer, Middleware, AnyAction } from 'redux';
declare const REDUX_TYPE = "@@redux-type";
export declare const PENDING_TYPE = "@@redux-type/PENDING";
export declare type TypeAction<Type, Payload> = {
    type: Type;
    payload: Payload;
};
export declare type TypeAsyncAction<Type, Args, Payload> = {
    type: '@@redux-type/PENDING';
    payload: Type;
    meta: {
        args: Args;
        creator: (args: Args, state: any) => Promise<Payload>;
        resolve: (payload: Payload) => void;
        reject: (error: any) => void;
    };
};
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
export interface TypeAsyncActionCreator<Type, Args, Payload> {
    (args?: Args): TypeAsyncAction<Type, Args, Payload> & Promise<Payload>;
    type: Type;
    reducer<State>(reducer: (state: State, action: TypeResolveAction<Type, Args, Payload> | TypeRejectAction<Type, Args>) => Partial<State>): TypePartialReducer<Type, Payload, State>;
    pending<State>(reducer: (state: State, args: Args) => Partial<State>): TypePartialReducer<typeof PENDING_TYPE, Payload, State>;
    isPending<State>(state: State): boolean;
}
export declare function createTypeAction<Type extends string, Args, Payload = Args>(type: Type, payloadCreator: (args: Args) => Payload): TypeActionCreator<Type, Args, Payload>;
export declare function createTypeAsyncAction<Type extends string, Args, Payload, State>(type: Type, payloadCreator: (args: Args, state: State) => Promise<Payload>): TypeAsyncActionCreator<Type, Args, Payload>;
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
export declare function isTypeAsyncAction<Type, Args, Payload>(action: any): action is TypeAsyncAction<Type, Args, Payload> & Promise<Payload>;
export {};
