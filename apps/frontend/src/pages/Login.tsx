import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:6969";

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (credentialResponse) => {
      setLoading(true);
      try {
        // Send authorization code to backend, which exchanges it and sets auth cookie.
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code: credentialResponse.code }),
        });

        if (response.ok) {
          window.location.href = "/erp-chat";
        }
      } catch (error) {
        console.error("Login error:", error);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error("Login Failed");
    },
  });

  return (
    <div className="min-h-screen overflow-hidden relative bg-[#f6f1ea] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,120,94,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(74,144,226,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(156,111,255,0.16),transparent_32%),linear-gradient(180deg,#f8f3ec_0%,#fffdf8_55%,#f3f7ff_100%)]" />

      <div className="absolute -top-20 left-[8%] hidden h-56 w-56 rounded-full bg-[#ff8a65] blur-3xl opacity-20 sm:block" />
      <div className="absolute top-[18%] right-[10%] h-40 w-40 rounded-full bg-[#7c5cff] blur-3xl opacity-15 sm:h-72 sm:w-72" />
      <div className="absolute bottom-[8%] left-[18%] hidden h-64 w-64 rounded-full bg-[#48c6b5] blur-3xl opacity-15 lg:block" />

      <div className="relative z-10 min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-start lg:items-center">
          <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <section className="relative order-2 lg:order-1 lg:pr-6">
              <div className="max-w-xl space-y-5 sm:space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-2 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff7b54]" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600 sm:text-xs sm:tracking-[0.24em]">
                    Alfred for QUMS
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h1 className="max-w-md text-[2.7rem] font-semibold leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
                    One sign-in.
                    <span className="mt-2 block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                      Everything else becomes easy.
                    </span>
                  </h1>
                  <p className="max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 lg:text-lg">
                    Alfred is your agentic AI chatbot with live QUMS
                    integrations, built to feel fast, clear, and actually
                    pleasant to use.
                  </p>
                </div>

                <div className="grid max-w-lg grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/70 bg-white/70 px-4 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
                    <div className="font-semibold text-slate-900">Smart</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Fast context from QUMS.
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/70 bg-white/70 px-4 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
                    <div className="font-semibold text-slate-900">Light</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Calm UI, zero clutter.
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/70 bg-white/70 px-4 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
                    <div className="font-semibold text-slate-900">Secure</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Easy Google OAuth.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-1 lg:order-2">
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-[#ff7b54]/20 via-[#7c5cff]/15 to-[#12b3a8]/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/78 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8 sm:pb-9">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7c5cff] opacity-10 blur-2xl" />
                  <div className="absolute -bottom-12 left-0 h-36 w-36 rounded-full bg-[#ff7b54] opacity-10 blur-2xl" />

                  <div className="ml-1 mb-7 space-y-2 sm:mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      Access Alfred
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                      Continue with Google
                    </h2>
                    <p className="max-w-sm text-sm leading-6 text-slate-600">
                      We’ll never share your details with anyone else.
                    </p>
                  </div>

                  <button
                    onClick={() => handleGoogleLogin()}
                    disabled={loading}
                    className="btn-gradient group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-slate-900/5 bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(15,23,42,0.18)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-4"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.16),transparent_30%,transparent_70%,rgba(255,255,255,0.16))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {loading ? (
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
                        <span className="relative z-10">Signing in</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fill="#4285F4"
                            d="M21.35 11.1H12v2.9h5.35c-.25 1.45-1.1 2.68-2.34 3.5v2.92h3.78c2.21-2.03 3.48-5.02 3.48-8.57 0-.83-.08-1.63-.22-2.25Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 22c2.97 0 5.46-.98 7.28-2.66l-3.78-2.92c-1.05.7-2.39 1.11-3.5 1.11-2.69 0-4.98-1.81-5.8-4.25H2.32v2.99A10 10 0 0 0 12 22Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M6.2 13.28a5.9 5.9 0 0 1 0-3.56V6.73H2.32a10 10 0 0 0 0 8.92l3.88-2.37Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.77c1.62 0 3.08.56 4.24 1.65l3.18-3.18A10 10 0 0 0 12 2a10 10 0 0 0-9.68 6.73L6.2 11.1C7.02 7.88 9.31 5.77 12 5.77Z"
                          />
                        </svg>
                        <span className="relative z-10">
                          Continue with Google
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
