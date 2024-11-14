import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth-service.service';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Usuario } from 'src/app/interfaces/usuario';

import { NativeBiometric } from 'capacitor-native-biometric';

import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
})

export class SplashscreenPage implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthServiceService,
    private firestore: AngularFirestore
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.checkLogin();
    }, 2000);
  }

  async checkLogin() {
    this.authService.isLogged().subscribe(async (user) => {
      if (user) {
        try {
          // Verificación de autenticación biométrica
          await this.checkHuellaDigital();
  
          // Obtener datos del usuario desde Firestore
          const usuarioDoc = await firstValueFrom(this.firestore.collection('usuarios').doc(user.uid).get());
          const userData = usuarioDoc?.data() as Usuario | undefined;
  
          if (userData) {
            if (userData.tipo === 'admin') {
              this.router.navigate(['/admin-dash']);
            } else if (userData.tipo === 'usuario') {
              this.router.navigate(['/user-home']);
            } else if (userData.tipo === 'conductor') {
              // Actualizar el estado activo en Firestore
              await this.firestore.collection('usuarios').doc(user.uid).update({ activo: true });
              this.router.navigate(['/driver-home']);
            }
          }
        } catch (error) {
          console.error('Error en la verificación de inicio de sesión:', error);
          this.router.navigate(['log-in']);
        }
      } else {
        this.router.navigate(['log-in']);
      }
    });
  }  

  async checkHuellaDigital() {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Por favor, autentícate para continuar',
        title: 'Autentición Biométrica',
        subtitle: 'Usa tu huella digítal o Face ID',
        description: 'Coloca tu huella en el sensor para ingresar.'
      });
    } catch (error) {
      throw error; // Forzamos el error para capturarlo
    }
  }
}
