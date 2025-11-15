
// Servicio para gestionar usuarios en Firestore
// Permite agregar usuarios y consultar usuarios por email en la base de datos de Firebase.

import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { UserData } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
    // Inyecta el servicio de Firestore
    constructor(private firestore: Firestore) { }

    /**
     * Agrega un nuevo usuario a la colección 'users' en Firestore
     * @param user Objeto con los datos del usuario
     * @returns Promesa con la referencia al documento creado
     */
    addUser(user: UserData) {
        const usersRef = collection(this.firestore, 'users');
        return addDoc(usersRef, user);
    }

    /**
     * Agrega un nuevo usuario usando su UID como ID del documento
     * @param uid ID único del usuario (de Firebase Auth)
     * @param user Objeto con los datos del usuario
     * @returns Promesa con la operación completada
     */
    addUserWithUid(uid: string, user: UserData) {
        const userDoc = doc(this.firestore, 'users', uid);
        return setDoc(userDoc, user);
    }

    /**
     * Busca un usuario por email en la colección 'users'
     * @param email Correo electrónico a buscar
     * @returns Promesa con el usuario encontrado o null si no existe
     */
    async getUserByEmail(email: string): Promise<UserData | null> {
        const usersRef = collection(this.firestore, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as UserData;
        }
        return null;
    }

    /**
     * Busca un usuario por UID en la colección 'users'
     * @param uid ID único del usuario
     * @returns Promesa con el usuario encontrado o null si no existe
     */
    async getUserByUid(uid: string): Promise<UserData | null> {
        const userDoc = doc(this.firestore, 'users', uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserData;
        }
        return null;
    }
}
