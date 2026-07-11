export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  USER: "ROLE_USER",
};

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function getDashboardPath(userOrRole) {
  const role =
    typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return role === ROLES.ADMIN ? "/admin" : "/dashboard";
}
