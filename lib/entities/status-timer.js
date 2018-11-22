"use strict";
var Rx = require("rxjs");

function StatusTimer(config) {
    this.config = config;
    this.failsCounter = 0;
    this.tickCallback = function () {
        this.tick();
    }.bind(this);
}
/**
 * Returns normal status checks interval if there were no status check fails,
 * or urgent one if one or more checks have failed.
 *
 * @return {void}
 */
StatusTimer.prototype.getInterval = function () {
    // If one check is already failed, make the next one faster
    return !this.failsCounter ? this.config.interval : this.config.urgentCheck;
};

/**
 * Assigns a tick callback and starts timer
 *
 * @param {function} pollingCallback - function that processes status check pollings for device or actor
 * @return {void}
 */
StatusTimer.prototype.start = function (pollingCallback) {
    this.tickCallback = function(interval) {
        pollingCallback(interval);
        this.tick();
    }.bind(this);
    this.tick();
};
/**
 * Creates recursive Rx timer, dependent on number of fails
 * and executes a polling function
 *
 * @param {function} tickCallback - function that should prepare the next tick
 * @return {void}
 */
StatusTimer.prototype.tick = function() {
    
    this.sbStatusTimer = Rx.timer(this.getInterval())
        .subscribe(function() {
            this.tickCallback(this.getInterval());
            if (this.failsCounter >= 2) {
                // If the status check failed two (or more) times, return to normal status check interval from the next check
                this.failsCounter = 0;
            } else {
                // Status check considered as unsuccessfull, 
                // until the iAm response will be received, and `failsCounter` will be reseted to 0 (look bacNetDevice code)
                this.failsCounter++;
            }
        }.bind(this));
};
/**
 * Cancels Rx timer subscription
 *
 * @return {void}
 */
StatusTimer.prototype.cancel = function() {
    if (this.sbStatusTimer && this.sbStatusTimer.unsubscribe) {
        this.sbStatusTimer.unsubscribe();
    }
};
/**
 * Restarts the timer
 *
 * @return {void}
 */
StatusTimer.prototype.restart = function() {
    this.cancel();
    this.tick();
};

module.exports = StatusTimer;
