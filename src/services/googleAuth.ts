import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
];

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedCustomUser: User | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else if (cachedCustomUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(cachedCustomUser, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      cachedCustomUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in using Google Identity Services (GIS) Token Client.
 * GIS communicates directly with Google OAuth without passing through
 * Firebase Auth's iframe handler, bypassing auth/unauthorized-domain when allowed.
 */
export const signInWithGIS = async (): Promise<{ user: User; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no está disponible en este momento.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const token = tokenResponse.access_token;
          if (!token) {
            reject(new Error('No se recibió token de acceso de Google Identity Services'));
            return;
          }

          try {
            // Fetch profile info from Google UserInfo endpoint
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const profile = profileRes.ok ? await profileRes.json() : {};

            const userObj = {
              uid: profile.sub || 'google-user',
              email: profile.email || 'usuario@gmail.com',
              displayName: profile.name || profile.email || 'Usuario Google',
              photoURL: profile.picture || null,
            } as unknown as User;

            cachedAccessToken = token;
            cachedCustomUser = userObj;
            resolve({ user: userObj, accessToken: token });
          } catch (profileErr) {
            const fallbackUser = {
              uid: 'google-user',
              email: 'usuario@gmail.com',
              displayName: 'Usuario Google',
              photoURL: null,
            } as unknown as User;

            cachedAccessToken = token;
            cachedCustomUser = fallbackUser;
            resolve({ user: fallbackUser, accessToken: token });
          }
        },
        error_callback: (err: any) => {
          reject(err);
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (clientErr) {
      reject(clientErr);
    }
  });
};

/**
 * Allows entering or injecting a manual OAuth Access Token (e.g. from Google OAuth Playground
 * or command line) for immediate testing without domain blocks.
 */
export const setManualAccessToken = async (token: string): Promise<{ user: User; accessToken: string }> => {
  const cleanToken = token.trim();
  if (!cleanToken) throw new Error('El token ingresado está vacío');

  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    
    let userObj: User;
    if (profileRes.ok) {
      const profile = await profileRes.json();
      userObj = {
        uid: profile.sub || 'manual-token-user',
        email: profile.email || 'sapaser@gmail.com',
        displayName: profile.name || profile.email || 'Administrador AMAP',
        photoURL: profile.picture || null,
      } as unknown as User;
    } else {
      userObj = {
        uid: 'manual-token-user',
        email: 'sapaser@gmail.com',
        displayName: 'Administrador AMAP',
        photoURL: null,
      } as unknown as User;
    }

    cachedAccessToken = cleanToken;
    cachedCustomUser = userObj;
    return { user: userObj, accessToken: cleanToken };
  } catch (err) {
    const fallbackUser = {
      uid: 'manual-token-user',
      email: 'sapaser@gmail.com',
      displayName: 'Administrador AMAP',
      photoURL: null,
    } as unknown as User;
    cachedAccessToken = cleanToken;
    cachedCustomUser = fallbackUser;
    return { user: fallbackUser, accessToken: cleanToken };
  }
};

/**
 * Standard Google Sign-In with automatic fallback handling
 */
export const googleSignIn = async (
  forceReconsent = false
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    if (forceReconsent) {
      provider.setCustomParameters({
        prompt: 'select_account consent',
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google con los permisos solicitados');
    }

    cachedAccessToken = credential.accessToken;
    cachedCustomUser = null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Firebase Auth:', error);

    const isUnauthorizedDomain =
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('unauthorized-domain') ||
      error?.message?.includes('auth/unauthorized-domain');

    if (isUnauthorizedDomain) {
      // Try GIS automatically if available
      if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        try {
          console.info('Intentando conexión alternativa con Google Identity Services (GIS)...');
          const gisResult = await signInWithGIS();
          return gisResult;
        } catch (gisErr: any) {
          console.warn('GIS también falló o fue cancelado:', gisErr);
        }
      }

      // Format clean, descriptive error with domain context
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      const domainError: any = new Error(
        `Firebase requiere autorizar el dominio actual (${currentHost}) en la consola de Firebase.`
      );
      domainError.code = 'auth/unauthorized-domain';
      domainError.hostname = currentHost;
      domainError.settingsUrl = FIREBASE_SETTINGS_URL;
      domainError.projectId = FIREBASE_PROJECT_ID;
      domainError.originalError = error;
      throw domainError;
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore signout error if signed in via GIS
  }
  cachedAccessToken = null;
  cachedCustomUser = null;
};
