import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'binary-input',
  templateUrl: '../../../../../web/binaryInput.html',
  styles: ['']
})
export class BinaryInputComponent implements OnInit {

  @Input() component;
  @Input() panel;

  constructor() { }

  ngOnInit() {
  }

}
