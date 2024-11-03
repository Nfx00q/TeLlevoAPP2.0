import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Usuario } from '../interfaces/usuario';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(
    private angularFireAuth : AngularFireAuth, 
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router
  ){}

  getUsers(): Observable<Usuario[]> { // Cambiar a Usuario[]
    return this.firestore.collection<Usuario>('usuarios').valueChanges();
  }

  getUserData(uid: string): Observable<Usuario | undefined> { // Cambiar a Usuario | undefined
    return this.firestore.collection<Usuario>('usuarios').doc(uid).valueChanges();
  }

  getCurrentUser() {
    return this.angularFireAuth.authState;
  }

  async editUser(usuarioId: string, updatedData?: any) {
    await this.firestore.collection('usuarios').doc(usuarioId).update(updatedData);
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firestore.collection('usuarios').doc(uid).update({ disabled: true });
    } catch (error) {
      console.error('Error deshabilitando el usuario:', error);
      throw new Error('Error al deshabilitar el usuario'); // Manejo de error más específico
    }
  }
  
  login(email: string, pass: string) {
    return this.angularFireAuth.signInWithEmailAndPassword(email, pass);
  }

  register(email: string, pass: string){
    return this.angularFireAuth.createUserWithEmailAndPassword(email, pass);
  }

  async logOut() {
    try {
      const usuarioLogin = JSON.parse(localStorage.getItem('usuarioLogin') || '{}');
      const uid = usuarioLogin.uid; // Obtén el UID del usuario almacenado
      const usuarioDoc = await this.firestore.collection('usuarios').doc(uid).get().toPromise();
      const data = usuarioDoc?.data() as Usuario; // Asegúrate de que Usuario esté importado
  
      if (data && data.tipo === 'conductor') {
        // Actualiza el estado "activo" a false
        await this.firestore.collection('usuarios').doc(uid).update({ activo: false });
      }
  
      await this.angularFireAuth.signOut();  // Cierra sesión en el servicio de autenticación.
      localStorage.removeItem('usuarioLogin');  // Elimina el usuario almacenado en localStorage.
  
      // Opcional: Puedes redirigir al usuario a la página de inicio o login
      this.router.navigate(['/log-in']); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Manejo de errores (opcional)
    }
  }
  
  async resetPassword(email: string) {
    if (!email) {
      throw new Error('El correo electrónico es obligatorio');
    }
    try {
      await this.angularFireAuth.sendPasswordResetEmail(email);
    } catch (error: any) { // Usa 'any' para evitar el error
      throw new Error(`Error al enviar el correo de recuperación: ${error.message}`);
    }
  }

  async uploadImageToFirebase(file: File, userId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const filePath = `user_images/${userId}/${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, file);

      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(
            (url) => resolve(url),
            (error) => reject(error)
          );
        })
      ).subscribe();
    });
  }
  
}
