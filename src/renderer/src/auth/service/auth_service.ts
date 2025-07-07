import { clear } from "console";
import { User, decodeUserJson, encodeUserJson } from "../interface/user";
import FirebaseAuthService from "./firebase_auth_service";
import UserNetworkService from "./user_network_service";
import { parseAppRoles } from "../interface/roles";

export default class AuthService {
  static async signUp(userModel: User): Promise<User | undefined> {
    const generatedUserId = await FirebaseAuthService.signUp(userModel.email, userModel.password);
    if (generatedUserId) {
      userModel.docId = generatedUserId;
      await UserNetworkService.addUser(userModel);
      return userModel;
    }
    return undefined;
  }

  static async signIn(email: string, password: string): Promise<User | undefined> {
    const generatedUserId = await FirebaseAuthService.signIn(email, password);
    if (generatedUserId) {
      const userData = await UserNetworkService.getUser(generatedUserId);
      return userData;
    }
    return undefined;
  }

  static async signOut() {
    await this.clearCredential();
    FirebaseAuthService.signOut();
  }

  static async updateUserData(user: User) {
    await UserNetworkService.updateUser(user);
  }

  static async deleteUserData(userId: string) {
    await UserNetworkService.deleteUser(userId);
  }

  static async syncUserData(userId: string): Promise<User | undefined> {
    const lastest = await UserNetworkService.getUser(userId);
    if (lastest) {
      await this.saveCredential(lastest);
      return lastest;
    }
    return undefined;
  }

  static async validateCredential(): Promise<boolean> {
    const userData = await this.loadCredential();
    return userData !== undefined;
  }

  static async loadCredential(): Promise<User | undefined> {
    const savedCredential = localStorage.getItem("userCredential");
    if (savedCredential) {
      const decoded = JSON.parse(savedCredential);
      return decodeUserJson(decoded);
    }

    return undefined;
  }

  static async saveCredential(user: User) {
    const encoded = JSON.stringify(encodeUserJson(user));
    localStorage.setItem("userCredential", encoded);
  }

  static async clearCredential() {
    localStorage.removeItem("userCredential");
    localStorage.removeItem("offline_validation");
  }
}
