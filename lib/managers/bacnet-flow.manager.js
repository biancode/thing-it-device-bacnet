"use strict";
var Rx = require("rxjs");
var BACnet = require("tid-bacnet-logic");
var Errors = require("../errors");
var redux = require("../redux");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;

function BACnetFlowManager(logger) {
    this.logger = logger;
}
/**
 * Destroys the instance.
 * - removes config (sets `null`)
 * - removes respFlow (sets `null`)
 * - destroys errorFlow (calls `unsubscribe` and sets `null`)
 *
 * @return {Promise<any>}
 */
BACnetFlowManager.prototype.destroy = function () {
    this.config = null;
    this.server = null;

    try {
        this.respFlow.unsubscribe();
    } catch (error) {
        throw new Errors.APIError('BACnetFlowManager - destroy: Response Flow - ' + error);
    }
    finally {
        this.respFlow = null;
    }

    try {
        this.errorFlow.unsubscribe();
    } catch (error) {
        throw new Errors.APIError('BACnetFlowManager - destroy: Error Flow - ' + error);
    }
    finally {
        this.errorFlow = null;
    }
    return Bluebird.resolve();
};
/**
 * initManager - sets the manager configuration, inits the "error" flow and
 * gets the "response" flow from BACnet server.
 *
 * @param {Interfaces.FlowManager.Config} config - manager configuration
 * @return {void}
 */
BACnetFlowManager.prototype.initManager = function (config) {
    var _this = this;
    this.config = config;
    this.respFlow = new Rx.Subject();
    this.errorFlow = new Rx.Subject();
    this.server = redux.store.getState(['bacnet', 'bacnetServer']);
    this.server.respFlow
        .subscribe(function (resp) {
        var layer;
        _this.logger.logDebug("BACnetFlowManager - getResponseFlow: "
            + ("Response Message: " + resp.message.toString('hex')));
        try {
            layer = BACnet.Helpers.Layer.bufferToLayer(resp.message);
            _this.respFlow.next({ layer: layer, socket: resp.socket });
            // this.logger.logDebug(`BACnetFlowManager - getResponseFlow: `
            //     + `Response Layer: ${JSON.stringify(layer)}`);
        }
        catch (error) {
            _this.errorFlow.next(error);
            _this.logger.logError("BACnetFlowManager - getResponseFlow: "
                + ("Response Error: " + error));
        }
    });
};
/**
 * getErrorFlow - returns "observable" for "error" flow.
 *
 * @return {Observable<Error>}
 */
BACnetFlowManager.prototype.getErrorFlow = function () {
    return this.errorFlow;
};
/**
 * getResponseFlow - returns "observable" for "response" flow.
 *
 * @return {Observable<Interfaces.FlowManager.Response>}
 */
BACnetFlowManager.prototype.getResponseFlow = function () {
    return this.respFlow;
};

module.exports = BACnetFlowManager;
