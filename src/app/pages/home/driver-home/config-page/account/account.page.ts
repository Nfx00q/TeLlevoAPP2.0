import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthServiceService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit {

  usuario: any;

  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef;

  constructor(
    private menuController: MenuController, 
    private route: ActivatedRoute, 
    private toastController: ToastController, 
    private authService: AuthServiceService) { }

  ngOnInit() {
    this.menuController.enable(false);
    this.route.queryParams.subscribe(params => {
      if (params && params['usuario']) {
        try {
          this.usuario = JSON.parse(params['usuario']);
          console.log("Usuario en account-page:", this.usuario);
        } catch (error) {
          console.error("Error al parsear JSON:", error);
        }
      }
    });
  }

  async saveChanges() {
    try {
      const dataToUpdate = {
        telefono: this.usuario.telefono || '',
        img_usuario: this.usuario.img_usuario || '',
        edad: this.usuario.edad || ''
      };
  
      await this.authService.editUser(this.usuario.uid, dataToUpdate);
  
      const toast = await this.toastController.create({
        message: 'Cambios guardados exitosamente',
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al guardar los cambios',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
      console.error('Error actualizando datos:', error);
    }
  }   

  selectImage() {
    this.fileInput.nativeElement.click();
  }

  async uploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {

        const imageUrl = await this.authService.uploadImageToFirebase(file, this.usuario.uid);

        this.usuario.img_usuario = imageUrl;

        await this.authService.editUser(this.usuario.uid, { img_usuario: imageUrl });

        const toast = await this.toastController.create({
          message: 'Imagen guardada exitosamente',
          duration: 2000,
          color: 'success'
        });
        toast.present();
      } catch (error) {
        console.error("Error al subir la imagen:", error);
      }
    }
  }
}
