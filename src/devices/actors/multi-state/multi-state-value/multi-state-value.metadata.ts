import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    MultiStateActorServices,
    MultiStateActorStates,
    MultiStateActorConfigs,
} from '../multi-state.metadata';

export const MultiStateValueActorMetadata: ISlaveMetadata = {
    plugin: 'multi-state-value.actor',
    label: 'BacNet Multi State Value',
    role: 'actor',
    family: 'multiStateValue',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...MultiStateActorServices,
        {
            id: 'setPresentValue',
            label: 'Set Present Value',
        },
    ],
    state: [
        ...MultiStateActorStates,
    ],
    configuration: [
        ...MultiStateActorConfigs,
        {
            label: 'Object Identifier',
            id: 'objectId',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        /**
         * @deprecated
         */
        {
            label: 'Object Type',
            id: 'objectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
    ],
};
