import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Router } from "@angular/router";
import {
  BarcodeScanner,
  LensFacing,
} from "@capacitor-mlkit/barcode-scanning";
import { Geolocation } from "@capacitor/geolocation";
import { MenuController, ModalController, Platform } from "@ionic/angular";
import { Viajes } from "src/app/interfaces/viajes";
import { AuthServiceService } from "src/app/services/auth-service.service";
import { ViajesService } from "src/app/services/viejes.service";
import { BarcodeScanningModalComponent } from "./barcode-scanning-modal.component";
import firebase from 'firebase/compat/app';

declare var google: any;

@Component({
  selector: "app-user-home",
  templateUrl: "./user-home.page.html",
  styleUrls: ["./user-home.page.scss"],
})
export class UserHomePage implements OnInit {
  // Usuarios disponibles
  usuarios: any[] = [];
  usuario: any;
  nombreUsuario?: string;

  // Info del viaje escaneado
  public codigoEscaneado: string = "";
  viajeInfo: any;
  conductorInfo: any;
  vehiculoInfo: any;

  // Mapa y servicios de direcciones
  map: any;
  directionsService: any;
  directionsRenderer: any;

  // Viajes
  viajes?: any[] = [];
  private renderers: google.maps.DirectionsRenderer[] = [];

  // Scanner
  isScanned: boolean = false;

  // Ubicaciones predeterminadas
  ubicaciones = [
    {
      lat: -33.598425578019224,
      lng: -70.57833859675443,
      icon: "assets/icon/instituto.png",
      label: "Cede Puente Alto",
      title: "Duoc UC",
    },
    {
      lat: -33.66860553928277,
      lng: -70.58535175998844,
      icon: "assets/icon/instituto.png",
      label: "Cede Pirque",
      title: "Duoc UC",
    },
    {
      lat: -33.5800609330941,
      lng: -70.58197464104566,
      icon: "assets/icon/stop.png",
      label: "TL-1 / Av. Gabriela & Av. Concha y Toro",
      title: "TL-1",
    },
    {
      lat: -33.57426112502435,
      lng: -70.55495967884225,
      icon: "assets/icon/stop.png",
      label: "TL-2 / Av. Gabriela Ote. & Av. Camilo Henriquez",
      title: "TL-2",
    },
    {
      lat: -33.56692284768454,
      lng: -70.63052933119687,
      icon: "assets/icon/stop.png",
      label: "TL-3 / Av. Observatorio & Av. Sta. Rosa",
      title: "TL-3",
    },
  ];

  viajeActivo: any;

  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private platform: Platform,
    private menuController: MenuController,
    private authService: AuthServiceService,
    private viajeService: ViajesService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.getUsers();
    this.getViajes();
    this.menuController.enable(false);

