"use strict";
var Set = require('es6-set');
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;
function SubscriptionManager() {
}
Object.defineProperty(SubscriptionManager.prototype, "subscribe", {
    /**
     * Adds the instance of the `Subscription` to the set with subscriptions
     *
     * @type {Subscription}
     */
    set: function (sub) {
        this.subscription.add(sub);
    },
    enumerable: true,
    configurable: true
});
/**
 * Inits the subscription storage
 *
 * @return {void}
 */
SubscriptionManager.prototype.initManager = function () {
    this.subscription = new Set();
    return Bluebird.resolve();
};
/**
 * Destroys the subscription storage
 *
 * @return {void}
 */
SubscriptionManager.prototype.destroy = function () {
    this.subscription.forEach(function (data) { return data && data.unsubscribe && data.unsubscribe(); });
    this.subscription.clear();
    this.subscription = null;
};

module.exports = SubscriptionManager;
