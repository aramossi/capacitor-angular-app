/*
Estructura del proyecto (explicación dinámica):

/src
  /app
    /login/           // Componentes y estilos para la pantalla de login
    /register/        // Registro de usuarios
    /homedj/          // Dashboard y lógica para DJs
    /homepromotor/    // Dashboard para promotores (en mantenimiento o futuro)
    /homecliente/     // Dashboard para clientes (en mantenimiento o futuro)
    /dj-perfil/       // Perfil editable del DJ (avatar, datos, etc.)
    app.routes.ts     // Definición de rutas principales de la app
    app.module.ts     // Módulo raíz de Angular
    auth.service.ts   // Servicio de autenticación con Firebase
    user.service.ts   // Servicio para gestión de usuarios en Firestore
  /assets             // Imágenes, íconos y recursos estáticos
  /environments       // Configuración de entornos (dev, prod)
  index.html          // HTML principal de la app Angular
  main.ts             // Punto de entrada de la app Angular
  styles.css          // Estilos globales

/android              // Proyecto nativo Android generado por Capacitor
/ios                  // Proyecto nativo iOS generado por Capacitor
/capacitor.config.ts  // Configuración de Capacitor (plataformas, plugins, etc.)
/package.json         // Dependencias y scripts del proyecto
/firebase.json        // Configuración de Firebase Hosting y funciones
/README.md            // Documentación principal del proyecto

// Cada carpeta de componente contiene:
//   - .app.ts   // Lógica y controladores Angular
//   - .app.html // Plantilla HTML del componente
//   - .app.css  // Estilos específicos del componente

// El proyecto es modular y escalable, permitiendo agregar nuevas vistas o servicios fácilmente.
*/

import { Component, inject } from "@angular/core";
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserData } from '../models/user.model';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
@Component({
    standalone: true,
    styleUrls: ['./register.app.css'],
    templateUrl: './register.app.html',
    imports: [CommonModule, FormsModule]
})

export class RegisterPageApp {
    rucPromotor: string = '';
    rucPromotorInvalido: boolean = false;
    checkRucPromotor() {
        // RUC válido: 11 dígitos numéricos
        this.rucPromotorInvalido = !/^\d{11}$/.test(this.rucPromotor);
    }
    userType: 'dj' | 'cliente' | 'promotor' = 'dj';
    dniCliente: string = '';
    dniYaRegistrado: boolean = false;
    dniClienteInvalido: boolean = false;
    dniDj: string = '';
    dniDjYaRegistrado: boolean = false;
    dniDjInvalido: boolean = false;

    // Simulación de DNIs ya registrados
    private dnisRegistrados = ['12345678', '87654321', '11111111'];
    private dnisDjRegistrados = ['22222222', '33333333', '44444444'];

    email: string = '';
    password: string = '';
    confirm: string = '';
    errorMsg: string = '';

    successMsg: string = '';

    // Campos para datos adicionales
    nombre: string = '';
    apellido: string = '';
    distrito: string = '';
    provincia: string = '';
    departamento: string = '';
    empresa: string = '';
    direccion: string = '';

    private firestore = inject(Firestore);

    constructor(private router: Router, private authService: AuthService, private userService: UserService) { }

    setType(type: 'dj' | 'cliente' | 'promotor') {
        this.userType = type;
        this.dniYaRegistrado = false;
        this.dniCliente = '';
        this.dniDjYaRegistrado = false;
        this.dniDj = '';
    }

    checkDni() {
        this.dniYaRegistrado = this.dnisRegistrados.includes(this.dniCliente);
        this.dniClienteInvalido = !/^\d{8}$/.test(this.dniCliente);
    }

    checkDniDj() {
        this.dniDjYaRegistrado = this.dnisDjRegistrados.includes(this.dniDj);
        this.dniDjInvalido = !/^\d{8}$/.test(this.dniDj);
    }

    onRegister(event: Event) {
        event.preventDefault();
        this.errorMsg = '';
        this.successMsg = '';
        if (!this.email || !this.password || !this.confirm) {
            this.errorMsg = 'Completa todos los campos.';
            return;
        }
        if (this.password !== this.confirm) {
            this.errorMsg = 'Contraseña y Confirmar contraseña deben ser iguales.';
            return;
        }
        this.authService.register(this.email, this.password)
            .then((cred) => {
                // Guardar datos adicionales en Firestore usando el UID como ID del documento
                let userData: UserData = {
                    email: this.email,
                    tipo: this.userType,
                };
                if (this.userType === 'dj') {
                    userData = {
                        ...userData,
                        nombre: this.nombre,
                        apellido: this.apellido,
                        dni: this.dniDj,
                        distrito: this.distrito,
                        provincia: this.provincia,
                        departamento: this.departamento
                    };
                } else if (this.userType === 'cliente') {
                    userData = {
                        ...userData,
                        nombre: this.nombre,
                        apellido: this.apellido,
                        dni: this.dniCliente,
                        distrito: this.distrito,
                        provincia: this.provincia,
                        departamento: this.departamento
                    };
                } else if (this.userType === 'promotor') {
                    userData = {
                        ...userData,
                        empresa: this.empresa,
                        direccion: this.direccion,
                        ruc: this.rucPromotor
                    };
                }
                // Guardar con el UID del usuario autenticado como ID del documento
                const uid = cred.user.uid;
                return this.userService.addUserWithUid(uid, userData).then(async () => {
                    // Si es DJ, inicializar sus colecciones de calendario y paquetes
                    if (this.userType === 'dj') {
                        // Crear documento de calendario vacío
                        const calDoc = doc(this.firestore, 'calendarios', uid);
                        await setDoc(calDoc, { estadosDias: {} });

                        // Crear documento de paquetes con paquetes por defecto
                        const packDoc = doc(this.firestore, 'paquetes', uid);
                        await setDoc(packDoc, {
                            paquetes: [
                                { icon: '🎵', titulo: 'Standard Wedding Package', descripcion: 'Paquete completo para bodas', precio: '$1,200' },
                                { icon: '🎧', titulo: 'Club Night', descripcion: 'Música para discotecas', precio: '$800' },
                                { icon: '🏢', titulo: 'Corporate Event', descripcion: 'Eventos corporativos', precio: '$1,500' }
                            ]
                        });
                    }
                });
            })
            .then(() => {
                this.successMsg = '¡Usuario registrado correctamente!';
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, 1500);
            })
            .catch(err => {
                // Mostrar mensaje de error de Firebase de forma amigable
                if (err && typeof err === 'object') {
                    if (err.code === 'auth/email-already-in-use') {
                        this.errorMsg = 'El correo ya está registrado.';
                    } else if (err.code === 'auth/invalid-email') {
                        this.errorMsg = 'El correo no es válido.';
                    } else if (err.code === 'auth/weak-password') {
                        this.errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
                    } else {
                        this.errorMsg = 'Error al registrar usuario. Intenta con otros datos.';
                    }
                } else {
                    this.errorMsg = 'Error al registrar usuario. Intenta con otros datos.';
                }
            });
    }

    goToLogin(event: Event) {
        event.preventDefault();
        this.router.navigate(['/']);
    }
}
