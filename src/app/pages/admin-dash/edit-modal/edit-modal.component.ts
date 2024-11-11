import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss'],
})
export class EditModalComponent  implements OnInit {

  usuario: any; // El usuario que se va a editar
  updatedData: any = {}; // Para guardar los datos actualizados

  constructor(private modalController: ModalController, private router: Router) {}

  ngOnInit() {
    // Rellena los campos con la información existente
    this.updatedData = { ...this.usuario };
  }

  cerrarModal() {
    this.modalController.dismiss();
  }

  async enviar() {
    await this.modalController.dismiss(this.updatedData); // Devuelve los datos actualizados al componente principal
  }
}
