"use strict";
var Rx = require("rxjs");

function StatusTimer(config) {
    this.config = config;
    this.failsCounter = 0;
}
/**
 * Returns normal status checks interval if there were no status check fails,
 * or urgent one if one or more checks have failed.
 *
 * @return {void}
 */
StatusTimer.prototype.getInterval = function () {
    return this.failsCounter ? this.config.interval : this.config.urgentCheck;
};
/**
 * Creates recursive Rx timer, dependent on number of fails
 * and executes a polling function
 *
 * @param {function} pollingCallback - function that processes status check pollings for device or actor
 * @return {void}
 */
StatusTimer.prototype.tick = function(pollingCallback) {
    var interval = this.getInterval();
    this.sbStatusTimer = Rx.timer(interval)
    .subscribe(function() {
        pollingCallback(interval);
        this.tick();
        if (this.failsCounter >= 2) {
            // If the status check failed two (or more) times, return to normal status check interval from the next check
            this.failsCounter = 0;
        } else {
            // Status check considered as unsuccessfull, 
            // until the iAm response will be received, and `failsCounter` will be reseted to 0 (look bacNetDevice code)
            this.failsCounter++;
        }
    }.bind(this));
}


module.exports = StatusTimer;
