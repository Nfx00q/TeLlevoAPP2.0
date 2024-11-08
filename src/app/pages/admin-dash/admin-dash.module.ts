import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminDashPageRoutingModule } from './admin-dash-routing.module';

import { AdminDashPage } from './admin-dash.page';
import { EditModalComponent } from './edit-modal/edit-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminDashPageRoutingModule
  ],
  declarations: [AdminDashPage, EditModalComponent]
})
export class AdminDashPageModule {}
