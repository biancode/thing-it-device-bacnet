"use strict";

var Errors = require("../errors");

function Flow() {
    this._active = 0;
    this.data = [];
}
Object.defineProperty(Flow.prototype, "active", {
    /**
     * Number of the held data of the flow
     *
     * @type {number}
     */
    get: function () {
        return this._active;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(Flow.prototype, "size", {
    /**
     * Number of data of the flow
     *
     * @type {number}
     */
    get: function () {
        return this.data.length;
    },
    enumerable: true,
    configurable: true
});
/**
 * Adds new data to the flow data storage.
 *
 * @param  {T} data - data of the flow
 * @return {void}
 */
Flow.prototype.add = function (data) {
    this.data.push(data);
};
/**
 * Holds the 1 element of the data of the flow.
 *
 * @return {T}
 */
Flow.prototype.hold = function () {
    this._active += 1;
    return this.data.shift();
};
/**
 * Releases the 1 element of the data of the flow.
 *
 * @return {void}
 */
Flow.prototype.release = function () {
    if (this._active === 0) {
        throw new Errors.APIError("Flow - free: flow is empty");
    }
    this._active -= 1;
};
/**
 * Checks the state of the flow and returns `true` if flow is free.
 *
 * @return {boolean}
 */
Flow.prototype.isFree = function () {
    return !this.active && !this.size;
};

module.exports = Flow;
