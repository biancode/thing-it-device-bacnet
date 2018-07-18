const Bluebird = require('bluebird');
const assert = require('assert');
const path = require('path');

const TestDriver = require('thing-it-test');

function wait (delay, fn) {
    return new Bluebird(function (resolve, reject) {
        setTimeout(function () {
            fn && fn();
            resolve();
        }, delay)
    });
}

describe('[thing-it] BacNet Device - code test', function() {
    let testDriver;

    const time = {
        test1: 15000,
    }

    before(function() {
        testDriver = TestDriver.createTestDriver({ logLevel: 'debug' });
        testDriver.registerDevicePlugin('bacnet', path.resolve(__dirname, '../bacNetDevice'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/binaryInput'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/binaryValue'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/binaryLight'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/analogInput'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/analogValue'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/jalousie'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/jalousieSimple'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/light'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/multiStateInput'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/multiStateValue'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/roomControl'));
        testDriver.registerUnitPlugin(path.resolve(__dirname, '../default-units/thermostat'));
        testDriver.start({
            configuration: require('../examples/configuration.js'),
            heartbeat: 10,
        });
    });

    after(async function() {
        await testDriver.stop();
    });

    it('should have completed initialization successfully', async function() {
        await wait(time.test1);
    }).timeout(time.test1 + 2000);
});
