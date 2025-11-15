
// Servicio de autenticación con Firebase
// Este servicio centraliza el registro, login y logout de usuarios usando Firebase Auth.

import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
    // Inyecta el servicio de autenticación de Firebase
    constructor(private auth: Auth) { }

    /**
     * Registra un usuario nuevo en Firebase Auth
     * @param email Correo electrónico del usuario
     * @param password Contraseña del usuario
     * @returns Promesa con las credenciales del usuario creado
     */
    register(email: string, password: string): Promise<UserCredential> {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    /**
     * Inicia sesión con email y contraseña
     * @param email Correo electrónico
     * @param password Contraseña
     * @returns Promesa con las credenciales del usuario logueado
     */
    login(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    /**
     * Cierra la sesión del usuario actual
     * @returns Promesa que se resuelve al cerrar sesión
     */
    logout(): Promise<void> {
        return signOut(this.auth);
    }
}
