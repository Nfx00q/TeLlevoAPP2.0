export interface Usuario {
    img_usuario?: string;
    nombre?: string;
    apellido?: string;
    rut?: string;
    telefono?: string;
    edad?: string;
    email?: string;
    pass?: string;
    tipo?: string;
    disabled?: boolean;

    activo?: boolean;

    vehiculo?: any;
}