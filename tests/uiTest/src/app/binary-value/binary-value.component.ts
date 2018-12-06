import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'binary-value',
  templateUrl: '../../../../../web/binaryValue.html',
  styles: ['']
})
export class BinaryValueComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
