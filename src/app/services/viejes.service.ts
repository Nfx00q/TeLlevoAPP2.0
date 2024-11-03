import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Viajes } from 'src/app/interfaces/viajes';

@Injectable({
  providedIn: 'root',
})
export class ViajesService {
  private viajesCollection = this.firestore.collection<Viajes>('viajes');

  constructor(private firestore: AngularFirestore) {}

  crearViaje(viaje: Viajes): Observable<any> {
    return new Observable((observer) => {
      this.firestore
        .collection('viajes')
        .add(viaje)
        .then((docRef) => {
          observer.next(docRef.id); // Send the document ID to the subscriber
          observer.complete(); // Complete the observable
        })
        .catch((error) => {
          observer.error(error); // Handle any errors
        });
    });
  }

  obtenerViajePorCodigo(codigo: string) {
    return this.viajesCollection.doc(codigo).valueChanges();
  }

  generarCodigoUnico(): string {
    return this.firestore.createId();
  }
  
}