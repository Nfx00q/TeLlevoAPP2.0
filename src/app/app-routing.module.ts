import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ConfigPagePageModule } from './pages/home/driver-home/config-page/config-page.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splashscreen',
    pathMatch: 'full'
  },
  {
    path: 'splashscreen',
    loadChildren: () => import('./pages/splashscreen/splashscreen.module').then( m => m.SplashscreenPageModule)
  },
  {
    path: 'driver-home',
    loadChildren: () => import('./pages/home/driver-home/driver-home.module').then( m => m.DriverHomePageModule)
  },
  {
    path: 'admin-dash',
    loadChildren: () => import('./pages/admin-dash/admin-dash.module').then( m => m.AdminDashPageModule)
  },
  {
    path: 'log-in',
    loadChildren: () => import('./pages/log-in/log-in.module').then( m => m.LogInPageModule)
  },
  {
    path: 'sign-in',
    loadChildren: () => import('./pages/sign-in/sign-in.module').then( m => m.SignInPageModule)
  },
  {
    path: 'account',
    loadChildren: () => import('./pages/home/driver-home/config-page/account/account.module').then( m => m.AccountPageModule)
  },
  {
    path: 'config-page',
    loadChildren: () => import('./pages/home/driver-home/config-page/config-page.module').then(m => ConfigPagePageModule)
  },
  {
    path: 'user-home',
    loadChildren: () => import('./pages/home/user-home/user-home.module').then( m => m.UserHomePageModule)
  },
  {
    path: 'sign-car',
    loadChildren: () => import('./pages/sign-in/sign-car/sign-car.module').then( m => m.SignCarPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
