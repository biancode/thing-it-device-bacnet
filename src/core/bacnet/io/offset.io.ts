import * as _ from 'lodash';

import { BACnetError } from '../errors';

export class Offset {
    private curValue: number;
    private isDisabled: boolean = false;

    constructor (defValue) {
        this.curValue = this.isCorrectValue(defValue) ? defValue : 0;
    }


    /**
     * Offset value (Getter)
     *
     * @type {number}
     */
    public set value (offPos: number) {
        this.setVaule(offPos);
    }

    /**
     * Offset value (Setter)
     *
     * @type {number}
     */
    public get value (): number {
        return this.getVaule();
    }

    /**
     * Sets new offset position.
     *
     * @param  {number} offPos - new offset position
     * @return {void}
     */
    public setVaule (offPos: number): void {
        if (this.isDisabled) {
            return;
        }

        this.curValue = this.isCorrectValue(offPos) ? offPos : this.curValue;
    }

    /**
     * Returns current offset position.
     *
     * @return {number} - current offset position
     */
    public getVaule (): number {
        return this.curValue;
    }

    /**
     * Increases the internal counter of the offset position. If "incValue"
     * is an incorrect number, method will use a "1" instead of the "incValue".
     *
     * @param  {number} incValue - offset from old offset position
     * @return {number} - old offset position
     */
    public inc (incValue?: number): number {
        if (this.isDisabled) {
            return this.curValue;
        }

        const inc = this.isCorrectValue(incValue) ? incValue : 1;
        const oldValue: number = this.curValue;
        this.curValue += inc;
        return oldValue;
    }

    /**
     * Checks if value is a correct number.
     *
     * @param  {number} value - number value
     * @return {boolean}
     */
    private isCorrectValue (value: number): boolean {
        return _.isNumber(value) && _.isFinite(value);
    }

    /**
     * Disables the `offset` counter.
     *
     * @return {void}
     */
    public disable (): void {
        this.isDisabled = true;
    }

    /**
     * Enables the `offset` counter.
     *
     * @return {void}
     */
    public enable (): void {
        this.isDisabled = false;
    }
}
