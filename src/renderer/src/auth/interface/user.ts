import { GeoPoint } from "firebase/firestore";
import { AppRoles } from "./roles";

export default interface User {
  docId: string;
  email: string;
  location: GeoPoint | null;
  messagenToken: string | null;
  disabled: boolean;
  name: string;
  password: string;
  role: AppRoles;
  updatedAt: Date;
}

export function encodeUserJson(user: User) {
  return {
    disabled: user.disabled,
    docId: user.docId,
    email: user.email,
    location: user.location ?? null,
    messagenToken: user.messagenToken ?? null,
    name: user.name,
    password: user.password,
    role: AppRoles[user.role],
    updatedAt: user.updatedAt.toISOString()
  };
}
export function decodeUserJson(user: object): User {
  const data = user as User;
  return {
    disabled: data.disabled,
    docId: data.docId,
    email: data.email,
    location: data.location,
    messagenToken: data.messagenToken,
    name: data.name,
    password: data.password,
    role: AppRoles[data.role],
    updatedAt: new Date(data.updatedAt)
  };
}
