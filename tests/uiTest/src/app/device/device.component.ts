import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'bacnet-device',
  templateUrl: '../../../../../web/bacnet.html',
  styles: ['']
})
export class DeviceComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
