"use strict";
var moment = require("moment");

function COVTimer() {
}
/**
 * Inits the COVTimer entity.
 *
 * @param  {Interfaces.COVTimer.Config} config - entity configuration
 * @return {void}
 */
COVTimer.prototype.init = function (config) {
    this.config = config;
    this.prev = moment();
    this.next = this.prev.clone().add(config.period, 'ms');
};
/**
 * Returns JS representation of the COVTimer entity
 *
 * @return {Interfaces.COVTimer.Data}
 */
COVTimer.prototype.valueOf = function () {
    return { prev: this.prev, next: this.next };
};

module.exports = COVTimer;
