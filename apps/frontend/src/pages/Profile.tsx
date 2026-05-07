import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getUserInfo, updateERPCredentials, checkAuth } from "../utils/auth";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  qid?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [qid, setQid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const auth = await checkAuth();
        if (!auth) {
          navigate("/login");
          return;
        }
        setUser(auth);
        if (auth.qid) {
          setQid(auth.qid);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!qid.trim()) {
      setError("QID is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await updateERPCredentials(qid, password);
      setUser(updatedUser);
      setSuccess("Credentials updated successfully!");
      setPassword("");
      setTimeout(() => {
        navigate("/erp-chat");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update credentials";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f1ea] flex items-center justify-center">
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
          <span className="text-slate-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative bg-[#f6f1ea] text-slate-950">
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#ff8a65] opacity-20 blur-3xl animate-blob" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-[#7c5cff] opacity-15 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-[#12b3a8] opacity-15 blur-3xl animate-blob animation-delay-4000" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,120,94,0.1),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,92,255,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(18,179,168,0.08),transparent_40%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Complete Your
                <span className="block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                  Profile Setup
                </span>
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">
                Add your QUMS credentials to unlock all features. Your
                information is encrypted and secure.
              </p>
            </div>

            {/* User Info Display */}
            {user && (
              <div className="rounded-3xl border border-white/70 bg-white/60 p-6 backdrop-blur-xl sm:p-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-lg font-medium text-slate-950">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Name
                    </p>
                    <p className="mt-1 text-lg font-medium text-slate-950">
                      {user.name || "Not set"}
                    </p>
                  </div>
                  {user.qid && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        QID (Current)
                      </p>
                      <p className="mt-1 text-lg font-medium text-slate-950">
                        {user.qid}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff7b54] opacity-10 blur-2xl" />
              <div className="absolute -bottom-16 left-0 h-40 w-40 rounded-full bg-[#7c5cff] opacity-10 blur-2xl" />

              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="qid"
                    className="block text-sm font-semibold text-slate-950"
                  >
                    QID (Quantum ID)
                  </label>
                  <input
                    id="qid"
                    type="text"
                    value={qid}
                    onChange={(e) => setQid(e.target.value)}
                    placeholder="Enter your QUMS QID"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 sm:px-5 sm:py-3.5"
                  />
                  <p className="text-xs text-slate-600">
                    Your unique Quantum University Management System ID
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-950"
                  >
                    QUMS Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your QUMS password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 sm:px-5 sm:py-3.5"
                  />
                  <p className="text-xs text-slate-600">
                    Your password is encrypted and stored securely
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-950 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.16),transparent_30%,transparent_70%,rgba(255,255,255,0.16))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {saving ? (
                    <>
                      <svg
                        className="relative z-10 h-5 w-5 animate-spin"
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
                      <span className="relative z-10">Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Save & Continue</span>
                      <span className="relative z-10">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="rounded-2xl border border-blue-200/50 bg-blue-50/50 px-4 py-4 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 text-lg">ℹ️</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Why we need this
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Your QUMS credentials allow Alfred to fetch your
                        attendance, grades, schedules, and other academic
                        information securely. We use industry-standard
                        encryption to protect your data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/50 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
              <span>✓ Secured with SSL encryption</span>
              <span>✓ No password sharing</span>
              <span>✓ Private & confidential</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
