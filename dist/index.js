'use strict';
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var REDUX_TYPE = '@@redux-type';
exports.PENDING_TYPE = '@@redux-type/PENDING';
var COMPLETE_TYPE = '@@redux-type/COMPLETE';
var ELAPSE_COUNT_TYPE = '@@redux-type/ELAPS_COUNT';
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
function createTypeAsyncAction(type, payloadCreator, elapseTrackInterval) {
    if (elapseTrackInterval === void 0) { elapseTrackInterval = 0; }
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
            creator: payloadCreator,
            resolve: resolve,
            reject: reject,
            stateful: false,
            elapseTrackInterval: elapseTrackInterval,
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
    actionCreator.elapseTime = function (state) { return elapseTime(type, state); };
    return actionCreator;
}
exports.createTypeAsyncAction = createTypeAsyncAction;
function createTypeStatefulAction(type, payloadCreator, elapseTrackInterval) {
    if (elapseTrackInterval === void 0) { elapseTrackInterval = 1000; }
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
            creator: payloadCreator,
            resolve: resolve,
            reject: reject,
            stateful: true,
            elapseTrackInterval: elapseTrackInterval,
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
    actionCreator.elapseTime = function (state) { return elapseTime(type, state); };
    return actionCreator;
}
exports.createTypeStatefulAction = createTypeStatefulAction;
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
    if (!isNeedCreatePayload(action)) {
        return next(action);
    }
    var type = action.type, payload = action.payload, _a = action.meta, args = _a.args, resolve = _a.resolve, reject = _a.reject;
    next({ type: type, payload: payload, meta: args });
    try {
        var promise = action.meta.stateful ?
            action.meta.creator(args, store.dispatch, store.getState) :
            action.meta.creator(args, store.getState());
        var interval_1 = action.meta.elapseTrackInterval;
        var elapse_1 = interval_1;
        var elapseTimer_1 = interval_1 > 0 ? setInterval(function () {
            next({ type: ELAPSE_COUNT_TYPE, payload: payload, meta: elapse_1 });
            elapse_1 += interval_1;
        }, interval_1) : undefined;
        promise.then(function (result) {
            elapseTimer_1 && clearInterval(elapseTimer_1);
            next({ type: payload, payload: result, meta: args });
            next({ type: COMPLETE_TYPE, payload: payload });
            resolve(result);
        }, function (error) {
            elapseTimer_1 && clearInterval(elapseTimer_1);
            next({ type: payload, payload: error, error: true, meta: args });
            next({ type: COMPLETE_TYPE, payload: payload });
            reject(error);
        }).catch(function (err) {
            elapseTimer_1 && clearInterval(elapseTimer_1);
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
        var _a, _b, _c, _d;
        if (state === void 0) { state = { pendings: {}, elapses: {} }; }
        if (!action) {
            return state;
        }
        if (action.type === exports.PENDING_TYPE) {
            var pendings = state.pendings;
            var pendingCount = (pendings[action.payload]) || 0;
            return {
                pendings: tslib_1.__assign({}, pendings, (_a = {}, _a[action.payload] = pendingCount + 1, _a)),
                elapses: state.elapses
            };
        }
        else if (action.type === COMPLETE_TYPE) {
            var pendings = state.pendings, elapses = state.elapses;
            var pendingCount = Math.max((pendings && pendings[action.payload]) || 1, 1);
            return {
                pendings: tslib_1.__assign({}, pendings, (_b = {}, _b[action.payload] = pendingCount - 1, _b)),
                elapses: tslib_1.__assign({}, elapses, (_c = {}, _c[action.payload] = 0, _c))
            };
        }
        else if (action.type === ELAPSE_COUNT_TYPE) {
            var pendings = state.pendings, elapses = state.elapses;
            return {
                pendings: pendings,
                elapses: tslib_1.__assign({}, elapses, (_d = {}, _d[action.payload] = action.meta, _d))
            };
        }
        return state;
    },
    _a);
function isPending(type, state) {
    return !!(state[REDUX_TYPE].pendings && state[REDUX_TYPE].pendings[type]);
}
exports.isPending = isPending;
function elapseTime(type, state) {
    return (state[REDUX_TYPE].elapses && state[REDUX_TYPE].elapses[type]);
}
exports.elapseTime = elapseTime;
function createTypeReduxInitialState() {
    var _a;
    return _a = {},
        _a[REDUX_TYPE] = {
            pendings: {},
            elapses: {},
        },
        _a;
}
exports.createTypeReduxInitialState = createTypeReduxInitialState;
function isError(action) {
    return action && !!action.error;
}
exports.isError = isError;
function isTypeAsyncAction(action) {
    return isNeedCreatePayload(action) && !action.meta.stateful;
}
exports.isTypeAsyncAction = isTypeAsyncAction;
function isNeedCreatePayload(action) {
    return action && typeof action.then === 'function' && action.type === exports.PENDING_TYPE && action.meta;
}
exports.isNeedCreatePayload = isNeedCreatePayload;
function isTypeStatefulAction(action) {
    return isNeedCreatePayload(action) && action.meta.stateful;
}
exports.isTypeStatefulAction = isTypeStatefulAction;
