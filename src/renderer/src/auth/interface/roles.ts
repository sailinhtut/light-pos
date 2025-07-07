export enum AppRoles {
  casher,
  admin,
  superadmin
}

export function parseAppRoles(key: string) {
  switch (key) {
    case "casher":
      return AppRoles.casher;
    case "admin":
      return AppRoles.admin;
    case "superadmin":
      return AppRoles.superadmin;
    default:
      return AppRoles.casher;
  }
}
