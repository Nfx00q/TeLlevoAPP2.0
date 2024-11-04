import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, MenuController } from '@ionic/angular';
import { Usuario } from 'src/app/interfaces/usuario';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.page.html',
  styleUrls: ['./log-in.page.scss'],
})
export class LogInPage implements OnInit {

  /* ----- Definir formularios ----- */
  loginForm: FormGroup;
  resetForm: FormGroup;

  /* ----- Valores de input ----- */
  emailValue: string = '';
  passValue: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private menuController: MenuController,
    private authService: AuthServiceService,
    private firestore: AngularFirestore
  ) {
    // Formulario de login
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Formulario para resetear contraseña
    this.resetForm = this.formBuilder.group({
      email: ['']
    });
  }

  ngOnInit() {
    this.menuController.enable(false);

    // Comprobación de sesión persistente
    const usuarioLogin = localStorage.getItem('usuarioLogin');
    if (usuarioLogin) {
      const usuarioData = JSON.parse(usuarioLogin);
      this.firestore.collection('usuarios').doc(usuarioData.uid).get().toPromise().then(async doc => {
        const data = doc?.data() as Usuario;
        if (data) {
          await this.navigateToDashboard(data.tipo!);
        }
      });
    }
  }

  /* ----- Iniciar sesión ----- */
  async logIn() {
    const loading = await this.loadingController.create({
      message: 'Cargando.....',
      duration: 2000
    });

    try {
      await loading.present();
      const email = this.emailValue!;
      const pass = this.passValue!;

      // Iniciar sesión
      const aux = await this.authService.login(email, pass);
      if (aux.user) {
        const usuarioDoc = await this.firestore.collection('usuarios').doc(aux.user.uid).get().toPromise();
        const userData = usuarioDoc?.data() as Usuario;

        // Verificación de cuenta deshabilitada
        if (userData?.disabled) {
          Swal.fire({
            icon: 'error',
            title: 'Cuenta deshabilitada',
            text: 'Tu cuenta está deshabilitada. Por favor, contacta al soporte.',
            confirmButtonText: 'OK',
            heightAuto: false,
          });
          return;
        }

        // Guardar sesión en localStorage
        localStorage.setItem('usuarioLogin', JSON.stringify({ email, uid: aux.user.uid }));
        await this.navigateToDashboard(userData.tipo!);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al iniciar sesión. Verifica tus credenciales.',
        confirmButtonText: 'OK',
        heightAuto: false,
      });
      this.emailValue = '';
      this.passValue = '';
    } finally {
      loading.dismiss();
    }
  }

  /* ----- Resetear contraseña ----- */
  async resetPassword() {
    if (this.resetForm.valid) {
      const email = this.resetForm.get('email')?.value!;
      try {
        await this.authService.resetPassword(email);
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Se ha enviado un correo a tu email para recuperar tu contraseña!',
          confirmButtonText: 'Gracias!',
          heightAuto: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No pudimos enviar un mensaje de recuperación, verifica si tu correo está bien escrito!',
          confirmButtonText: 'Reintentar',
          heightAuto: false
        });
      }
    } else {
      console.error('Formulario no válido:', this.resetForm.errors);
    }
  }

  /* ----- Navegar a dashboard según el tipo de usuario ----- */
  private async navigateToDashboard(tipo: string) {
    if (tipo === 'admin') {
      this.router.navigate(['/admin-dash']);
    } else if (tipo === 'usuario') {
      this.router.navigate(['/user-home']);
    } else if (tipo === 'conductor') {
      await this.firestore.collection('usuarios').doc(JSON.parse(localStorage.getItem('usuarioLogin')!).uid).update({ activo: true });
      this.router.navigate(['/driver-home']);
    } else {
      this.router.navigate(['/invitado-dashboard']);
    }
  }

  /* ----- Ir a la página de registro ----- */
  goToRegister() {
    this.router.navigate(['/sign-in']);
  }
}
