/**
 * @file FirebaseAuthContext.tsx
 * @description Context per la gestione dell'autenticazione Firebase con VS Code
 * @version 1.1.0
 * Implementa il pattern Union Dispatcher Type-Safe
 */

import { User, getAuth, signInWithCustomToken, signOut } from "firebase/auth"
import { initializeApp } from "firebase/app"
import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useExtensionMessage } from "../hooks/useExtensionMessage"
import { AuthMessageType } from '@shared/messages'
import type { AuthMessageUnion, AuthStateChangedMessage, RequestAuthTokenMessage, SignOutMessage, SimplifiedUser } from '@shared/messages'
import { isAuthCallbackMessage, isAuthErrorMessage, isAuthSignedOutMessage } from '@shared/types/auth-message-guards'

// Firebase configuration from extension
const firebaseConfig = {
	apiKey: "AIzaSyDcXAaanNgR2_T0dq2oOl5XyKPksYHppVo",
	authDomain: "jarvis-ide.firebaseapp.com",
	projectId: "jarvis-ide",
	storageBucket: "jarvis-ide.firebasestorage.app",
	messagingSenderId: "364369702101",
	appId: "1:364369702101:web:0013885dcf20b43799c65c",
	measurementId: "G-MDPRELSCD1",
}

interface FirebaseAuthContextType {
	user: User | null
	isInitialized: boolean
	signInWithToken: (token: string) => Promise<void>
	handleSignOut: () => Promise<void>
	requestAuthToken: (provider?: string) => void
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [isInitialized, setIsInitialized] = useState(false)
	const { postMessage } = useExtensionMessage()

	// Initialize Firebase
	const app = initializeApp(firebaseConfig)
	const auth = getAuth(app)

	/**
	 * Trasforma l'utente Firebase in un oggetto semplificato per l'estensione
	 */
	const simplifyUser = (user: User | null): SimplifiedUser | null => {
		if (!user) return null
		return {
			displayName: user.displayName,
			email: user.email,
			photoURL: user.photoURL,
		}
	}

	/**
	 * Dispatcher di messaggi type-safe per gestire i messaggi in arrivo
	 */
	const messageDispatcher = useCallback((message: any) => {
		// Implementazione del pattern Union Dispatcher Type-Safe
		if (isAuthCallbackMessage(message)) {
			signInWithToken((msg.payload as unknown).customToken).catch(error => {
				console.error("Error signing in with custom token:", error)
			})
		} else if (isAuthErrorMessage(message)) {
			console.error("Authentication error:", (msg.payload as unknown).error)
		} else if (isAuthSignedOutMessage(message)) {
			console.log("Successfully signed out")
		}
	}, []);

	// Handle auth state changes
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setUser(user)
			setIsInitialized(true)

			// Sync auth state with extension - now using type-safe messaging
			const stateMessage: AuthStateChangedMessage = {
				type: AuthMessageType.AUTH_STATE_CHANGED,
				payload: {
					user: simplifyUser(user)
				}
			}
			postMessage<AuthMessageUnion>(stateMessage)
		})

		return () => unsubscribe()
	}, [auth, postMessage])

	/**
	 * Richiede un token di autenticazione dall'estensione
	 */
	const requestAuthToken = useCallback((provider?: string) => {
		const message: RequestAuthTokenMessage = {
			type: AuthMessageType.REQUEST_AUTH_TOKEN,
			payload: provider ? { provider } : undefined
		}
		postMessage<AuthMessageUnion>(message)
	}, [postMessage])

	/**
	 * Esegue l'accesso con il token personalizzato
	 */
	const signInWithToken = useCallback(
		async (token: string) => {
			try {
				await signInWithCustomToken(auth, token)
				console.log("Successfully signed in with custom token")
			} catch (error) {
				console.error("Error signing in with custom token:", error)
				throw error
			}
		},
		[auth],
	)

	// Listen for auth callback from extension
	useEffect(() => {
		// Configurazione del listener per i messaggi dall'estensione
		const handleMessage = (event: MessageEvent<any>) => {
			const message = event.data
			messageDispatcher(message)
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [messageDispatcher])

	/**
	 * Gestisce il logout
	 */
	const handleSignOut = useCallback(async () => {
		try {
			// Invia messaggio di logout all'estensione
			const message: SignOutMessage = {
				type: AuthMessageType.SIGN_OUT,
				payload: undefined
			}
			postMessage<AuthMessageUnion>(message)
			// Esegue logout da Firebase
			await signOut(auth)
			console.log("Successfully signed out of Firebase")
		} catch (error) {
			console.error("Error signing out of Firebase:", error)
			throw error
		}
	}, [auth, postMessage])

	return (
		<FirebaseAuthContext.Provider value={{ 
			user, 
			isInitialized, 
			signInWithToken, 
			handleSignOut, 
			requestAuthToken 
		}}>
			{children}
		</FirebaseAuthContext.Provider>
	)
}

export const useFirebaseAuth = () => {
	const context = useContext(FirebaseAuthContext)
	if (context === undefined) {
		throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider")
	}
	return context
}
