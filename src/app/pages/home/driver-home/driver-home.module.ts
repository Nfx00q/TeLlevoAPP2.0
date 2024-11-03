import { NgModule } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DriverHomePageRoutingModule } from './driver-home-routing.module';
import { DriverPage } from './driver-home.page';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DriverHomePageRoutingModule,
    QRCodeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [DriverPage]
})
export class DriverHomePageModule {}
