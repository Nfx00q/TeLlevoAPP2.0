import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth-service.service';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Usuario } from 'src/app/interfaces/usuario';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
})

export class SplashscreenPage implements OnInit {

  constructor(
    private router: Router,
    private AuthServiceService: AuthServiceService,
    private firestore: AngularFirestore
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(['log-in']);
    }, 2000);
  }

}
