import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { checkAuth } from "../utils/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const user = await checkAuth();
      setIsAuthenticated(!!user);
    };

    verifyAuth();
  }, []);

  if (isAuthenticated === null) {
    // Still loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1ea]">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-slate-950"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M12 3a9 9 0 0 1 9 9h-2.5a6.5 6.5 0 1 0-6.5 6.5V21a9 9 0 0 1 0-18Z"
            />
          </svg>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
