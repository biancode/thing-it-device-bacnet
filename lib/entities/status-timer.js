"use strict";
var Rx = require("rxjs");

function StatusTimer(config) {
    this.config = config;
    this.failsCounter = 0;
    this.pollingCallback = function () {
    }.bind(this);
}
/**
 * Returns normal status checks interval if there were no status check fails,
 * or urgent one if one or more checks have failed.
 *
 * @return {void}
 */
StatusTimer.prototype.getInterval = function () {
    // If one check is already failed, make 2 next attempts faster, then return to original interval
    if (this.failsCounter === 0 || this.failsCounter >= 3 ) {
        return this.config.interval;
    }
    return this.config.urgentCheck;
};

/**
 * Assigns a polling callback and starts timer
 *
 * @param {function} pollingCallback - function that processes status check pollings for device or actor
 * @return {void}
 */
StatusTimer.prototype.start = function (pollingCallback) {
    this.pollingCallback = pollingCallback;
    this.tick();
};
/**
 *  Executes a polling function and plans next tick, dependent on number of fails
 *
 * @return {void}
 */
StatusTimer.prototype.tick = function() {
    var interval = this.getInterval();
    this.pollingCallback(interval);
    // If the status check failed 3 times, stop counting fails
    if (this.failsCounter < 3) {
        // Status check considered as unsuccessfull, 
        // until the iAm response will be received, and `failsCounter` will be reseted to 0 (look bacNetDevice code)
        this.failsCounter++;
    }
    
    this.sbStatusTimer = Rx.timer(interval)
        .subscribe(function() {
            this.tick();            
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
