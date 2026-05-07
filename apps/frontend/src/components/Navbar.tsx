import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { checkAuth, logout as logoutUser } from "../utils/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  qid?: string;
}

const navigationLinks = [
  { label: "ERP Chat", to: "/erp-chat" },
  { label: "StudyMate", to: "/studymate" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAuth = async () => {
      const authenticatedUser = await checkAuth();
      setUser(authenticatedUser);
      setLoading(false);
    };

    checkUserAuth();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 text-slate-950"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,92,255,0.24)] transition-transform duration-300 group-hover:scale-105">
            A
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight sm:text-base">
              Alfred
            </div>
            <div className="text-[11px] text-slate-500 sm:text-xs">
              QUMS companion
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navigationLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {!loading && user ? (
            <>
              <Link
                to="/profile"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.15)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.15)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 sm:hidden"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
            <div className="grid grid-cols-1 gap-2">
              {navigationLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              {!loading && user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
