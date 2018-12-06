import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'multi-state-value',
  templateUrl: '../../../../../web/multiStateValue.html',
  styles: ['']
})
export class MultiStateValueComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
