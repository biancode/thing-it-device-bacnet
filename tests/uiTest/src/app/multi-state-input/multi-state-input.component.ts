import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'multi-state-input',
  templateUrl: '../../../../../web/multiStateInput.html',
  styles: ['']
})
export class MultiStateInputComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
