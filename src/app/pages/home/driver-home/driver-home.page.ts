/// <reference types="@types/google.maps" />

import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Usuario } from 'src/app/interfaces/usuario';
import { Viajes } from 'src/app/interfaces/viajes';
import { ViajesService } from 'src/app/services/viejes.service';

import { QRCodeModule } from 'angularx-qrcode';
import { AuthServiceService } from 'src/app/services/auth-service.service';

declare var google: any;

@Component({
  selector: 'app-driver-home',
  templateUrl: './driver-home.page.html',
  styleUrls: ['./driver-home.page.scss'],
})

export class DriverPage implements OnInit, AfterViewInit {

  /* ----- MAPA ----- */

  map: any;
  directionsService: any;
  directionsRenderer: any;

  /*----UBICACION-------*/

  
  ubicacionInicio: string | null = null;
  ubicacionDestino: string | null = null;

  /* ---- VIAJE ---- */

  costoViaje: string = '';
  codigoViaje: string = '';

  viajeActivo: any = null;
  public pasajerosInfo: Usuario[] = [];

  /* ------ USUARIO ------ */

  usuarioLogin?: string;
  usuario: any;

  /* -------- DATOS USER -------- */

  nombreUsuario?: string;

  /* ------------ RENDER ------------- */

  private renderers: any[] = [];

  /* ----------- CARGA DE CREACION DE VIAJE -------------- */

  isDivVisible = false;
  
  ubicaciones = [
    { lat: -33.598425578019224, lng: -70.57833859675443, icon: 'assets/icon/instituto.png', label: 'Cede Puente Alto', value: 'puente_alto', title: 'Duoc UC' },
    { lat: -33.66860553928277, lng: -70.58535175998844, icon: 'assets/icon/instituto.png', label: 'Cede Pirque', value: 'pirque', title: 'Duoc UC' },
    { lat: -33.5800609330941, lng: -70.58197464104566, icon: 'assets/icon/stop.png', label: 'TL-1 / Av. Gabriela & Av. Concha y Toro', value: 'tl1', title: 'TL-1' },
    { lat: -33.57426112502435, lng: -70.55495967884225, icon: 'assets/icon/stop.png', label: 'TL-2 / Av. Gabriela Ote. & Av. Camilo Henriquez', value: 'tl2', title: 'TL-2' },
    { lat: -33.56692284768454, lng: -70.63052933119687, icon: 'assets/icon/stop.png', label: 'TL-3 / Av. Observatorio & Av. Sta. Rosa', value: 'tl3', title: 'TL-3' },
  ];

