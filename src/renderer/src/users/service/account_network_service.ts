import { firebaseFirestore } from "@renderer/firebase";
import { User, decodeUserJson, encodeUserJson } from "../../auth/interface/user";
import { noConnection } from "@renderer/utils/general_utils";

class UserNetworkService {
  userCollection = "users";

  async getUsers(): Promise<User[]> {
    if (noConnection()) return [];
    const snap = await firebaseFirestore.collection(this.userCollection).get();
    if (snap.docs.length > 0) {
      const data = snap.docs.map((docSnap) => decodeUserJson(docSnap.data()));
      return data;
    }
    return [];
  }

  async getUser(userId: string): Promise<User | undefined> {
    if (noConnection()) return undefined;
    const docSnap = await firebaseFirestore.collection(this.userCollection).doc(userId).get();
    if (docSnap.exists && docSnap.data()) {
      const data = decodeUserJson(docSnap.data()!);
      return data;
    }
    return undefined;
  }

  async addUser(user: User) {
    if (noConnection()) return;
    await firebaseFirestore
      .collection(this.userCollection)
      .doc(user.docId)
      .set(encodeUserJson(user));
  }

  async updateUser(user: User) {
    if (noConnection()) return;
    await firebaseFirestore
      .collection(this.userCollection)
      .doc(user.docId)
      .update(encodeUserJson(user));
  }

  async deleteUser(userId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.userCollection).doc(userId).delete();
  }
}

export default UserNetworkService;
