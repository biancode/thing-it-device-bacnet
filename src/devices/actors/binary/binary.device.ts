import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class BinaryActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryActorDevice';
    public state: Interfaces.Actor.Binary.State;
    public config: Interfaces.Actor.Binary.Config;

    public objectId: BACnet.Types.BACnetObjectId;

    public stop (): void {
        this.apiService.confirmedReq.unsubscribeCOV({
            invokeId: 1,
            objId: this.objectId,
            subProcessId: new BACnet.Types
                .BACnetUnsignedInteger(0),
        });

        super.stop();
    }

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
                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                const statusFlagsProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.statusFlags ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetEnumerated;
                const statusFlags = presentValueProp.values[0] as BACnet.Types.BACnetStatusFlags;

                this.state.presentValue = presentValue.value === 1;
                this.state.outOfService = statusFlags.value.outOfService;
                this.state.alarmValue = statusFlags.value.inAlarm;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.presentValue)}`);
                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty))
            .filter(this.flowManager.isBACnetObject(this.objectId));

        // Gets the `objectName` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.objectName))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetCharacterString>(resp);

                this.state.objectName = bacnetProperty.value;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Name retrieved: ${this.state.objectName}`);
                this.publishStateChange();
            });

        // Gets the `description` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.description))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetCharacterString>(resp);

                this.state.description = bacnetProperty.value;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Description retrieved: ${this.state.description}`);
                this.publishStateChange();
            });

        // Gets the `presentValue` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetEnumerated>(resp);

                this.state.presentValue = bacnetProperty.value === 1;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Present Value retrieved: ${this.state.presentValue}`);
                this.publishStateChange();
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `objectName` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.objectName),
            },
        });

        // Gets the `description` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.description),
            },
        });

        // Gets the `presentValue|statusFlags` property
        this.subManager.subscribe = store.select([ 'bacnet', 'covTimer' ])
            .subscribe((covTimer: Entities.COVTimer) => {
                this.apiService.confirmedReq.subscribeCOV({
                    invokeId: 1,
                    objId: this.objectId,
                    subProcessId: new BACnet.Types
                        .BACnetUnsignedInteger(0),
                    issConfNotif: new BACnet.Types
                        .BACnetBoolean(!!BACnet.Enums.COVNotificationType.Unconfirmed),
                    lifetime: new BACnet.Types
                        .BACnetUnsignedInteger(covTimer.config.lifetime),
                });
            });
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
        this.logger.logDebug('Called update()');

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
}
