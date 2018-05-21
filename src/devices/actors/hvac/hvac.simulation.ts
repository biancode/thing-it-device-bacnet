import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';
import * as BACnet from 'bacnet-logic';

import * as Simulations from '../../../core/simulations';

import * as Interfaces from '../../../core/interfaces';

import * as Helpers from '../../../core/helpers';

import * as Enums from '../../../core/enums';

export class HVACSimulation extends Simulations.BaseSimulation {
    public config: Interfaces.Actor.HVAC.Config;

    public state: Interfaces.Actor.HVAC.State = {
        temperature: 21,
        setpoint: 21,
    };

    private operatingState: boolean = true;

    public setpointFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public temperatureObjectId: BACnet.Types.BACnetObjectId;
    public setpointModificationObjectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates unit params of the BACnet Object from plugin configuration.
     * Steps:
     * - creates `setpointFeedbackObjectId`.
     * - creates `temperatureObjectId`.
     * - creates `setpointModificationObjectId`.
     *
     * @return {void}
     */
    public async initParamsFromConfig (): Promise<void> {
        this.setpointFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.setpointFeedbackObjectId,
            this.config.setpointFeedbackObjectType,
        );

        this.temperatureObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.temperatureObjectId,
            this.config.temperatureObjectType,
        );

        this.setpointModificationObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.setpointModificationObjectId,
            this.config.setpointModificationObjectType,
        );
    }

    /**
     * Starts the simulation logic for specific device.
     *
     * @return {void}
     */
    public async startSimulation (): Promise<void> {
        this.initProperties();
    }

    /**
     * Simulates the `initProperties` method.
     *
     * @async
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        this.subManager.subscribe = this.getAPIFlowByType(
                Enums.Simulation.ConfirmedRequestService.SubscribeCOV)
            .subscribe(() => {
                this.simulateCOVTemperature();
            });
    }

    /**
     * Simulates the COV events for the temperature.
     *
     * @async
     * @return {Promise<void>}
     */
    public async simulateCOVTemperature (): Promise<void> {
        this.subManager.subscribe = Rx.timer(0, 10000)
            .subscribe(() => {
                const tempModif = this.operatingState ? -0.5 : 0.5;

                this.state.temperature += tempModif;

                this.flowManager.next(Enums.Simulation.FlowType.Response, <any>{
                    apdu: {
                        type: BACnet.Enums.ServiceType.UnconfirmedReqPDU,
                        serviceChoice: BACnet.Enums.UnconfirmedServiceChoice.covNotification,
                        service: {
                            objId: this.setpointFeedbackObjectId,
                            listOfValues: [
                                {
                                    id: BACnet.Enums.PropertyId.presentValue,
                                    values: [
                                        new BACnet.Types.BACnetReal(this.state.temperature),
                                    ],
                                }
                            ]
                        },
                    },
                });

                this.operatingState = this.state.temperature > (this.state.setpoint - 1);
            });
    }

    /**
     * Stops the simulation logic for specific device.
     *
     * @return {void}
     */
    public async stopSimulation (): Promise<void> {
    }
}
