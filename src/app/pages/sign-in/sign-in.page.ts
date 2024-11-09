import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import axios from 'axios';
import { Usuario } from 'src/app/interfaces/usuario';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {

  /* ----- Definición de FORMULARIO REGISTRO ----- */

  registerForm: FormGroup;

  /* ----- DEFINICION DE VARIABLES ------ */

  emailValue : string = ' ';
  passValue : string = ' ';
  nombreValue : string = ' ';
  apellidoValue : string = ' ';
  tipoCuenta: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder, 
    private toastController: ToastController,
    private authService: AuthServiceService,
    private menuController: MenuController,
    private firestore: AngularFirestore
  ) { 
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
      repass: ['', [Validators.required, Validators.minLength(6)]],
      tipoCuenta: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.menuController.enable(true);
  }

  async register() {
    const email = this.registerForm.get('email')?.value.trim() || '';
    const pass = this.registerForm.get('pass')?.value.trim() || '';
    const repass = this.registerForm.get('repass')?.value || '';
    const tipoCuenta = this.registerForm.get('tipoCuenta')?.value || 'usuario'; // Capturar el tipo de cuenta
    
    if (pass !== repass) {
      const toast = await this.toastController.create({
        message: 'Las contraseñas no coinciden.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }
  
    try {
      const aux = await this.authService.register(email, pass);
      const user = aux.user;
  
      if (user) {
        await this.firestore.collection('usuarios').doc(user.uid).set({
          uid: user.uid,
          nombre: this.registerForm.get('firstName')?.value,
          apellido: this.registerForm.get('lastName')?.value,
          email: user.email,
          pass: pass,
          tipo: tipoCuenta
        });
  
        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso!',
          text: 'Cuenta registrada con éxito.',
          confirmButtonText: 'OK',
          heightAuto: false
        }).then(() => {
          if (tipoCuenta === 'conductor') {
            Swal.fire({
              icon: 'info',
              title: 'Registra tu vehiculo',
              text: 'Debes registrar un vehiculo a tu cuenta antes de comenzar',
              confirmButtonText: 'Registrar vehiculo',
              heightAuto: false
            });
            this.router.navigate(['/sign-car', { uid: user.uid }]);
          } else {
            this.router.navigate(['/log-in']);
          }
        });
      }
  
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Hubo un error!',
        text: 'Error al registrar la cuenta.',
        confirmButtonText: 'Reintentar',
        heightAuto: false,
      });
    }
  }

  goToLogin(){
    this.router.navigate(['/log-in']);
  }

  setAccountType(type: string) {
    this.tipoCuenta = type;
    this.registerForm.controls['tipoCuenta'].setValue(type);
  }

  /* ------ CREATE RANDOM USER -------- */

  async generateRandomUsers(count: number) {
    try {
      const response = await axios.get(`https://randomuser.me/api/?results=${count}`);
      const users: Usuario[] = response.data.results.map((user: any) => {
        // Generar un role aleatorio
        const tipos: Usuario['tipo'][] = ["usuario", "conductor", "admin"];
        const randomRole = tipos[Math.floor(Math.random() * tipos.length)];
  
        return {
          nombre: user.name.first,
          apellido: user.name.last,
          rut: user.id.value,
          telefono: user.phone,
          edad: this.calculateAge(user.dob.date), 
          email: user.email,
          pass: '123456',
          tipo: randomRole,
          disabled: false,
        };
      });
      this.saveUsersToFirebase(users);
    } catch (error) {
      console.error('Error al obtener usuarios: ', error);
    }
  }  

  saveUsersToFirebase(users: Usuario[]) {
    const batch = this.firestore.firestore.batch();
  
    users.forEach(user => {
      const userRef = this.firestore.collection('usuarios').doc().ref;
      batch.set(userRef, user);
    });
  
    batch.commit()
      .then(() => {
        Swal.fire({
          icon: 'info',
          title: 'Usuarios creados',
          text: '10 Usuarios creados en la Base de Datos',
          confirmButtonText: 'Cerrar',
          heightAuto: false,
        });
        console.log('Usuarios guardados exitosamente');
      })
      .catch(error => {
        console.error('Error al guardar usuarios: ', error);
      });
  }
  

  calculateAge(birthdate: string): string {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString(); // Retorna la edad como string
  }
}
