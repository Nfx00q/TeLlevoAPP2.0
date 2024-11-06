import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BarcodeScanner, ScanResult } from '@capacitor-mlkit/barcode-scanning';
import { Geolocation } from '@capacitor/geolocation';
import { Viajes } from 'src/app/interfaces/viajes';

declare var google: any;

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.page.html',
  styleUrls: ['./user-home.page.scss'],
})

export class UserHomePage implements OnInit {

  /* ----- Info del viaje SCANEADO ------ */

  public codigoEscaneado: string = '';
  viajeInfo: any;

  map: any;
  directionsService: any;
  directionsRenderer: any;

  ubicaciones = [
    { lat: -33.598425578019224, lng: -70.57833859675443, icon: 'assets/icon/instituto.png', label: 'Cede Puente Alto' },
    { lat: -33.66860553928277, lng: -70.58535175998844, icon: 'assets/icon/instituto.png', label: 'Cede Pirque' },
    { lat: -33.5800609330941, lng: -70.58197464104566, icon: 'assets/icon/stop.png', label: 'TL-1 / Av. Gabriela & Av. Concha y Toro' },
    { lat: -33.57426112502435, lng: -70.55495967884225, icon: 'assets/icon/stop.png', label: 'TL-2 / Av. Gabriela Ote. & Av. Camilo Henriquez' },
    { lat: -33.56692284768454, lng: -70.63052933119687, icon: 'assets/icon/stop.png', label: 'TL-3 / Av. Observatorio & Av. Sta. Rosa' },
  ]

  constructor(private router: Router, private firestore: AngularFirestore) { }

  ngOnInit() {
    this.loadGoogleMaps().then(() => {
      this.initMap();
    });
  }

  ngAfterViewInit() { }

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

    this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    this.directionsRenderer.setMap(this.map);

    try {
      const position = await Geolocation.getCurrentPosition();
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };

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
      marker.addListener('click', () => infoWindow.open(this.map, marker));
    });
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
    
  }
}