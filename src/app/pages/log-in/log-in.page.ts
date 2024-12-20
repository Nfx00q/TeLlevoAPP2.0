import { DriverPage } from './../home/driver-home/driver-home.page';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, MenuController } from '@ionic/angular';
import { Usuario } from 'src/app/interfaces/usuario';
import { AuthServiceService } from 'src/app/services/auth-service.service';

import Swal from 'sweetalert2/dist/sweetalert2.all.js';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.page.html',
  styleUrls: ['./log-in.page.scss'],
})
export class LogInPage implements OnInit {

  /* ----- DEFINIR LOGIN ----- */
  loginForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder, 
    private loadingController: LoadingController,
    private menuController: MenuController,
    private firestore: AngularFirestore,
    private authService: AuthServiceService
  ) { 
    this.loginForm = this.formBuilder.group({
      email : ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.resetForm = this.formBuilder.group({
      email: ['']
    });
  }

  ngOnInit() {
    this.menuController.enable(false);
  }
  
  /* ----- LOGIN ----- */

  async logIn() {
    const loading = await this.loadingController.create({
      message: 'Cargando.....',
      duration: 2000,
    });

    try {
        await loading.present();

        const email = this.loginForm.get('email')?.value;
        const pass = this.loginForm.get('pass')?.value;

        // Intentar iniciar sesión
        const aux = await this.authService.login(email, pass);

        if (aux.user) {
            // Obtener datos del usuario desde Firestore
            const usuarioLogin = await this.firestore.collection('usuarios').doc(aux.user.uid).get().toPromise();
            const data = usuarioLogin?.data() as Usuario;

            // Verificar si la cuenta está deshabilitada
            if (data.disabled) {
                Swal.fire({
                    icon: 'error',
                    title: 'Cuenta deshabilitada',
                    text: 'Tu cuenta está deshabilitada. Por favor, contacta al soporte.',
                    confirmButtonText: 'OK',
                    heightAuto: false,
                });
                return;
            }

            // Almacenar información del usuario en localStorage
            localStorage.setItem('usuarioLogin', JSON.stringify({ email, uid: aux.user.uid }));

            // Manejar la navegación según el tipo de usuario
            if (data) {
                if (data.tipo === 'admin') {
                    this.router.navigate(['/admin-dash']);
                } else if (data.tipo === 'usuario') {
                    this.router.navigate(['/user-home']);
                } else if (data.tipo === 'conductor') {
                    // Actualizar el estado activo en Firestore
                    await this.firestore.collection('usuarios').doc(aux.user.uid).update({ activo: true });
                    this.router.navigate(['/driver-home']);
                }
            }
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al iniciar sesión. Verifica tus credenciales.',
            confirmButtonText: 'OK',
            heightAuto: false,
        });
        this.loginForm.reset(); // Limpiar los campos del formulario
    } finally {
        loading.dismiss();
    }
  }

  /* ---- Google Login ---- */
  async logInWithGoogle() {
    try {
      const result = await this.authService.googleLogin();
      if (result.user) {
        this.handleUserLogin(result.user.uid, result.user.email);
      }
    } catch (error) {
      console.error('Error en el inicio de sesión con Google:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al iniciar sesión con Google.',
        confirmButtonText: 'OK',
        heightAuto: false,
      });
    }
  }

  /* ---- GitHub Login ---- */
  async logInWithGitHub() {
    try {
      const result = await this.authService.githubLogin();
      if (result.user) {
        this.handleUserLogin(result.user.uid, result.user.email);
      }
    } catch (error) {
      console.error('Error en el inicio de sesión con GitHub:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al iniciar sesión con GitHub.',
        confirmButtonText: 'OK',
        heightAuto: false,
      });
    }
    
  }
  handleUserLogin(uid: string, email: string | null) {
    throw new Error('Method not implemented.');
  }

  /* ----- Reset PASSWORD ----- */

  async resetPassword() {
    if (this.resetForm.valid) {
      const email = this.resetForm.get('email')?.value;
      try {
        await this.authService.resetPassword(email);
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Se ha enviado un correo a tu email para recuperar tu contraseña!',
          confirmButtonText: 'Gracias!',
          heightAuto: false
        });
        return;
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No pudimos enviar un mensaje de recuperación, verifica si tu correo esta bien escrito!',
          confirmButtonText: 'Reintentar',
          heightAuto: false
        });
        return;
      }
    } else {
      console.error('Formulario no válido:', this.resetForm.errors);
    }
  }

  /* ----- Ir A REGISTRO ----- */

  goToRegister(){
    this.router.navigate(['/sign-in']);
  }

}
