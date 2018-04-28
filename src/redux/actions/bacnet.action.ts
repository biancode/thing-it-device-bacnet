import { store } from '../index';
import { BACnetEvent } from '../events/bacnet.event';

export class BACnetAction {

    static setConfig (data) {
        return store.dispatch({
            type: BACnetEvent.setConfig,
            payload: { data : data },
        });
    }

}
