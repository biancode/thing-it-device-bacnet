import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'uiTest';

  analogValue = {
    _state: {
        presentValue: 22,
        alarmValue: false,
        outOfService: false,
        min: 10.0,
        max: 30.0,
        unit: 'W'
    },
    id: 'analogValue1',

    changeValue: function (parameters) {
        console.log('Parameters', parameters);
        this._state = Object.assign({}, this._state, {
          presentValue: parameters.value
        });
    }
  };

  analogInput = {
    _state: {
        presentValue: 22,
        alarmValue: false,
        outOfService: false,
        min: 10.0,
        max: 30.0,
        unit: 'W'
    },
    id: 'analogInput1'
  };

  binaryInput = {
    _state: {
        presentValue: true,
        alarmValue: false,
        outOfService: false,
    },
    id: 'binaryInput1'
  };

  binaryValue = {
    _state: {
        presentValue: true,
        alarmValue: false,
        outOfService: false,
    },
    id: 'binaryInput1',
    toggle() {
      this._state.presentValue = !this._state.presentValue;
    }
  };

  bacnetDevice = {
    _state: {
        name: 'Test BACnet device',
        description: 'Test device description',
        vendor: 'Test',
        model: 'Test',
        softwareVersion: 'V1.0'
    },
    id: 'bacNetDevice1'
  };

  multiStateInput = {
    _state: {
        presentValue: 1,
        alarmValue: false,
        outOfService: false,
        stateText: ['ON', 'OFF']
    },
    id: 'multiStateInput1'
  };

  multiStateValue = {
    _state: {
        presentValue: 1,
        alarmValue: false,
        outOfService: false,
        stateText: ['ON', 'OFF']
    },
    id: 'multiStateValue1',
    setPresentValue(parameters) {
      console.log('Parameters', parameters);
      this._state = Object.assign({}, this._state, {
        presentValue: parameters.value
      });
    }
  };

  panel = {
    callActorService: function(controllerObject, controllerFunction, valueToSet) {
        console.log('Hellooooooo!!!!!');
        controllerObject[controllerFunction](valueToSet);
    }
  };

  constructor() {}

  ngOnInit() {

  }
}
