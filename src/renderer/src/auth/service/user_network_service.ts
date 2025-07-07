import { firebaseFirestore } from "@renderer/firebase";
import { parseAppRoles } from "../interface/roles";
import User, { encodeUserJson } from "../interface/user";

export default class UserNetworkService {
  static async getUsers(): Promise<User[]> {
    const snapshot = await firebaseFirestore.collection("users").get();

    if (snapshot.docs.length > 0) {
      const casted = snapshot.docs.map((element) => {
        const docSnap = element.data();
        return {
          docId: docSnap.docId,
          email: docSnap.email,
          password: docSnap.password,
          name: docSnap.name,
          disabled: docSnap.disabled,
          role: parseAppRoles(docSnap.role),
          updatedAt: new Date(docSnap.updatedAt),
          location: docSnap.location
        } as User;
      });
      return casted;
    }
    return [];
  }

  static async getUser(userId: string): Promise<User | undefined> {
    const snap = await firebaseFirestore.collection("users").doc(userId).get();
    if (snap.exists) {
      const docSnap = snap.data()!;
      return {
        docId: docSnap.docId,
        email: docSnap.email,
        password: docSnap.password,
        name: docSnap.name,
        disabled: docSnap.disabled,
        role: parseAppRoles(docSnap.role),
        updatedAt: new Date(docSnap.updatedAt),
        location: docSnap.location
      } as User;
    }
    return undefined;
  }

  static async addUser(userModel: User) {
    await firebaseFirestore.collection("users").doc(userModel.docId).set(encodeUserJson(userModel));
  }
  static async updateUser(userModel: User) {
    await firebaseFirestore
      .collection("users")
      .doc(userModel.docId)
      .update(encodeUserJson(userModel));
  }

  static async deleteUser(userId: string) {
    await firebaseFirestore.collection("users").doc(userId).delete();
  }
}
