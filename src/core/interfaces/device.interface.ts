
export namespace CommonDevice {
    export interface State {
        initialized?: boolean;
    }

    export interface Config {
    }
}


/**
 * Controllers
 */
export namespace Controller {
    export namespace Device {
        export interface State
                extends CommonDevice.State {
        }

        export interface Config
                extends CommonDevice.Config {
        }
    }

    export namespace BACnetDevice {
        export interface State
                extends Device.State {
            name: string;
            description: string;
            vendor: string;
            model: string;
            softwareVersion: string;
        }

        export interface Config
                extends Device.Config {
            ipAddress: string;
            ipMatchRequired: boolean;
            url: string;
            urlLookupRequired: boolean;
            port: number;
            deviceId: number;
            deviceIdMatchRequired: boolean;
            vendorId: number;
            vendorIdMatchRequired: boolean;
            unicastWhoIsConfirmation?: boolean;
            priority: number;
        }
    }
}

/**
 * Sensors
 */



/**
 * s
 */

export namespace Actor {
    export namespace Device {
        export interface State
                extends CommonDevice.State {
        }

        export interface Config
                extends CommonDevice.Config {
        }
    }

    export namespace Analog {
        export interface State
                extends Device.State {
            presentValue: number;
            alarmValue: boolean;
            outOfService: boolean;
            min: number;
            max: number;
            objectName: string;
            description: string;
            unit: string;
        }

        export interface Config
                extends Device.Config {
            objectId: string;
        }
    }

    export namespace AnalogInput {
        export interface State
                extends Analog.State {
        }

        export interface Config
                extends Analog.Config {
            objectType: string;
        }
    }

    export namespace AnalogValue {
        export interface State
                extends Analog.State {
        }

        export interface Config
                extends Analog.Config {
            readonly: boolean;
            writeonly: boolean;
            minValue: number;
            maxValue: number;
        }
    }

    export namespace Binary {
        export interface State
                extends Device.State {
            presentValue: boolean;
            alarmValue: boolean;
            outOfService: boolean;
            objectName: string;
            description: string;
        }

        export interface Config
                extends Device.Config {
            objectId: string;
        }
    }

    export namespace BinaryInput {
        export interface State
                extends Binary.State {
        }

        export interface Config
                extends Binary.Config {
            objectType: string;
        }
    }

    export namespace BinaryValue {
        export interface State
                extends Binary.State {
        }

        export interface Config
                extends Binary.Config {
            readonly: boolean;
            writeonly: boolean;
        }
    }

    export namespace BinaryLight {
        export interface State
                extends Device.State {
            lightActive: boolean;
        }

        export interface Config
                extends Device.Config {
            lightActiveObjectId: number;
            lightActiveObjectType: string;
        }
    }

    export namespace Jalousie {
        export interface State
                extends Device.State {
            position: number;
            rotation: number;
        }

        export interface Config
                extends Device.Config {
            positionFeedbackObjectId: number;
            positionFeedbackObjectType: string;
            positionModificationObjectId: number;
            positionModificationObjectType: string;
            positionStepSize: number;
            rotationFeedbackObjectId: number;
            rotationFeedbackObjectType: string;
            rotationModificationObjectId: number;
            rotationModificationObjectType: string;
            rotationUpValue: number;
            rotationDownValue: number;
            rotationStepSize: number;
            actionObjectId: number;
            actionObjectType: string;
            actionGoValue: number;
            actionStopValue: number;
        }
    }

    export namespace JalousieSimple {
        export interface State
                extends Device.State {
            motionDirection: number;
            stopValue: boolean;
        }

        export interface Config
                extends Device.Config {
            motionDirectionObjectId: number;
            motionDirectionObjectType: string;
            stopValueObjectId: number;
            stopValueObjectType: string;
            stepDuration: number;
        }
    }

    export namespace Light {
        export interface State
                extends Device.State {
            lightActive: boolean;
            dimmerLevel: number;
            lightState: string;
        }

        export interface Config
                extends Device.Config {
            levelFeedbackObjectId: number;
            levelFeedbackObjectType: string;
            levelModificationObjectId: number
            levelModificationObjectType: string;
            lightActiveFeedbackObjectId: number;
            lightActiveFeedbackObjectType: string;
            lightActiveModificationObjectId: number;
            lightActiveModificationObjectType: string;
            lightActiveModificationValueOn: number;
            lightActiveModificationValueOff: number;
        }
    }

    export namespace MultiState {
        export interface State
                extends Device.State {
            presentValue: number;
            presentValueText: string;
            stateText: string[];
            alarmValue: boolean;
            outOfService: boolean;
            objectName: string;
            description: string;
        }

        export interface Config
                extends Device.Config {
            objectId: string;
            objectType: string;
        }
    }

    export namespace MultiStateInput {
        export interface State
                extends MultiState.State {
        }

        export interface Config
                extends MultiState.Config {
            states: number;
        }
    }

    export namespace MultiStateValue {
        export interface State
                extends MultiState.State {
        }

        export interface Config
                extends MultiState.Config {
        }
    }

    export namespace HVAC {
        export interface State
                extends Device.State {
            setpoint: number;
            temperature: number;
        }

        export interface Config
                extends Device.Config {
            setpointFeedbackObjectId: number;
            setpointFeedbackObjectType: string;
            temperatureObjectId: number;
            temperatureObjectType: string;
            setpointModificationObjectId: number;
            setpointModificationObjectType: string;
        }
    }

    export namespace RoomControl {
        export interface State
                extends HVAC.State {
        }

        export interface Config
                extends HVAC.Config {
        }
    }

    export namespace Thermostat {
        export interface State
                extends HVAC.State {
            mode: string;
            heatActive: boolean;
            coolActive: boolean;
        }

        export interface Config
                extends HVAC.Config {
            modeObjectId: number;
            modeObjectType: string;
        }
    }
}