    if (this.platform.is("capacitor")) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }

  ngAfterViewInit() {
    this.loadGoogleMaps().then(() => this.initMap());

    this.authService.getCurrentUser().subscribe((user) => {
      if (user && user.uid) {
        // Obtener datos del usuario autenticado
        this.authService.getUserData(user.uid).subscribe((userData) => {
          this.usuario = userData;
          this.nombreUsuario = userData?.nombre;
        });
      } else {
        console.error("No se encontró un usuario autenticado.");
      }
    });
  }

  getUsers() {
    this.authService.getUsers().subscribe((users) => {
      this.usuarios = users;
    });
  }

  getViajes() {
    this.viajeService.getViajes().subscribe((viajes) => {
      this.viajes = viajes;
    });
  }

  async initMap() {
    const mapOptions = {
      center: { lat: -33.59841000351409, lng: -70.57834513910244 },
      zoom: 13,
      disableDefaultUI: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ visibility: "on" }] },
      ],
    };

    this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#242424", strokeWeight: 5 },
    });
    this.directionsRenderer.setMap(this.map);

    try {
      const position = await Geolocation.getCurrentPosition();
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      new google.maps.Marker({
        position: pos,
        map: this.map,
        title: "Tu ubicación actual",
        icon: {
          url: "assets/icon/ubi.png",
          scaledSize: new google.maps.Size(50, 50),
        },
      });
      this.map.setCenter(pos);
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
      alert("No se pudo obtener la ubicación actual.");
    }

    this.ubicaciones.forEach((ubicacion) => {
      const marker = new google.maps.Marker({
        position: { lat: ubicacion.lat, lng: ubicacion.lng },
        map: this.map,
        icon: {
          url: `${ubicacion.icon}?t=${new Date().getTime()}`,
          scaledSize: new google.maps.Size(40, 40),
        },
        title: ubicacion.label,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<p>${ubicacion.label}</p>`,
      });
      marker.addListener("click", () => infoWindow.open(this.map, marker));
    });
  }

  loadGoogleMaps(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof google !== "undefined") {
        resolve(true);
      } else {
        window["googleMapsCallback"] = () => resolve(true);
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAp4tplN5KEmKIHOV4vyFXuS6KKFsJqESg&callback=googleMapsCallback&t=${new Date().getTime()}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    });
  }

  goToConfig() {
    this.router.navigate(["/config-page"]);
  }

  async startScan() {
    try {
      const modal = await this.modalController.create({
        component: BarcodeScanningModalComponent,
        cssClass: "barcode-scanner-modal",
        showBackdrop: false,
        componentProps: {
          formats: [],
          LensFacing: LensFacing.Back,
        },
        presentingElement: await this.modalController.getTop(),
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();
      if (data?.barcode?.displayValue) {
        this.codigoEscaneado = data.barcode.displayValue;
        console.log(`Código escaneado: ${this.codigoEscaneado}`);
      } else {
        console.log("No se escaneó ningún código.");
        return;
      }

      this.firestore
        .collection("viajes")
        .doc(this.codigoEscaneado)
        .get()
        .subscribe((doc) => {
          if (doc.exists) {
            this.viajeInfo = doc.data() as Viajes;

            if (this.viajeInfo.can_disponibles > 0) {
              const conductorUid = this.viajeInfo.conductorUid;

              this.firestore
                .collection("usuarios")
                .doc(conductorUid)
                .get()
                .subscribe((conductorDoc) => {
                  if (conductorDoc.exists) {
                    this.conductorInfo = conductorDoc.data();
                    const vehiculo = this.conductorInfo?.vehiculo;

                    if (vehiculo) {
                      this.vehiculoInfo = { ...vehiculo };
                    } else {
                      console.log("El conductor no tiene un vehículo registrado.");
                    }

                    const updatedPasajeros = this.viajeInfo.pasajeros || [];
                    updatedPasajeros.push(this.usuario.uid);

                    this.firestore
                      .collection("viajes")
                      .doc(this.codigoEscaneado)
                      .update({
                        pasajeros: firebase.firestore.FieldValue.arrayUnion(this.usuario.uid),
                        can_disponibles: firebase.firestore.FieldValue.increment(-1),
                        activo: true,
                      })
                      .then(() => {
                        console.log("Pasajero agregado correctamente al viaje.");
                      })
                      .catch((error) => {
                        console.error("Error al agregar pasajero:", error);
                      });
                    }
                });
            } else {
              console.error("Este viaje no tiene cupos disponibles.");
              alert("Viaje sin disponibilidad.");
            }
          } else {
            console.log("El código escaneado no corresponde a un viaje registrado.");
            alert("Código inválido.");
          }
        });
    } catch (error) {
      console.error("Error al escanear el código:", error);
    }
  }

  cerrarSesion() {
    this.authService.logOut().then(() => this.router.navigate(["/"]));
  }

  selectViaje(codigoViaje: string) {
    console.log("Código del viaje seleccionado:", codigoViaje); // Verifica que no sea undefined
  
    if (!codigoViaje) {
      console.error("Error: El código del viaje es undefined o null.");
      alert("Error: No se pudo obtener el código del viaje.");
      return;
    }
  
    this.firestore
      .collection("viajes", ref => ref.where("codigo", "==", codigoViaje))
      .get()
      .subscribe((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          this.viajeInfo = doc.data() as Viajes;
  
          if (this.viajeInfo.can_disponibles > 0) {
            const conductorUid = this.viajeInfo.conductorUid;
  
            this.firestore
              .collection("usuarios")
              .doc(conductorUid)
              .get()
              .subscribe((conductorDoc) => {
                if (conductorDoc.exists) {
                  this.conductorInfo = conductorDoc.data();
                  const vehiculo = this.conductorInfo?.vehiculo;
  
                  if (vehiculo) {
                    this.vehiculoInfo = { ...vehiculo };
                  } else {
                    console.log("El conductor no tiene un vehículo registrado.");
                  }
  
                  this.firestore
                    .collection("viajes")
                    .doc(doc.id)
                    .update({
                      pasajeros: firebase.firestore.FieldValue.arrayUnion(this.usuario.uid),
                      can_disponibles: firebase.firestore.FieldValue.increment(-1),
                      activo: true,
                    })
                    .then(() => {
                      console.log("Pasajero agregado correctamente al viaje.");
                    })
                    .catch((error) => {
                      console.error("Error al agregar pasajero:", error);
                    });
                }
              });
          } else {
            console.error("Este viaje no tiene cupos disponibles.");
            alert("Viaje sin disponibilidad.");
          }
        } else {
          console.log("No se encontró el viaje con el código especificado.");
          alert("Código inválido.");
        }
      }, (error) => {
        console.error("Error al obtener los datos del viaje:", error);
      });
  }

  removePassenger() {
    if (!this.viajeInfo || !this.usuario?.uid) {
      console.error("No hay un viaje activo o no se pudo obtener el UID del usuario.");
      return;
    }
  
    const viajeId = this.viajeInfo.codigo;
  
    this.firestore
      .collection("viajes", ref => ref.where("codigo", "==", viajeId))
      .get()
      .subscribe((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
  
          // Actualiza el viaje en Firestore para remover al pasajero
          this.firestore
            .collection("viajes")
            .doc(doc.id)
            .update({
              pasajeros: firebase.firestore.FieldValue.arrayRemove(this.usuario.uid),
              can_disponibles: firebase.firestore.FieldValue.increment(1),
            })
            .then(() => {
              console.log("Pasajero eliminado del viaje.");
  
              // Limpia la información del viaje, conductor y vehículo en la vista
              this.viajeInfo = null;
              this.conductorInfo = null;
              this.vehiculoInfo = null;
              this.isScanned = false; // Restablece el estado del escaneo
            })
            .catch((error) => {
              console.error("Error al eliminar pasajero del viaje:", error);
            });
        } else {
          console.error("No se encontró el viaje para eliminar el pasajero.");
        }
      });
  }
}
