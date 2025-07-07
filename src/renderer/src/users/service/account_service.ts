import { offlineMode } from "@renderer/utils/app_constants";
import UserLocalService from "./account_local_serivce";
import UserNetworkService from "./account_network_service";
import  User  from "@renderer/auth/interface/user";

class UserService {
  static service = offlineMode ? new UserLocalService() : new UserNetworkService();
  static async getUsers(): Promise<User[]> {
    return await this.service.getUsers();
  }

  static async getUser(userId: string): Promise<User | undefined> {
    return await this.service.getUser(userId);
  }

  static async addUser(user: User) {
    await this.service.addUser(user);
  }

  static async updateUser(user: User) {
    await this.service.updateUser(user);
  }
  static async deleteUser(userId: string) {
    await this.service.deleteUser(userId);
  }
}

export default UserService;
