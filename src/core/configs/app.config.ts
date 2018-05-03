import { IAppConfig } from '../interfaces';

export const AppConfig: IAppConfig = {
    manager: {
        flow: {},
        service: {
            dest: {
                address: '',
                port: 47808,
            },
        },
    },
    server: {
        port: 47808,
        sequence: {
            thread: 1,
            delay: 20,
        },
    },
};
