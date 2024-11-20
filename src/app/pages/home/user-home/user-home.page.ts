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

declare var google: any;

@Component({
  selector: "app-user-home",
  templateUrl: "./user-home.page.html",
  styleUrls: ["./user-home.page.scss"],
})
export class UserHomePage implements OnInit {
  /* ----- Obtener USUARIOS (Conductores disponibles) ------ */

  usuarios: any[] = [];
  usuario: any;
  nombreUsuario?: string;

  /* ----- Info del viaje SCANEADO ------ */

  public codigoEscaneado: string = "";
  viajeInfo: any;
  conductorInfo: any;
  vehiculoInfo: any;

  map: any;
  directionsService: any;
  directionsRenderer: any;

  /* ------- VIAJES ----------- */

  viajes?: any [] = [];

  private renderers: google.maps.DirectionsRenderer[] = [];

  /* ----- SCANNER ------ */

  isScanned: boolean = false;

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
    this.loadGoogleMaps().then(() => {
      this.initMap();
    });

    this.authService.getCurrentUser().subscribe((user) => {
      if (user && user.uid) {
        // Obtener los datos del usuario desde Firestore
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

  getViajes(){
    this.viajeService.getViajes().subscribe((viajes) => {
      this.viajes = viajes;
    })
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
    this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#242424", strokeWeight: 5 },
    });
    this.directionsRenderer.setMap(this.map);

    try {
      // Obtiene la ubicación actual del usuario usando Capacitor
      const position = await Geolocation.getCurrentPosition();
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Agrega el marcador de ubicación actual
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
      marker.addListener("click", () => infoWindow.open(this.map, marker));
    });

    // Configuración de manejo de error de geolocalización
    function handleLocationError(browserHasGeolocation: boolean, pos: any) {
      alert(
        browserHasGeolocation
          ? "Error: El servicio de geolocalización ha fallado."
          : "Error: Tu navegador no soporta la geolocalización."
      );
    }
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
    // Verificar si estamos en un entorno móvil
    const isMobile = !!(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i));
  
    if (isMobile) {
      // Entorno móvil: usar escáner QR real
      const modal = await this.modalController.create({
        component: BarcodeScanningModalComponent,
        cssClass: "barcode-scanner-modal",
        showBackdrop: false,
        componentProps: {
          formats: [], // Especificar formatos de código si es necesario
          LensFacing: LensFacing.Back,
        },
        presentingElement: await this.modalController.getTop(),
      });
  
      await modal.present();
  
      // Resultado del escaneo
      const { data } = await modal.onDidDismiss();
  
      if (data?.barcode?.displayValue) {
        this.codigoEscaneado = data.barcode.displayValue;
        console.log(`Código escaneado: ${this.codigoEscaneado}`);
      } else {
        console.log("No se escaneó ningún código.");
        return;
      }
    } else {
      // Entorno de desarrollo en PC: usar código simulado
      const codigoSimulado = "3kCrdwbCsOCs48EjSa0h"; // Reemplazar con un código válido de prueba
      this.codigoEscaneado = codigoSimulado;
      console.log(`Código simulado escaneado: ${this.codigoEscaneado}`);
    }
  
