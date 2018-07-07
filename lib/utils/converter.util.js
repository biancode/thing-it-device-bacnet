"use strict";

var _ = require("lodash");

function ConverterUtil() {
}
/**
 * stringToNumber - converts string with number (has "string" type) to
 * number (has "number" type).
 *
 * @static
 * @param  {string} value - string with number
 * @return {number} - number
 */
ConverterUtil.stringToNumber = function (value) {
    return value !== '' && _.isFinite(+value) ? +value : null;
};

module.exports = ConverterUtil;
