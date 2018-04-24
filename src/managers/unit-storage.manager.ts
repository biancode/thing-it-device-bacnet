import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Observable } from 'rxjs';

import { IEDEUnit } from '../core/interfaces';

import { IBACnetObjectProperty } from '../core/bacnet/interfaces';

import { logger } from '../core/utils';

import {
    BACnetObjectType,
    BACnetPropertyId,
    BACnetUnitAbbr,
} from '../core/bacnet/enums';

import { BACnetObjectId } from '../core/bacnet/types';

import { ApiError } from '../core/errors';

import { NativeModule } from '../units/native/native.module';
import { NativeUnit } from '../units/native/native.unit';

import { CustomModule } from '../units/custom/custom.module';
import { CustomUnit } from '../units/custom/custom.unit';

type NativeUnitToken = string;
type CustomUnitToken = string;

export class UnitStorageManager {
    public readonly className: string = 'UnitStorageManager';
    private nativeUnits: Map<NativeUnitToken, NativeUnit>;
    private customUnits: Map<CustomUnitToken, CustomUnit>;
    private device: NativeUnit;
    private customCounter: number = 0;

    constructor () {
        this.nativeUnits = new Map();
        this.customUnits = new Map();
    }

    /**
     * initUnits - creates unit instances and initializes the units storage.
     *
     * @param  {IEDEUnit[]} edeUnits - EDE configuration of units
     * @return {void}
     */
    public initUnits (edeUnits: IEDEUnit[]): void {
        if (!edeUnits.length) {
            throw new ApiError('UnitStorageManager - initUnits: Unit array is empty!');
        }

        _.map(edeUnits, (edeUnit) => {
            const nativeUnit = this.initNativeUnit(edeUnit);
            this.initCustomUnit(nativeUnit, edeUnit);
        });

        this.customUnits.forEach((customUnit) => {
            customUnit.startSimulation();
        });

        const deviceToken = this.getUnitToken(BACnetObjectType.Device, edeUnits[0].deviceInst);
        const device = this.nativeUnits.get(deviceToken);
        this.device = device;
    }

    /**
     * initNativeUnit - creates the instance of native unit by EDE unit
     * configuration, sets the native unit to internal native unit storage.
     *
     * @param  {IEDEUnit} edeUnit - EDE unit configuration
     * @return {NativeUnit} - instance of the native unit
     */
    private initNativeUnit (edeUnit: IEDEUnit): NativeUnit {
        // Get name of the native unit
        let unitType = BACnetObjectType[edeUnit.objType];

        if (!NativeModule.has(unitType)) {
            logger.warn(`${this.className} - initNativeUnit: "${unitType}" native unit is not exist,`,
                `use "${BACnetUnitAbbr.Default}" native unit`);
            unitType = BACnetUnitAbbr.Default;
        }

        if (_.isNil(edeUnit.objInst)) {
            throw new ApiError(`${this.className} - initNativeUnit: Unit ID (Object Instance) is required!`);
        }

        // Get token of the native unit
        const unitToken = this.getUnitToken(edeUnit.objType, edeUnit.objInst);

        logger.info(`${this.className} - initNativeUnit: Use "${unitType} (${unitToken})" native unit`);

        let unit: NativeUnit = null;
        try {
            let UnitClass = NativeModule.get(unitType);
            unit = new UnitClass();
            unit.initUnit(edeUnit);

            this.nativeUnits.set(unitToken, unit);
        } catch (error) {
            logger.error(`${this.className} - initNativeUnit: "${unitType} (${unitToken})" native unit is not created!`);
            throw error;
        }

        return unit;
    }

