import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, MenuController, ModalController } from '@ionic/angular';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import { EditModalComponent } from './edit-modal/edit-modal.component';

@Component({
  selector: 'app-admin-dash',
  templateUrl: './admin-dash.page.html',
  styleUrls: ['./admin-dash.page.scss'],
})
export class AdminDashPage implements OnInit {

  usuarios: any[] = [];
  selectedUsuario: any;

  constructor(private authService: AuthServiceService, 
    private alertController: AlertController, 
    private modalController: ModalController, 
    private menuController: MenuController,
    private router: Router) {
  }

  ngOnInit() {
    this.getUsers();
    this.menuController.enable(false);
  }

  getUsers() {
    this.authService.getUsers().subscribe(users => {
      this.usuarios = users;
    });
  }

  userInfo(usuario: any) {
    this.router.navigate(['/user-info'], {
      queryParams: {
        usuario: JSON.stringify(usuario)
      }
    });
  }

  async logout(){
    this.authService.logOut();
    this.router.navigate(['/login'])
  }

  async editarUsuario(usuario: any) {
    const modal = await this.modalController.create({
      component: EditModalComponent,
      componentProps: { usuario } // Pasa el usuario al modal
    });

    modal.onDidDismiss().then(async (data) => {
      if (data.data) {
        // Si se devuelve updatedData, llama al método para editar el usuario
        await this.authService.editUser(usuario.uid, data.data);
        this.getUsers(); // Actualiza la lista de usuarios después de editar
      }
    });

    return await modal.present();
  }

  async eliminarUsuario(usuario: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar deshabilitación',
      message: `¿Estás seguro de que deseas deshabilitar al usuario?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Deshabilitar',
          handler: () => {
            this.authService.deleteUser(usuario.uid)
              .then(() => {
                console.log('Usuario deshabilitado correctamente');
              })
              .catch((error) => {
                console.error('Error al deshabilitar usuario:', error);
              });
          }
        }
      ]
    });
    await alert.present();
  }
}
