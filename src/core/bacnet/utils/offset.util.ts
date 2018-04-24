import * as _ from 'lodash';

import { BACnetError } from '../errors';

export class OffsetUtil {
    private curValue: number;

    constructor (defValue) {
        this.curValue = this.isCorrectValue(defValue) ? defValue : 0;
    }

    /**
     * setVaule - sets new offset position.
     *
     * @param  {number} offPos - new offset position
     * @return {void}
     */
    public setVaule (offPos: number): void {
        this.curValue = this.isCorrectValue(offPos) ? offPos : this.curValue;
    }

    /**
     * getVaule - returns current offset position.
     *
     * @return {number} - current offset position
     */
    public getVaule (): number {
        return this.curValue;
    }

    /**
     * inc - increases the internal counter of the offset position. If "incValue"
     * is an incorrect number, method will use a "1" instead of the "incValue".
     *
     * @param  {number} incValue - offset from old offset position
     * @return {number} - old offset position
     */
    public inc (incValue?: number): number {
        const inc = this.isCorrectValue(incValue) ? incValue : 1;
        const oldValue: number = this.curValue;
        this.curValue = this.curValue + inc;
        return oldValue;
    }

    /**
     * isCorrectValue - checks if value is a correct number.
     *
     * @param  {number} value - number value
     * @return {boolean}
     */
    private isCorrectValue (value: number): boolean {
        return _.isNumber(value) && _.isFinite(value);
    }
}
