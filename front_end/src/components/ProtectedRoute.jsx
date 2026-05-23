import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath, isAdmin, ROLES } from "../utils/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin(user)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (!adminOnly && user?.role === ROLES.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
