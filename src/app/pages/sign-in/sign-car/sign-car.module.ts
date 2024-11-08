import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignCarPageRoutingModule } from './sign-car-routing.module';

import { SignCarPage } from './sign-car.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignCarPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [SignCarPage]
})
export class SignCarPageModule {}
