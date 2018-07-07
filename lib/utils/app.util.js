"use strict";

function AppUtil() {
}
/**
 * Convert time with specific units to the milliseconds.
 *
 * @param  {number} timeValue - value of the time
 * @param  {string} timeUnit - units of the time
 * @return {number} - milliseconds
 */
AppUtil.timeToMs = function (timeValue, timeUnit) {
    var time = 0;
    var msFromSeconds = 1000;
    var msFromMinutes = msFromSeconds * 60;
    var msFromHours = msFromMinutes * 60;
    var msFromDays = msFromHours * 24;
    switch (timeUnit) {
        case 'millisecond':
        case 'milliseconds':
        case 'ms':
            time = timeValue;
            break;
        case 'second':
        case 'seconds':
        case 's':
            time = timeValue * msFromSeconds;
            break;
        case 'minute':
        case 'minutes':
        case 'm':
            time = timeValue * msFromMinutes;
            break;
        case 'hour':
        case 'hours':
        case 'h':
            time = timeValue * msFromHours;
            break;
        case 'day':
        case 'days':
        case 'd':
            time = timeValue * msFromDays;
            break;
    }
    return Math.round(time);
};

module.exports = AppUtil;
