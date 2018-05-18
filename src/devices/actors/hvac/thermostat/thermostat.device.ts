import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { HVACActorDevice } from '../hvac.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import * as Enums from '../../../../core/enums';

import { store } from '../../../../redux';

import * as Helpers from '../../../../core/helpers';

export class ThermostatActorDevice extends HVACActorDevice {
    public readonly className: string = 'ThermostatActorDevice';
    public state: Interfaces.Actor.Thermostat.State;
    public config: Interfaces.Actor.Thermostat.Config;

    public modeObjectId: BACnet.Types.BACnetObjectId;

    public stateText: string[];

    /**
     * Creates unit params of the BACnet Object from plugin configuration.
     * Steps:
     * - creates and inits `modeObjectId`.
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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.modeObjectId)),
            )
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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            );

        // Gets the `stateText` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.modeObjectId)),
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)),
            )
            .subscribe((resp) => {
                const respServiceData: BACnet.Interfaces.ComplexACK.Read.ReadProperty =
                    _.get(resp, 'layer.apdu.service', null);

                const stateText = respServiceData.prop.values as BACnet.Types.BACnetCharacterString[];

                this.stateText = _.map(stateText, (valueStateText) => {
                    return valueStateText.value;
                });

                this.logger.logDebug(`ThermostatActorDevice - subscribeToProperty: `
                    + `State Text: ${JSON.stringify(this.stateText)}`);
                this.publishStateChange();

                // Gets the `presentValue|statusFlags` property
                this.sendSubscribeCOV(this.modeObjectId);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        await super.initProperties();

        this.sendReadProperty(this.modeObjectId, BACnet.Enums.PropertyId.stateText);
    }
}
