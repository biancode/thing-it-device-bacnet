angular.module('testApp', ['ThingItMobile.PluginDirectives'])
    .controller('TestController', function () {
        this.binary = {
            _state: {
                presentValue: false,
                alarmValue: false,
                outOfService: true
            }
        };

        this.analog = {
            _state: {
                presentValue: 21.45,
                alarmValue: true,
                outOfService: false,
                min: 10.0,
                max: 30.0
            },
            configuration: {
                unit: 'W'
            },

            changeValue: function (parameters) {
                console.log('Parameters', parameters);
            }
        };

        this.multi = {
            _state: {
                presentValue: 5,
                presentValueText: "OCCUPIED",
                alarmValue: true,
                outOfService: false,
                stateText: ["NULL","UNOCCUPIED","STANDBY","BYPASS","OCCUPIED"]
            },

            setPresentValue: function (presentValue) {
                console.log('presentValue', presentValue);
                console.log(typeof presentValue);
            }
        };

        this.room = {
            _state: {
                presentValue: false,
                alarmValue: false,
                outOfService: true,
                temperature: 21.5,
                setpoint: 22,
                coolActive: true,
                position: 30,
                rotation: 45,
                lightActive: true,
                dimmerLevel: 75,
            },

            toggleLight: function () {
                this.room._state.lightActive = !this.room._state.lightActive;
            },

            changeDimmer: function (parameters) {
                console.log('New Dimmer Level', parameters);
            }
        };

        this.panel = {
            callActorService: function(controllerObject, controllerFunction, valueToSet) {
                console.log('Hellooooooo!!!!!');
                controllerObject[controllerFunction](valueToSet)
            }
        }

    });