"use strict";
var _ = require("lodash");
var Rx = require("rxjs");
var RxOp = require("rxjs/operators");
var redux = require("redux");

function AppStore(reducer, initialState) {
    var _this = this;
    this.store = redux.createStore(reducer, initialState);
    var reduxState = this.getStore()
    this.dataFlow = new Rx.BehaviorSubject(reduxState);
    this.store.subscribe(function () {
        var newState = _this.getStore();
        _this.dataFlow.next(newState);
    });
}
/**
 * Dispatches an action.
 *
 * @param  {IAction} action - storage action
 * @return {IAction}
 */
AppStore.prototype.dispatch = function (action) {
    return this.store.dispatch(action);
};
/**
 * Returns the state by specific selector.
 *
 * @param  {string[]|string} selector - store selector (path)
 * @return {RootState}
 */
AppStore.prototype.getState = function (selector) {
    var selectorPath = this.calculateSelectorPath(selector);
    var reduxStore = this.getStore();
    return _.get(reduxStore, selectorPath);
};
/**
 * Returns the current state of application (redux store).
 *
 * @return {RootState}
 */
AppStore.prototype.getStore = function () {
    return this.store.getState();
};
/**
 * Selects the value from redux store by specific selector.
 *
 * @param  {string[]|string} selector - store selector (path)
 * @return {Observable<T>}
 */
AppStore.prototype.select = function (selector) {
    var selectorPath = this.calculateSelectorPath(selector);
    return this.dataFlow
        .pipe(RxOp.distinctUntilChanged(), RxOp.map(function (state) {
        return _.get(state, selectorPath);
    }), RxOp.distinctUntilChanged());
};
AppStore.prototype.calculateSelectorPath = function (selector) {
    var selectorFixed = selector ? selector : '';
    var selectorArray = _.isArray(selectorFixed)
        ? selectorFixed : [selectorFixed];
    var selectorPath = selectorArray.join('.');
    return selectorPath;
};

module.exports = AppStore;
