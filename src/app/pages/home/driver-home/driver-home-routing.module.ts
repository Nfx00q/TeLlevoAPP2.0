import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DriverPage } from './driver-home.page';

const routes: Routes = [
  {
    path: '',
    component: DriverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverHomePageRoutingModule {}