    // Buscar el viaje en Firebase usando el campo "codigo"
    this.firestore
      .collection("viajes", (ref) => ref.where("codigo", "==", this.codigoEscaneado))
      .get()
      .subscribe((querySnapshot) => {
        if (!querySnapshot.empty) {
          // Asumiendo que solo hay un viaje con este código
          const doc = querySnapshot.docs[0];
          this.viajeInfo = doc.data() as Viajes;
          console.log("Viaje encontrado:", this.viajeInfo);
  
          if (this.viajeInfo.can_disponibles > 0) {
            const conductorUid = this.viajeInfo.conductorUid;
            console.log("UID del conductor:", conductorUid);
  
            this.firestore
              .collection("usuarios")
              .doc(conductorUid)
              .get()
              .subscribe((conductorDoc) => {
                if (conductorDoc.exists) {
                  this.conductorInfo = conductorDoc.data();
  
                  const vehiculo = this.conductorInfo?.vehiculo;
                  if (vehiculo) {
                    console.log("Información del vehículo:", vehiculo);
                    const { marca, modelo, color, img_vehiculo, patente } = vehiculo;
                    this.vehiculoInfo = {
                      marca,
                      modelo,
                      color,
                      img_vehiculo,
                      patente,
                    };
                  } else {
                    console.log("El conductor no tiene un vehículo registrado.");
                  }
  
                  // Reducir asientos disponibles y agregar UID del pasajero
                  const updatedPasajeros = this.viajeInfo.pasajeros || [];
                  updatedPasajeros.push(this.usuario.uid); // Agregar UID del usuario escaneado
  
                  this.firestore
                    .collection("viajes")
                    .doc(doc.id) // Usar el ID del documento para actualizar
                    .update({
                      can_disponibles: this.viajeInfo.can_disponibles - 1,
                      pasajeros: updatedPasajeros, // Almacenar la lista de UIDs de pasajeros
                      activo: true, // Establecer el viaje como activo
                    })
                    .then(() => {
                      console.log("Información cargada correctamente");
                      this.isScanned = true;
  
                      // Generar ruta en el mapa
                      const inicio = JSON.parse(this.viajeInfo.coordenada_inicio || "{}");
                      const destino = JSON.parse(this.viajeInfo.coordenada_destino || "{}");
  
                      if (inicio && destino) {
                        this.generateRoute(inicio, destino);
                      } else {
                        console.log("Coordenadas de inicio o destino faltantes.");
                      }
                    })
                    .catch((error) => {
                      console.error("Error al actualizar los asientos disponibles:", error);
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
  


  // Helper function to generate the route on the map
  generateRoute(
    inicio: { lat: number; lng: number },
    destino: { lat: number; lng: number }
  ) {
    // Clear any previous routes
    this.renderers.forEach((renderer) => renderer.setMap(null));
    this.renderers = [];

    // Create route renderers
    const createRenderer = (color: string, weight: number, opacity: number) =>
      new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: color,
          strokeWeight: weight,
          strokeOpacity: opacity,
          geodesic: true,
        },
      });

    const walkingRenderer = createRenderer("#6C6C6C", 5, 0.7);
    const drivingRenderer = createRenderer("#373737", 6, 0.8);

    walkingRenderer.setMap(this.map);
    drivingRenderer.setMap(this.map);
    this.renderers.push(walkingRenderer, drivingRenderer);

    // Get current location and calculate the walking route to the start point
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const requestWalking: google.maps.DirectionsRequest = {
          origin: currentPos,
          destination: inicio,
          travelMode: google.maps.TravelMode.WALKING,
        };

        this.directionsService.route(
          requestWalking,
          (
            result: google.maps.DirectionsResult,
            status: google.maps.DirectionsStatus
          ) => {
            if (status === google.maps.DirectionsStatus.OK) {
              walkingRenderer.setDirections(result);
            } else {
              console.error("Walking route error:", status);
            }
          }
        );

        // Calculate the driving route from the start to the destination
        const requestDriving: google.maps.DirectionsRequest = {
          origin: inicio,
          destination: destino,
          travelMode: google.maps.TravelMode.DRIVING,
        };

        // Función para procesar y mostrar la duración
        const displayDuration = (
          result: google.maps.DirectionsResult,
          renderer: google.maps.DirectionsRenderer
        ) => {
          renderer.setDirections(result);
          const durationText =
            result.routes[0].legs[0].duration?.text ?? "Desconocido";
          const durationElement = document.getElementById("duration");
          if (durationElement) durationElement.innerText = durationText;
          console.log(`Tiempo estimado: ${durationText}`);
        };

        this.directionsService.route(
          requestDriving,
          (
            result: google.maps.DirectionsResult,
            status: google.maps.DirectionsStatus
          ) => {
            if (status === google.maps.DirectionsStatus.OK) {
              drivingRenderer.setDirections(result);
              displayDuration(result, walkingRenderer);
            } else {
              console.error("Driving route error:", status);
            }
          }
        );
      },
      () => console.error("Error retrieving current location.")
    );
  }
}
