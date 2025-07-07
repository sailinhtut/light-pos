import { firebaseAuth } from "@renderer/firebase";
import { showNotification } from "@renderer/utils/general_utils";
import firebase from "firebase/compat/app";

export default class FirebaseAuthService {
  static async signIn(email: string, password: string): Promise<string | undefined> {
    try {
      const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const userId = credential.user?.uid;
      return userId;
    } catch (error) {
      this.handleFirebaseAuthError(error);
      return undefined;
    }
  }
  static async signUp(email: string, password: string): Promise<string | undefined> {
    try {
      const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const userId = credential.user?.uid;
      return userId;
    } catch (error) {
      this.handleFirebaseAuthError(error);
      return undefined;
    }
  }

  static async signOut() {
    await firebaseAuth.signOut();
  }

  static async delete(email: string, password: string): Promise<boolean> {
    try {
      const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      if (credential.user) {
        credential.user?.delete();
        return true;
      }
      return false;
    } catch (error) {
      this.handleFirebaseAuthError(error);
      return false;
    }
  }
  static async updatePassword(email, password, newPassword) {
    try {
      const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      if (credential.user) {
        await credential.user.updatePassword(newPassword);
      }
    } catch (error) {
      this.handleFirebaseAuthError(error);
    }
  }

  static handleFirebaseAuthError(error: firebase.FirebaseError) {
    if (error.code) {
      const errorCode = error.code;
      let errorMessage = "";
      switch (errorCode) {
        case "auth/wrong-password":
          errorMessage = "Incorrect email or password.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Incorrect email or password.";
          break;
        case "auth/user-not-found":
          errorMessage = "Email not found. Please create an account.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many login attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Cannot connect to server. Try again.";
          break;
        default:
          errorMessage = "An error occurred. Please try again.";
      }
      showNotification("Error", error.message);
      return errorMessage;
    } else {
      return "An unknown error occurred."; // Handle generic errors
    }
  }
}
