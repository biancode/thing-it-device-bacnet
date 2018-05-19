import * as Simulations from '../../../core/simulations';

export class HVACSimulation extends Simulations.BaseSimulation {
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
    }
}
