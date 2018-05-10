import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class BinaryLightActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryLightActorDevice';
    public state: Interfaces.Actor.BinaryLight.State;
    public config: Interfaces.Actor.BinaryLight.Config;

    public objectId: BACnet.Types.BACnetObjectId;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        // Creates and inits params of the BACnet Analog Input
        this.initDeviceParamsFromConfig();

        // Creates instances of the plugin componets
        await this.createPluginComponents();

        // Creates `subscribtion` to the BACnet object properties
        this.subscribeToProperty();

        // Inits the BACnet object properties
        this.initProperties();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        const objectId = +this.config.lightActiveObjectId;

        if (!_.isFinite(objectId)) {
            throw new Errors.ApiError(`BinaryLightActorDevice - initDeviceParamsFromConfig: `
                + `Object ID must have the valid 'number' value`);
        }

        const objectType = BACnet.Enums.ObjectType[this.config.lightActiveObjectType];

        if (!_.isNumber(objectType)) {
            throw new Errors.ApiError(`BinaryLightActorDevice - initDeviceParamsFromConfig: `
                + `Object Type must have the valid BACnet type`);
        }

        this.objectId = new BACnet.Types.BACnetObjectId({
            type: objectType,
            instance: objectId,
        });
    }

    /**
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        // Read Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.objectId))
            .subscribe((resp) => {
                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetEnumerated;

                this.state.lightActive = presentValue.value === 1;

                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.lightActive)}`);
                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty))
            .filter(this.flowManager.isBACnetObject(this.objectId));

        // Gets the `presentValue` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetEnumerated>(resp);

                this.state.lightActive = bacnetProperty.value === 1;

                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `Object Present Value retrieved: ${this.state.lightActive}`);
                this.publishStateChange();
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `presentValue|statusFlags` property
        this.sendSubscribeCOV(this.objectId);
    }

    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setLightActive (targetState: boolean): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - setLightActive: Called setLightActive()');

        this.apiService.confirmedReq.writeProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.presentValue),
                values: [ new BACnet.Types.BACnetEnumerated(+targetState) ]
            },
        });
        return Bluebird.resolve();
    }

    /**
     * TID API Methods
     */

    /**
     * Sends the `readProperty` request to get the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public update (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - update: Called update()');

        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.presentValue),
            },
        });
        return Bluebird.resolve();
    }

    /**
     * Switches the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public toggle (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - toggle: Called toggle()');

        if (this.state.lightActive) {
            this.off();
        } else {
            this.on();
        }

        return Bluebird.resolve();
    }

    /**
     * Sets `1` (true) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public on (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - on: Called on()');

        this.setLightActive(true);
        return Bluebird.resolve();
    }

    /**
     * Sets `0` (false) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public off (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - off: Called off()');

        this.setLightActive(false);
        return Bluebird.resolve();
    }
}
