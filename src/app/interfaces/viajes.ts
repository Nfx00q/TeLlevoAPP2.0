export interface Viajes {
    codigo?: string;
    nom_destino?: string;
    nom_inicio?: string;
    fecha?: Date; 
    coordenada_inicio?: string;
    coordenada_destino?: string;
    costo_perperson?: string;

    patente?: string;
    can_disponibles?: number;

    nom_conductor?: string;
    conductorUid?: string;
}