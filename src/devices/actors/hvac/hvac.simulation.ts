import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';
import * as BACnet from 'bacnet-logic';

import * as Simulations from '../../../core/simulations';

import * as Interfaces from '../../../core/interfaces';

import * as Enums from '../../../core/enums';

export class HVACSimulation extends Simulations.BaseSimulation {
    public config: Interfaces.Actor.HVAC.Config;

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
    }

    /**
     * Starts the simulation logic for specific device.
     *
     * @return {void}
     */
    public async startSimulation (): Promise<void> {

    /**
     * Stops the simulation logic for specific device.
     *
     * @return {void}
     */
    public async stopSimulation (): Promise<void> {
    }
}
