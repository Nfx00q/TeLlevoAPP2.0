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

  private collectionName = 'viajes';

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

  getViajes(): Observable<Viajes[]> {
    return this.firestore.collection<Viajes>('viajes').valueChanges();
  }

  actualizarViajePorCodigo(codigo: string, data: Partial<Viajes>): Observable<void> {
    return new Observable((observer) => {
      // Buscar el documento que tiene el campo `codigo` igual al proporcionado
      this.firestore
        .collection('viajes', (ref) => ref.where('codigo', '==', codigo)) // Consulta con filtro
        .get()
        .toPromise()
        .then((querySnapshot) => {
          if (!querySnapshot?.empty) {
            // Si el documento existe, obtener su ID
            const docId = querySnapshot?.docs[0].id;
  
            // Actualizar el documento usando su ID
            this.firestore
              .collection('viajes')
              .doc(docId)
              .update(data)
              .then(() => {
                observer.next();
                observer.complete();
              })
              .catch((error) => observer.error(error));
          } else {
            observer.error(new Error('No se encontró el documento con el código proporcionado.'));
          }
        })
        .catch((error) => observer.error(error));
    });
  }
  
}