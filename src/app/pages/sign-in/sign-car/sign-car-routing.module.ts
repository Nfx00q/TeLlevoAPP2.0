import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SignCarPage } from './sign-car.page';

const routes: Routes = [
  {
    path: '',
    component: SignCarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SignCarPageRoutingModule {}
