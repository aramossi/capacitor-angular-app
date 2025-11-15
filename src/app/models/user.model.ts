// Interfaces para tipar los datos de usuario en el proyecto

export interface UserData {
    id?: string;
    email: string;
    tipo: 'dj' | 'cliente' | 'promotor';
    nombre?: string;
    apellido?: string;
    dni?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    ruc?: string;
    razonSocial?: string;
    empresa?: string;
    direccion?: string;
    nombreArtistico?: string;
    descripcion?: string;
    generos?: string[];
    rider?: string;
    avatar?: string;
}

export interface CalendarDay {
    num: number;
    key: string;
}

export interface Paquete {
    icon?: string;
    titulo?: string;
    nombre?: string;
    descripcion?: string;
    precio: string | number;
}

export interface Notificacion {
    id?: string;
    nombreCliente?: string;
    telefono?: string;
    mensaje?: string;
    fecha?: Date;
    leido?: boolean;
}
