import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminDashPage } from './admin-dash.page';

const routes: Routes = [
  {
    path: '',
    component: AdminDashPage
  },
  {
    path: 'user-info',
    loadChildren: () => import('./user-info/user-info.module').then( m => m.UserInfoPageModule)
  },
  {
    path: 'admin-dash',
    loadChildren: () => import('./admin-dash.module').then( m => m.AdminDashPageModule)
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminDashPageRoutingModule {}