    /**
     * initCustomUnit - creates the instance of custom unit by EDE unit
     * configuration, binds the native unit to the function of the custom unit
     * and adds custom unit to internal custom unit storage.
     *
     * @param  {NativeUnit} nativeUnit - instance of the native unit
     * @param  {IEDEUnit} edeUnit - EDE unit configuration
     * @return {CustomUnit}
     */
    private initCustomUnit (nativeUnit: NativeUnit, edeUnit: IEDEUnit): CustomUnit {
        // Get type of the custom unit
        let unitType = edeUnit.custUnitType !== ''
            ? `${edeUnit.custUnitType}` : BACnetUnitAbbr.Default;

        if (!CustomModule.has(unitType)) {
            logger.warn(`${this.className} - initCustomUnit: "${unitType}" custom unit is not exist,`,
                `use "${BACnetUnitAbbr.Default}" custom unit`);
            unitType = BACnetUnitAbbr.Default;
        }

        // Get function of the custom unit
        const unitFn = edeUnit.custUnitFn !== ''
            ? `${edeUnit.custUnitFn}` : BACnetUnitAbbr.Default;

        // Get ID of the custom unit with postfix owner abbreviation
        // U - user (manually), A - algorithm (auto)
        const unitId = _.isNumber(edeUnit.custUnitId) && _.isFinite(+edeUnit.custUnitId)
            ? `${edeUnit.custUnitId}:U` : `${this.customCounter++}:A`;

        // Get token of the custom unit
        const unitToken = `${unitType}:${unitId}`;

        logger.info(`${this.className} - initCustomUnit: Use "${unitType} (${unitToken})" custom unit`);

        let unit: CustomUnit = this.customUnits.get(unitToken);
        if (!unit) {
            let UnitClass = CustomModule.get(unitType);
            unit = new UnitClass();
            unit.initUnit();

            this.customUnits.set(unitToken, unit);
        }

        try {
            unit.setUnitFn(unitFn, nativeUnit, edeUnit);
        } catch (error) {
            logger.error(`${this.className} - initCustomUnit: "${unitToken}" custom unit is not created!`);
            throw error;
        }

        return null;
    }

    /**
     * getUnitToken - returns the storage identifier (token) by the BACnet object
     * type and the BACnet object instance.
     *
     * @param  {number} objType - object type
     * @param  {number} objInst - object identifier
     * @return {NativeUnitToken}
     */
    public getUnitToken (objType: number, objInst: number): NativeUnitToken {
        return `${objType}:${objInst}`;
    }

    /**
     * getDevice - returns the current device.
     *
     * @return {NativeUnit}
     */
    public getDevice(): NativeUnit {
        return this.device;
    }

    /**
     * findUnit - returns the unit by type and id.
     *
     * @param  {number} objInst - object instance
     * @param  {number} objType - object type
     * @return {NativeUnit}
     */
    public getUnit (objId: BACnetObjectId): NativeUnit {
        const objIdValue = objId.getValue();
        const unitToken = this.getUnitToken(objIdValue.type, objIdValue.instance);
        return this.nativeUnits.get(unitToken);
    }

    /**
     * setUnitProperty - sets the value of the object property by property ID.
     *
     * @param  {IBACnetTypeObjectId} objId - object identifier
     * @param  {BACnetPropertyId} propId - property ID
     * @param  {} value - property value
     * @return {void}
     */
    public setUnitProperty (objId: BACnetObjectId,
            prop: IBACnetObjectProperty): void {
        const unit = this.getUnit(objId);
        if (!unit) {
            return;
        }
        unit.storage.setProperty(prop, false);
    }

    /**
     * getUnitProperty - return the clone value of the object property by property ID.
     *
     * @param  {IBACnetTypeObjectId} objId - object identifier
     * @param  {BACnetPropertyId} propId - property ID
     * @return {IBACnetObjectProperty}
     */
    public getUnitProperty (objId: BACnetObjectId,
            propId: BACnetPropertyId): IBACnetObjectProperty {
        const unit = this.getUnit(objId);
        if (!unit) {
            return null;
        }
        return unit.storage.getProperty(propId);
    }

    /**
     * subscribeToUnit - subscribes to the changes for all object properties.
     *
     * @param  {IBACnetTypeObjectId} objId - object identifier
     * @return {Observable<IBACnetObjectProperty>}
     */
    public subscribeToUnit (objId: BACnetObjectId): Observable<IBACnetObjectProperty[]> {
        const unit = this.getUnit(objId);
        if (!unit) {
            return null;
        }
        return unit.subscribe();
    }
}
