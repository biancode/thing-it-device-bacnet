import * as _ from 'lodash';

export class ConverterUtil {

    /**
     * stringToNumber - converts string with number (has "string" type) to
     * number (has "number" type).
     *
     * @static
     * @param  {string} value - string with number
     * @return {number} - number
     */
    static stringToNumber (value: string): number {
        return value !== '' && _.isFinite(+value) ? +value : null;
    }
}
