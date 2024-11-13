import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BarcodeScanner, LensFacing, ScanResult } from '@capacitor-mlkit/barcode-scanning';
import { Geolocation } from '@capacitor/geolocation';
import { MenuController, ModalController, Platform } from '@ionic/angular';
import { Viajes } from 'src/app/interfaces/viajes';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import Swal from 'sweetalert2';

declare var google: any;

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.page.html',
  styleUrls: ['./user-home.page.scss'],
})

export class UserHomePage implements OnInit {

  /* ----- Obtener USUARIOS (Conductores disponibles) ------ */ 

  usuarios: any[] = [];

  /* ----- Info del viaje SCANEADO ------ */

  public codigoEscaneado: string = '';
  viajeInfo: any;
  conductorInfo: any;
  vehiculoInfo: any;

  map: any;
  directionsService: any;
  directionsRenderer: any;

  /* ----- SCANNER ------ */

  isScanned: boolean = false;

  ubicaciones = [
    { lat: -33.598425578019224, lng: -70.57833859675443, icon: 'assets/icon/instituto.png', label: 'Cede Puente Alto' },
    { lat: -33.66860553928277, lng: -70.58535175998844, icon: 'assets/icon/instituto.png', label: 'Cede Pirque' },
    { lat: -33.5800609330941, lng: -70.58197464104566, icon: 'assets/icon/stop.png', label: 'TL-1 / Av. Gabriela & Av. Concha y Toro' },
    { lat: -33.57426112502435, lng: -70.55495967884225, icon: 'assets/icon/stop.png', label: 'TL-2 / Av. Gabriela Ote. & Av. Camilo Henriquez' },
    { lat: -33.56692284768454, lng: -70.63052933119687, icon: 'assets/icon/stop.png', label: 'TL-3 / Av. Observatorio & Av. Sta. Rosa' },
  ]

  constructor(private router: Router, 
    private firestore: AngularFirestore, 
    private modalController: ModalController, 
    private platform: Platform, 
    private menuController: MenuController,
    private authService: AuthServiceService) { }

  ngOnInit() {
    this.getUsers();
    this.menuController.enable(false);

    if (this.platform.is('capacitor')){
      BarcodeScanner.isSupported().then()
      BarcodeScanner.checkPermissions().then()
      BarcodeScanner.removeAllListeners();
    }
  }

  ngAfterViewInit() { 
    this.loadGoogleMaps().then(() => {
      this.initMap();
    });
   }

  getUsers() {
    this.authService.getUsers().subscribe(users => {
      this.usuarios = users;
    });
  }

  /* ----- INICIALIZAR MAPA ----- */

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

    // Inicializa el mapa y los servicios de direcciones
    this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#242424', strokeWeight: 5 },
    });
    this.directionsRenderer.setMap(this.map);

    try {
        // Obtiene la ubicación actual del usuario usando Capacitor
        const position = await Geolocation.getCurrentPosition();
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };

        // Agrega el marcador de ubicación actual
        new google.maps.Marker({
            position: pos,
            map: this.map,
            title: "Tu ubicación actual",
            icon: { url: 'assets/icon/ubi.png', scaledSize: new google.maps.Size(50, 50) },
        });
        this.map.setCenter(pos);
    } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        alert("No se pudo obtener la ubicación actual.");
    }

    // Agrega marcadores personalizados para cada ubicación en `ubicaciones`
    this.ubicaciones.forEach((ubicacion) => {
        const marker = new google.maps.Marker({
            position: { lat: ubicacion.lat, lng: ubicacion.lng },
            map: this.map,
            icon: {
                url: `${ubicacion.icon}?t=${new Date().getTime()}`, // Evita la cache del icono
                scaledSize: new google.maps.Size(40, 40),
            },
            title: ubicacion.label,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<p>${ubicacion.label}</p>`,
        });
        marker.addListener('click', () => infoWindow.open(this.map, marker));
    });

    // Configuración de manejo de error de geolocalización
    function handleLocationError(browserHasGeolocation: boolean, pos: any) {
        alert(browserHasGeolocation
            ? "Error: El servicio de geolocalización ha fallado."
            : "Error: Tu navegador no soporta la geolocalización.");
    }
  }

  loadGoogleMaps(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof google !== 'undefined') {
        resolve(true);
      } else {
        window['googleMapsCallback'] = () => resolve(true);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAp4tplN5KEmKIHOV4vyFXuS6KKFsJqESg&callback=googleMapsCallback&t=${new Date().getTime()}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    });
  }

  goToConfig() {
    this.router.navigate(['/config-page']);
  }

  /* ---- Scan QR Code ----- */

  async startScan() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanner-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back
      },
      presentingElement: await this.modalController.getTop()
    });
  
    await modal.present();
  
    // Resultado del escaneo
    const { data } = await modal.onDidDismiss();
  
    // Resultado del escaneo
if (data?.barcode?.displayValue) {
  this.codigoEscaneado = data.barcode.displayValue;
  console.log(`Código escaneado: ${this.codigoEscaneado}`);

  // Buscar el viaje en Firebase
  this.firestore.collection('viajes').doc(this.codigoEscaneado).get().subscribe((doc) => {
    if (doc.exists) {
      this.viajeInfo = doc.data() as Viajes;
      console.log("Viaje encontrado:", this.viajeInfo);

      // Verificar disponibilidad
      if (this.viajeInfo.can_disponibles > 0) {
        // Obtener la información del conductor usando conductorUid
        const conductorUid = this.viajeInfo.conductorUid;
        console.log("Conductor UID:", conductorUid);

        this.firestore.collection('usuarios').doc(conductorUid).get().subscribe((conductorDoc) => {
          if (conductorDoc.exists) {
            this.conductorInfo = conductorDoc.data();
            console.log('Información del conductor:', this.conductorInfo);

            // Obtener la información del vehículo
            const vehiculo = this.conductorInfo?.vehiculo;
            if (vehiculo) {
              console.log('Información del vehículo:', vehiculo);
              const { marca, modelo, color, img_vehiculo } = vehiculo;
              this.vehiculoInfo = { marca, modelo, color, img_vehiculo };
              console.log('Marca:', marca);
              console.log('Modelo:', modelo);
              console.log('Color:', color);
              console.log('Imagen del vehículo:', img_vehiculo);
            } else {
              console.log("El conductor no tiene un vehículo registrado.");
            }

            // Reducir la cantidad de asientos disponibles en 1
            this.firestore.collection('viajes').doc(this.codigoEscaneado).update({
              can_disponibles: this.viajeInfo.can_disponibles - 1
            }).then(() => {
              console.log("Información cargada correctamente");
              this.isScanned = true;
            }).catch((error) => {
              console.error("Error al actualizar can_disponibles:", error);
            });
          } else {
            console.log("Conductor no encontrado.");
          }
        });
      } else {
        console.log("No hay asientos disponibles.");
      }
    } else {
      console.log("Viaje no encontrado.");
    }
  });
}

  }
  

  joinTrip(){
    
  }
}