  qrViaje: string = '';

  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private viajesService: ViajesService,
    private authService: AuthServiceService) { }

  ngAfterViewInit(){
    // Obtener el usuario autenticado
    this.authService.getCurrentUser().subscribe(user => {
      if (user && user.uid) {
        // Obtener los datos del usuario desde Firestore
        this.authService.getUserData(user.uid).subscribe(userData => {
          this.usuario = userData;
          this.nombreUsuario = userData?.nombre
        });
      } else {
        console.error("No se encontró un usuario autenticado.");
      }
    });
  }

  ngOnInit() {
    this.usuarioLogin = localStorage.getItem('usuarioLogin') || '';
    this.loadGoogleMaps().then(() => {
      this.initMap();
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
            title: ubicacion.title,
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
  


  /* ----- INICIAR VIAJE ----- */

  startTrip() {
    if (this.ubicacionInicio && this.ubicacionDestino) {
        const inicio = this.ubicaciones.find((ubicacion) => ubicacion.value === this.ubicacionInicio);
        const destino = this.ubicaciones.find((ubicacion) => ubicacion.value === this.ubicacionDestino);

        if (inicio && destino) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = { lat: position.coords.latitude, lng: position.coords.longitude };

                    // Limpiar rutas anteriores
                    this.renderers.forEach(renderer => renderer.setMap(null));
                    this.renderers = [];

                    // Configurar renderers de rutas con opciones personalizadas
                    const createRenderer = (color: string, weight: number, opacity: number) => new google.maps.DirectionsRenderer({
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: color,  // Color de la línea
                            strokeWeight: weight,  // Grosor de la línea
                            strokeOpacity: opacity,  // Opacidad de la línea
                            geodesic: true  // Línea geodésica
                        }
                    });
                    
                    const walkingRenderer = createRenderer('#6C6C6C', 5, 0.7); // Ruta caminando con color gris oscuro, grosor 5 y opacidad 0.7
                    const drivingRenderer = createRenderer('#373737', 6, 0.8); // Ruta en coche con color azul, grosor 6 y opacidad 0.8
                    
                    walkingRenderer.setMap(this.map);
                    drivingRenderer.setMap(this.map);
                    this.renderers.push(walkingRenderer, drivingRenderer);

                    // Solicitudes de rutas
                    const requestWalking: google.maps.DirectionsRequest = {
                        origin: pos,  // Ubicación actual del usuario
                        destination: { lat: inicio.lat, lng: inicio.lng },  // Marcador de inicio
                        travelMode: google.maps.TravelMode.WALKING  // Ruta a pie
                    };

                    const requestDriving: google.maps.DirectionsRequest = {
                        origin: { lat: inicio.lat, lng: inicio.lng },  // Marcador de inicio
                        destination: { lat: destino.lat, lng: destino.lng },  // Marcador de destino
                        travelMode: google.maps.TravelMode.DRIVING  // Ruta en coche
                    };

                    // Función para procesar y mostrar la duración
                    const displayDuration = (result: google.maps.DirectionsResult, renderer: google.maps.DirectionsRenderer) => {
                        renderer.setDirections(result);
                        const durationText = result.routes[0].legs[0].duration?.text ?? 'Desconocido';
                        const durationElement = document.getElementById('duration');
                        if (durationElement) durationElement.innerText = durationText;
                        console.log(`Tiempo estimado: ${durationText}`);
                    };

                    // Calcular y mostrar rutas
                    this.directionsService.route(requestWalking, (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            displayDuration(result, walkingRenderer);
                        } else {
                            console.error('Error en ruta caminando', status);
                        }
                    });

                    this.directionsService.route(requestDriving, (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            displayDuration(result, drivingRenderer);
                        } else {
                            console.error('Error en ruta conduciendo', status);
                        }
                    });

                    // Guardar el viaje en Firebase
                    const nuevoViaje: Viajes = {
                        codigo: this.viajesService.generarCodigoUnico(),
                        nom_destino: destino.label,
                        nom_inicio: inicio.label,
                        fecha: new Date(),
                        coordenada_inicio: JSON.stringify(pos),
                        coordenada_destino: JSON.stringify({ lat: destino.lat, lng: destino.lng }),
                        costo_perperson: this.costoViaje,
                        nom_conductor: this.usuario.nombre,
                        conductorUid: this.usuario.uid,
                        can_disponibles: 4,
                        activo: true
                    };

                    // Guardar el viaje como activo
                    this.viajeActivo = nuevoViaje;

                    this.viajesService.crearViaje(nuevoViaje).subscribe({
                        next: (codigo) => {
                            this.codigoViaje = codigo;
                            this.qrViaje = codigo;
                            this.toggleCarga();
                            setTimeout(() => {
                              this.abrirModalViaje();
                              this.toggleCarga();
                            }, 3000);
                        },
                        error: (error) => console.error('Error al guardar el viaje:', error)
                    });
                },
                () => console.error('Error obteniendo la ubicación actual.')
            );
        } else {
            console.log('Por favor, selecciona ambas ubicaciones.');
        }
    }
  }

  endTrip() {
    if (this.viajeActivo) {
      console.log('Finalizando viaje con código:', this.viajeActivo.codigo);
  
      this.viajesService.actualizarViajePorCodigo(this.viajeActivo.codigo, { activo: false }).subscribe({
        next: () => {
          console.log('Viaje finalizado con éxito.');
          this.viajeActivo = null; // Reinicia el estado del viaje activo
        },
        error: (error) => {
          console.error('Error al finalizar el viaje:', error.message || error);
        },
      });
    } else {
      console.error('No hay un viaje activo para finalizar.');
    }
  }
  

  /* ---- COSTO VIAJE ------ */

  formatCurrency(event: any) {
    // Solo permite números
    let input = event.target.value.replace(/\D/g, '');
    
    // Aplica formato chileno
    this.costoViaje = input ? `$ ${new Intl.NumberFormat('es-CL').format(Number(input))}` : '';
  }

  preventNonNumeric(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Permite solo números (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onInicioChange() {
    if (this.ubicacionDestino === this.ubicacionInicio) {
      this.ubicacionDestino = null;
    }
  }

  getOpcionesDestino() {
    return this.ubicaciones.filter(ubicacion => ubicacion.value !== this.ubicacionInicio);
  }

  goToConfig() {
    this.router.navigate(['/config-page']);
  }

  /* -------- MODAL DE VIAJE ----------- */

  @ViewChild('modalViajeActivo') modalViajeActivo: HTMLIonModalElement | undefined;

  // Método para abrir el modal
  abrirModalViaje() {
    this.loadPassengersInfo();
    if (this.modalViajeActivo) {
      this.modalViajeActivo.present();
    }
  }

  // Método para cerrar el modal
  cerrarModalViaje() {
    if (this.modalViajeActivo) {
      this.modalViajeActivo.dismiss();
    }
  }

  // CARGA DE CREACION DE VIAJE

  toggleCarga() {
    this.isDivVisible = !this.isDivVisible;
  }

  loadPassengersInfo() {
    // Asegúrate de que viajeActivo y su campo 'pasajeros' estén definidos
    if (this.viajeActivo?.pasajeros) {
      this.pasajerosInfo = []; // Limpia el array antes de cargar los pasajeros
  
      // Itera sobre cada UID en el mapa 'pasajeros'
      Object.keys(this.viajeActivo.pasajeros).forEach(uid => {
        this.firestore.collection("usuarios").doc(uid).get().subscribe((doc) => {
          if (doc.exists) {
            this.pasajerosInfo.push(doc.data() as Usuario);
          } else {
            console.error(`No se encontró el usuario con UID: ${uid}`);
          }
        }, (error) => {
          console.error("Error al obtener la información del pasajero:", error);
        });
      });
    } else {
      console.log("No hay pasajeros asignados al viaje.");
    }
  }
}
