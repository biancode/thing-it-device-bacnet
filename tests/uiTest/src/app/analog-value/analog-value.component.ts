import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'analog-value',
  templateUrl: '../../../../../web/analogValue.html',
  styles: ['']
})
export class AnalogValueComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
