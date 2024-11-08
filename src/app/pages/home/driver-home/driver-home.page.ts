import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Usuario } from 'src/app/interfaces/usuario';
import { Viajes } from 'src/app/interfaces/viajes';
import { ViajesService } from 'src/app/services/viejes.service';

import { QRCodeModule } from 'angularx-qrcode';

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

  /* ------ USUARIO ------ */

  usuarioLogin?: string;
  usuarios: Usuario[] = [];

  /* -------- RENDER -------- */

  private renderers: any[] = [];

  public nombreUsuario?: string;
  public apellidoUsuario?: string;
  public img_usuario?: string;
  
  ubicaciones = [
    { lat: -33.598425578019224, lng: -70.57833859675443, icon: 'assets/icon/instituto.png', label: 'Cede Puente Alto', value: 'puente_alto' },
    { lat: -33.66860553928277, lng: -70.58535175998844, icon: 'assets/icon/instituto.png', label: 'Cede Pirque', value: 'pirque' },
    { lat: -33.5800609330941, lng: -70.58197464104566, icon: 'assets/icon/stop.png', label: 'TL-1 / Av. Gabriela & Av. Concha y Toro', value: 'tl1' },
    { lat: -33.57426112502435, lng: -70.55495967884225, icon: 'assets/icon/stop.png', label: 'TL-2 / Av. Gabriela Ote. & Av. Camilo Henriquez', value: 'tl2' },
    { lat: -33.56692284768454, lng: -70.63052933119687, icon: 'assets/icon/stop.png', label: 'TL-3 / Av. Observatorio & Av. Sta. Rosa', value: 'tl3' },
  ];

  qrViaje: string = '';

  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private viajesService: ViajesService,
    private QrCodeModule: QRCodeModule) { }

  ngAfterViewInit(){}

  ngOnInit() {
    this.usuarioLogin = localStorage.getItem('usuarioLogin') || '';
    this.config();
    this.loadGoogleMaps().then(() => {
      this.initMap();
    });
  }

  /* ----- Subscripción a la COLECCION DE USUARIOS -----*/

  config() {
    this.firestore.collection('usuarios').valueChanges().subscribe((usuarios: any[]) => {
      this.usuarios = usuarios;
      const usuarioEncontrado = this.usuarios.find((usuario) => usuario.email === this.usuarioLogin);
      if (usuarioEncontrado) {
        this.nombreUsuario = usuarioEncontrado.nombre;
        this.apellidoUsuario = usuarioEncontrado.apellido;
        this.img_usuario = usuarioEncontrado.img_usuario;
      }
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


  /* ----- INICIAR VIAJE ----- */

  startTrip() {
    if (this.ubicacionInicio && this.ubicacionDestino) {
      const inicio = this.ubicaciones.find((ubicacion) => ubicacion.value === this.ubicacionInicio);
      const destino = this.ubicaciones.find((ubicacion) => ubicacion.value === this.ubicacionDestino);
  
      if (inicio && destino) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
  
            // Clear previous routes
            this.renderers.forEach((renderer) => renderer.setMap(null));
            this.renderers = [];
  
            // Route from user's current location to starting point (Walking)
          const request1 = {
            origin: pos,
            destination: { lat: inicio.lat, lng: inicio.lng },
            travelMode: google.maps.TravelMode.WALKING,
          };

          // Route from starting point to destination (Driving)
          const request2 = {
            origin: { lat: inicio.lat, lng: inicio.lng },
            destination: { lat: destino.lat, lng: destino.lng },
            travelMode: google.maps.TravelMode.DRIVING,
          };

          this.directionsService.route(request1, (result: any, status: any) => {
            if (status === google.maps.DirectionsStatus.OK) {
              // Render the walking route
              const walkingRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#242424',
                  strokeWeight: 6,
                },
              });
              walkingRenderer.setMap(this.map);
              walkingRenderer.setDirections(result);

              // Calculate the route for the vehicle and show duration
              this.directionsService.route(request2, (result2: any, status2: any) => {
                if (status2 === google.maps.DirectionsStatus.OK) {
                  const drivingRenderer = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: '#000000',
                      strokeWeight: 6,
                    },
                  });
                  drivingRenderer.setMap(this.map);
                  drivingRenderer.setDirections(result2);

                  // Access estimated time
                  const duration = result2.routes[0].legs[0].duration;
                  const durationText = duration.text;

                  // Display the estimated time in your HTML element with ID 'duration'
                  const durationElement = document.getElementById('duration');
                  if (durationElement) {
                    durationElement.innerText = `Estimated travel time: ${durationText}`;
                  }
                  console.log(`Estimated travel time: ${durationText}`);
                } else {
                  console.error('Error calculating route from starting point to destination', status2);
                }
              });
            } else {
              console.error('Error calculating route from current location to starting point', status);
            }
          });
  
            // Create two instances of DirectionsRenderer
            const walkingRenderer = new google.maps.DirectionsRenderer({
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: 'rgba(0,0,0,0)',
                strokeWeight: 6,
                strokeOpacity: 0.7,
                geodesic: true,
                icons: [{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 2,
                    fillColor: '#242424',
                    fillOpacity: 1,
                    strokeColor: '#242424',
                    strokeOpacity: 1
                  },
                  offset: '0%',
                  repeat: '8px'
                }]
              }
            });
  
            const drivingRenderer = new google.maps.DirectionsRenderer({
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#000000',
                strokeWeight: 6,
                strokeOpacity: 0.7,
                geodesic: true,
              }
            });
  
            // Set map for each renderer
            walkingRenderer.setMap(this.map);
            drivingRenderer.setMap(this.map);
  
            // Store the renderers in the array
            this.renderers.push(walkingRenderer);
            this.renderers.push(drivingRenderer);
  
            // Calculate the first route
            this.directionsService.route(request1, (result: any, status: any) => {
              if (status === google.maps.DirectionsStatus.OK) {
                walkingRenderer.setDirections(result);
              } else {
                console.error('Error calculating route from current location to starting point', status);
              }
            });
  
            // Calculate the route for the vehicle
            this.directionsService.route(request2, (result: any, status: any) => {
              if (status === google.maps.DirectionsStatus.OK) {
                this.directionsRenderer.setDirections(result);
  
                // Access estimated time
                const duration = result.routes[0].legs[0].duration;
                const durationText = duration.text;
  
                // Get the element and check if it exists
                const durationElement = document.getElementById('duration');
                if (durationElement) {
                  durationElement.innerText = durationText;
                } else {
                  console.error('Element with ID "duration" not found.');
                }
  
                console.log(`Estimated travel time: ${durationText}`);
  
                this.directionsRenderer.setOptions({
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#000000',
                    strokeWeight: 6,
                    strokeOpacity: 0.7,
                    geodesic: true,
                    icons: [{
                      icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 2,
                        fillColor: '#000000',
                        fillOpacity: 1,
                        strokeColor: '#000000',
                        strokeOpacity: 1
                      },
                      offset: '0%',
                      repeat: '20px'
                    }]
                  }
                });
              } else {
                console.error('Error calculating route from starting point to destination', status);
              }
            });
  
            // Save trip to Firebase
            const nuevoViaje: Viajes = {
              codigo: this.viajesService.generarCodigoUnico(),
              nom_destino: destino.label,
              nom_inicio: inicio.label,
              fecha: new Date().toISOString(),
              coordenada: JSON.stringify(pos),
              coordenada_destino: JSON.stringify({ lat: destino.lat, lng: destino.lng }),
              costo_perperson: this.costoViaje
            };
  
            console.log(`Trip created successfully. Trip code: ${this.codigoViaje}`);
  
            // Subscribe to the Observable to save in Firebase and update the trip code
            this.viajesService.crearViaje(nuevoViaje).subscribe({
              next: (codigo) => {
                this.codigoViaje = codigo; // Update with the returned code
                console.log(`Trip created successfully. Trip code: ${this.codigoViaje}`);
                this.qrViaje = this.codigoViaje; // Now the QR will reflect the correct code
              },
              error: (error) => {
                console.error('Error saving the trip:', error);
              },
            });
            
          },
          () => {
            console.error('Error getting current location.');
          }
        );
      } else {
        console.log('Please select both locations.');
      }
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

}
