import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthServiceService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-config-page',
  templateUrl: './config-page.page.html',
  styleUrls: ['./config-page.page.scss'],
})
export class ConfigPagePage implements OnInit {

  usuario: any;

  constructor(
    private menuController: MenuController, 
    private router: Router, 
    private authService: AuthServiceService
  ) { }

  ngOnInit() {
    this.menuController.enable(false);

    // Obtener el usuario autenticado
    this.authService.getCurrentUser().subscribe(user => {
      if (user && user.uid) {
        // Obtener los datos del usuario desde Firestore
        this.authService.getUserData(user.uid).subscribe(userData => {
          this.usuario = userData;
          console.log("Datos del usuario:", this.usuario);
        });
      } else {
        console.error("No se encontró un usuario autenticado.");
      }
    });
  }

  goToAccount() {
    this.router.navigate(['/account'], {
      queryParams: {
        usuario: JSON.stringify(this.usuario)
      }
    });
  }

  async logout() {
    await this.authService.logOut();  // Llama al método de cerrar sesión.
    this.router.navigate(['/log-in']);  // Redirige al login.
  }

}
