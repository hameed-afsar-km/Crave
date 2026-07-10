import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = '/gsi-client.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export async function signInWithGoogle(): Promise<{ uid: string; displayName: string; email: string; phoneNumber: string }> {
  await loadGIS();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google Client ID not configured');
  if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services not available');

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      callback: async (tokenResponse) => {
        if (!tokenResponse.access_token) {
          reject(new Error(tokenResponse.error || 'Google sign-in was cancelled'));
          return;
        }
        try {
          const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
          const result = await signInWithCredential(auth, credential);
          const u = result.user;
          resolve({
            uid: u.uid,
            displayName: u.displayName || 'Google User',
            email: u.email || '',
            phoneNumber: u.phoneNumber || '',
          });
        } catch (err) {
          reject(err);
        }
      },
    });
    client.requestAccessToken();
  });
}
