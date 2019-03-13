'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var _a;
var REDUX_TYPE = '@@redux-type';
exports.PENDING_TYPE = '@@redux-type/PENDING';
var COMPLETE_TYPE = '@@redux-type/COMPLETE';
function createTypeAction(type, payloadCreator) {
    var actionCreator = function (args) { return ({ type: type, payload: payloadCreator(args) }); };
    actionCreator.type = type;
    actionCreator.reducer = function (reducer) {
        var typeReducer = function (state, action) { return reducer(state, action); };
        typeReducer.type = type;
        return typeReducer;
    };
    return actionCreator;
}
exports.createTypeAction = createTypeAction;
function createTypeAsyncAction(type, payloadCreator) {
    var actionCreator = function (args) {
        var resolve, reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        promise.type = exports.PENDING_TYPE;
        promise.payload = type;
        promise.meta = {
            args: args,
            creator: function (args, state) { return payloadCreator(args, state); },
            resolve: resolve,
            reject: reject,
        };
        return promise;
    };
    actionCreator.type = type;
    actionCreator.reducer = function (reducer) {
        var typeReducer = function (state, action) { return reducer(state, action); };
        typeReducer.type = type;
        return typeReducer;
    };
    actionCreator.pending = function (reducer) {
        var typeReducer = function (state, action) {
            if (action.payload !== type) {
                return undefined;
            }
            return reducer(state, action.meta);
        };
        typeReducer.type = exports.PENDING_TYPE;
        return typeReducer;
    };
    actionCreator.isPending = function (state) { return isPending(type, state); };
    return actionCreator;
}
exports.createTypeAsyncAction = createTypeAsyncAction;
function createTypeReducer(initialState) {
    var handlers = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        handlers[_i - 1] = arguments[_i];
    }
    var partialReducersMap = handlers.reduce(function (r, reducer) {
        (r[reducer.type] || (r[reducer.type] = [])).push(reducer);
        return r;
    }, {});
    var reducerMap = Object.keys(partialReducersMap).reduce(function (r, type, index) {
        var partialReducers = partialReducersMap[type];
        r[type] = function (state, action) {
            return partialReducers.reduce(function (s, pr) { return (tslib_1.__assign({}, s, pr(s, action))); }, state);
        };
        return r;
    }, {});
    return function (state, action) {
        if (state === void 0) { state = typeof initialState === 'function' ? initialState() : initialState; }
        var reducer = reducerMap[action.type];
        return reducer ? reducer(state, action) : state;
    };
}
exports.createTypeReducer = createTypeReducer;
exports.typeReduxMiddleware = function (store) { return function (next) { return function (action) {
    if (!isTypeAsyncAction(action)) {
        return next(action);
    }
    var type = action.type, payload = action.payload, _a = action.meta, args = _a.args, creator = _a.creator, resolve = _a.resolve, reject = _a.reject;
    next({ type: type, payload: payload, meta: args });
    try {
        creator(args, store.getState()).then(function (result) {
            next({ type: payload, payload: result, meta: args });
            next({ type: COMPLETE_TYPE, payload: payload });
            resolve(result);
        }, function (error) {
            next({ type: payload, payload: error, error: true, meta: args });
            next({ type: COMPLETE_TYPE, payload: payload });
            reject(error);
        }).catch(function (err) {
            next({ type: COMPLETE_TYPE, payload: payload });
            reject(err);
        });
    }
    catch (error) {
        next({ type: payload, payload: error, error: true, meta: args });
        next({ type: COMPLETE_TYPE, payload: payload });
        reject(error);
    }
    return action;
}; }; };
exports.typePendingReducerSet = (_a = {},
    _a[REDUX_TYPE] = function (state, action) {
        if (state === void 0) { state = { pendings: {} }; }
        var _a, _b;
        if (!action) {
            return state;
        }
        if (action.type === exports.PENDING_TYPE) {
            var pendings = state.pendings;
            var pendingCount = (pendings[action.payload]) || 0;
            return {
                pendings: tslib_1.__assign({}, pendings, (_a = {}, _a[action.payload] = pendingCount + 1, _a))
            };
        }
        else if (action.type === COMPLETE_TYPE) {
            var pendings = state.pendings;
            var pendingCount = Math.max((pendings && pendings[action.payload]) || 1, 1);
            return {
                pendings: tslib_1.__assign({}, pendings, (_b = {}, _b[action.payload] = pendingCount - 1, _b))
            };
        }
        return state;
    },
    _a);
function isPending(type, state) {
    return !!(state[REDUX_TYPE].pendings && state[REDUX_TYPE].pendings[type]);
}
exports.isPending = isPending;
function createTypeReduxInitialState() {
    var _a;
    return _a = {},
        _a[REDUX_TYPE] = {
            pendings: {}
        },
        _a;
}
exports.createTypeReduxInitialState = createTypeReduxInitialState;
function isError(action) {
    return action && !!action.error;
}
exports.isError = isError;
function isTypeAsyncAction(action) {
    return action && typeof action.then === 'function' && action.type === exports.PENDING_TYPE;
}
exports.isTypeAsyncAction = isTypeAsyncAction;
