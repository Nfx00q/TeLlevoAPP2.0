import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthServiceService } from 'src/app/services/auth-service.service';

import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-sign-car',
  templateUrl: './sign-car.page.html',
  styleUrls: ['./sign-car.page.scss'],
})
export class SignCarPage implements OnInit {
  registerCar: FormGroup;
  uid?: string;
  imgVehiculoUrl: string = '';  // To store the vehicle image URL temporarily

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private menuController: MenuController,
    private firestore: AngularFirestore,
    private route: ActivatedRoute,
    private storage: AngularFireStorage  // Inject AngularFireStorage
  ) {
    this.registerCar = this.formBuilder.group({
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      color: ['', [Validators.required]],
      patente: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid'); // Obtener el UID
    if (uid) {
      this.uid = uid;
    }
    this.menuController.enable(false);
  }

  // Handle image file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const filePath = `vehiculos/${this.uid}_${new Date().getTime()}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, file);

      // Monitor upload progress and get download URL
      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.imgVehiculoUrl = url;  // Save the download URL
          });
        })
      ).subscribe();
    }
  }

  async regVeh() {
    const marca = this.registerCar.get('marca')?.value.trim();
    const modelo = this.registerCar.get('modelo')?.value.trim();
    const color = this.registerCar.get('color')?.value.trim() || '';
    const patente = this.registerCar.get('patente')?.value.trim();

    if (!patente) {
      const toast = await this.toastController.create({
        message: 'Debes ingresar una patente.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const vehiculo = {
      marca,
      modelo,
      color,
      patente,
      img_vehiculo: this.imgVehiculoUrl  // Include the image URL
    };

    try {
      if (this.uid) {
        // Obtener referencia al documento usando AngularFirestore
        const usuarioRef = this.firestore.collection('usuarios').doc(this.uid);
        await usuarioRef.update({ vehiculo });

        const toast = await this.toastController.create({
          message: 'Vehículo registrado exitosamente.',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        this.router.navigate(['/driver-home']); // Cambia la ruta según la lógica de tu app
      }
    } catch (error) {
      console.error("Error al registrar el vehículo:", error);
      const toast = await this.toastController.create({
        message: 'Hubo un problema al registrar el vehículo. Intenta nuevamente.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
