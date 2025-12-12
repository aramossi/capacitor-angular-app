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

export interface CalendarDayData {
    num: number;
    key: string;
}

export interface Solicitud {
    id?: string;
    djId?: string;
    nombreCliente?: string;
    empresa?: string;
    tipoEvento?: string;
    fechaEvento?: string;
    lugarEvento?: string;
    presupuesto?: string;
    horaInicio?: string;
    horaFin?: string;
    personasEstimadas?: string;
    detallesEvento?: string;
    telefono?: string;
    fecha?: any;
    leido?: boolean;
    tipoSolicitud?: string;
}

export interface Evento {
    id: string;
    fecha: string;
    persona: string;
    telefono: string;
    direccion?: string;
    descripcion?: string;
}

export interface AgendaGuardada {
    fecha?: string;
    persona: string;
    telefono: string;
    direccion?: string;
    descripcion: string;
}
