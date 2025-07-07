import Dexie, { Table } from "dexie";
import { User, decodeUserJson } from "@renderer/auth/interface/user";

class UserDatabase extends Dexie {
  users!: Table<User, string>;
  constructor() {
    super("users_data");
    this.version(1).stores({
      users: "docId,disabled,email,location,messagenToken,name,password,role,updatedAt"
    });
  }
}

class UserLocalService {
  db = new UserDatabase();

  async getUsers(): Promise<User[]> {
    const data = await this.db.users.toArray();
    const decoded = data.map((element) => decodeUserJson(element));
    return decoded;
  }

  async getUser(userId: string): Promise<User | undefined> {
    const data = await this.db.users.get(userId);
    return data;
  }

  async addUser(user: User) {
    await this.db.users.add(user, user.docId);
  }

  async updateUser(user: User) {
    await this.db.users.update(user.docId, { ...user });
  }
  async deleteUser(userId: string) {
    await this.db.users.delete(userId);
  }
}

export default UserLocalService;
