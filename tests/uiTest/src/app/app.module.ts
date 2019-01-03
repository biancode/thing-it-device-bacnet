import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MbscModule } from '@mobiscroll/angular';

import { AppComponent } from './app.component';
import { MatSliderModule } from '@angular/material';
import { AnalogValueComponent } from './analog-value/analog-value.component';
import { AnalogInputComponent } from './analog-input/analog-input.component';
import { BinaryValueComponent } from './binary-value/binary-value.component';
import { BinaryInputComponent } from './binary-input/binary-input.component';
import { DeviceComponent } from './device/device.component';
import { MultiStateInputComponent } from './multi-state-input/multi-state-input.component';
import { MultiStateValueComponent } from './multi-state-value/multi-state-value.component';

@NgModule({
  declarations: [
    AppComponent,
    AnalogValueComponent,
    AnalogInputComponent,
    BinaryInputComponent,
    BinaryValueComponent,
    DeviceComponent,
    MultiStateInputComponent,
    MultiStateValueComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MbscModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
