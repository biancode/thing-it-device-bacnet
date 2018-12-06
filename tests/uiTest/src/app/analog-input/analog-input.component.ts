import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'analog-input',
  templateUrl: '../../../../../web/analogInput.html',
  styles: ['']
})
export class AnalogInputComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
