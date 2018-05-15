import * as Bluebird from 'bluebird';
import * as assert from 'assert';

import * as TestDriver from 'thing-it-test';

function wait (delay, fn?: () => any) {
    return new Bluebird((resolve, reject) => setTimeout(() => {
        fn && fn();
        resolve();
    }, delay));
}

describe('[thing-it] Disruptive Technologies Device', () => {
    let testDriver;

    const time = {
        test1: 15000,
    }

    before(() => {
        testDriver = TestDriver.createTestDriver({ logLevel: 'debug' });
        testDriver.registerDevicePlugin('bacnet', __dirname + '/../bacnet-device.controller');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/binary-input.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/binary-value.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/binary-light.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/analog-input.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/analog-value.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/jalousie.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/jalousie-simple.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/light.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/multi-state-input.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/multi-state-value.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/room-control.actor');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/thermostat.actor');
        testDriver.start({
            configuration: require('../examples/configuration.js'),
            heartbeat: 10,
        });
    });

    after(async () => {
        await testDriver.stop();
    });

    it('should have completed initialization successfully', async () => {
        await wait(time.test1);
    }).timeout(time.test1 + 2000);
});
