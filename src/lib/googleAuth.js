import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Dispatches 1-Click Google Sign-In via Firebase (100% Free, No SMS, No Phone verification required)
 * @returns {Promise<{ email: string, displayName: string, phoneNumber: string, uid: string, photoURL: string }>}
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      phoneNumber: user.phoneNumber || '',
      uid: user.uid,
      photoURL: user.photoURL || ''
    };
  } catch (error) {
    console.error("Firebase Google Sign-In error:", error);
    let friendlyMessage = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Google Sign-In popup was closed before completion. Please try again.';
    } else if (error.code === 'auth/unauthorized-domain') {
      friendlyMessage = 'Domain not authorized in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
    } else if (error.code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Google Sign-In provider is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.';
    }
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};
