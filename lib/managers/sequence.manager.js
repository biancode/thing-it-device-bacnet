"use strict";

var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;
var Map = require('es6-map');
var _ = require("lodash");
var Rx = require("rxjs");
var RxOp = require("rxjs/operators");
var Errors = require("../errors");
var Entities = require("../entities");

function SequenceManager() {
}
/**
 * Inits internal data flow storages, state of the manager.
 *
 * @return {void}
 */
SequenceManager.prototype.initManager = function (config) {
    this.config = config;
    this.flows = new Map();
    this.state = new Rx.BehaviorSubject({
        free: true,
    });
};
/**
 * Adds the new flow handler to the flow queue by the flow ID.
 *
 * @param  {string} flowId - flow ID
 * @param  {Interfaces.SequenceManager.FlowHandler} flowHandler - flow handler
 * @return {void}
 */
SequenceManager.prototype.next = function (flowId, flowHandler) {
    var flow = this.flows.get(flowId);
    if (_.isNil(flow)) {
        flow = new Entities.Flow();
    }
    flow.add(flowHandler);
    this.flows.set(flowId, flow);
    this.updateQueue(flowId);
};
/**
 * Destroy the manager. Steps:
 * - waits until manager does not set the 'free' state;
 * - releases the flow storage;
 *
 * @return {void}
 */
SequenceManager.prototype.destroy = function () {
    var _this = this;
    return Bluebird.resolve(
        this.state.pipe(
                RxOp.filter(function (state) { return !_.isNil(state) && state.free; }),
                RxOp.first(),
            )
            .toPromise()
    ).then(function() {
        _this.flows.clear();
        _this.flows = null;
    })
};
/**
 * Calls the handler of the flow by flow ID.
 *
 * @param  {TFlowID} flowId - flow ID
 * @return {void}
 */
SequenceManager.prototype.updateQueue = function (flowId) {
    var _this = this;
    this.updateState();
    var flow = this.flows.get(flowId);
    if (flow.isFree() || flow.active >= this.config.thread) {
        return;
    }
    var flowHandler = flow.hold();
    var endPromise;
    try {
        endPromise = flowHandler.method.apply(flowHandler.object, flowHandler.params);
    }
    catch (error) {
        throw new Errors.APIError("SequenceManager - updateQueue: " + error);
    }
    Bluebird.resolve(endPromise)
        .delay(this.config.delay).then(function () {
        flow.release();
        _this.updateQueue(flowId);
    });
};
/**
 * Updates the state of the 'Sequence' manager.
 *
 * @return {void}
 */
SequenceManager.prototype.updateState = function () {
    var free = true;
    this.flows.forEach(function (flow) {
        free = free && flow.isFree();
    });
    this.state.next({
        free: free,
    });
};

module.exports = SequenceManager;
