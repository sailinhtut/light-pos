import React, { createContext, useEffect, useState } from "react";
import User from "../interface/user";
import AuthService from "../service/auth_service";
import { AppRoles } from "../interface/roles";
import { offlineMode } from "@renderer/utils/app_constants";

interface UserContextInterface {
  currentUser: User;
  setCurrentUser: (user: User | undefined) => void;
  authorize: () => Promise<boolean>;
}

const userModelSample = {
  name: localStorage.getItem("offline_casher_name") ?? "Light POS",
  email: "sailinhtut76062@gmail.com",
  password: "",
  docId: "xxxx",
  updatedAt: new Date(),
  disabled: false,
  location: null,
  messagenToken: null,
  role: AppRoles.superadmin
};

const UserContext = createContext<UserContextInterface>({
  currentUser: userModelSample,
  authorize: () => Promise.resolve(true),
  setCurrentUser: (user) => {}
});

export function UserContextProvider({ children }: { children?: React.ReactNode }) {
  const [currentUser, _setCurrentUser] = useState<User | undefined>(undefined);

  const authorize = async () => {
    if (offlineMode) {
      _setCurrentUser(userModelSample);
      return true;
    } else {
      const credential = await AuthService.loadCredential();
      if (credential) {
        _setCurrentUser(credential);
        return true;
      } else {
        return false;
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser: currentUser ?? userModelSample,
        authorize: authorize,
        setCurrentUser: _setCurrentUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;
