import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { HVACActorDevice } from '../hvac.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import * as Enums from '../../../../core/enums';

import { store } from '../../../../redux';

export class ThermostatActorDevice extends HVACActorDevice {
    public readonly className: string = 'ThermostatActorDevice';
    public state: Interfaces.Actor.Thermostat.State;
    public config: Interfaces.Actor.Thermostat.Config;

    public modeObjectId: BACnet.Types.BACnetObjectId;

    public stateText: string[];

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        super.initParamsFromConfig();

        this.modeObjectId = this.getBACnetObjectId(
            this.config.modeObjectId,
            this.config.modeObjectType,
        );
    }

    /**
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        // Handle Flow. Sets the `mode`, `heatActive`, `coolActive`
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.modeObjectId))
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetUnsignedInteger>(resp);

                const modeStateIndex = bacnetProperties.presentValue.value - 1;
                this.state.mode = this.stateText[modeStateIndex];

                switch (this.state.mode) {
                    case Enums.ThermostatMode.Heat:
                        this.state.heatActive = true;
                        this.state.coolActive = false;
                        break;
                    case Enums.ThermostatMode.Cool:
                        this.state.heatActive = false;
                        this.state.coolActive = true;
                        break;
                    default:
                        this.state.heatActive = false;
                        this.state.coolActive = false;
                        break;
                }

                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Mode ${JSON.stringify(this.state.mode)}`);
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Mode COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty));

        // Gets the `stateText` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.modeObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.stateText))
            .subscribe((resp) => {
                const respServiceData: BACnet.Interfaces.ComplexACK.Read.ReadProperty =
                    _.get(resp, 'layer.apdu.service', null);

                const stateText = respServiceData.prop.values as BACnet.Types.BACnetCharacterString[];

                this.stateText = _.map(stateText, (valueStateText) => {
                    return valueStateText.value;
                });

                this.logger.logDebug(`ThermostatActorDevice - subscribeToProperty: `
                    + `Light States: ${JSON.stringify(this.stateText)}`);
                this.publishStateChange();

                // Gets the `presentValue|statusFlags` property
                this.sendSubscribeCOV(this.objectId);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        this.sendReadProperty(this.modeObjectId, BACnet.Enums.PropertyId.stateText);
    }
}
