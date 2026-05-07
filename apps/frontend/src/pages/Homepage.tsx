import { Link } from "react-router";
import { useState, useEffect } from "react";

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
  link: string;
}

const features: Feature[] = [
  {
    icon: "💬",
    title: "ERP Chat",
    description:
      "Your intelligent QUMS companion. Get instant answers about attendance, grades, schedules, and more. Let Alfred handle your campus admin tasks while you focus on what matters.",
    color: "from-[#ff7b54]",
    link: "/erp-chat",
  },
  {
    icon: "📚",
    title: "StudyMate",
    description:
      "Your personal study copilot powered by AI. Upload notes, access previous year questions, and get intelligent summaries. Learn smarter with AI-powered document retrieval and analysis.",
    color: "from-[#7c5cff]",
    link: "/studymate",
  },
];

const capabilities = [
  {
    number: "01",
    title: "Real-time ERP Integration",
    description:
      "Direct connection to QUMS for attendance tracking, grade retrieval, and schedule management",
  },
  {
    number: "02",
    title: "AI-Powered Conversations",
    description:
      "Context-aware responses using advanced language models tuned for campus workflows",
  },
  {
    number: "03",
    title: "Intelligent Document Retrieval",
    description:
      "Upload study materials and get instant AI-powered summaries and Q&A",
  },
  {
    number: "04",
    title: "PYQ Database Access",
    description:
      "Smart search through previous year questions with intelligent categorization",
  },
  {
    number: "05",
    title: "Async Processing",
    description: "Handle long-running tasks without blocking your workflow",
  },
  {
    number: "06",
    title: "Secure Authentication",
    description: "One-click Google OAuth login with enterprise-grade security",
  },
];

const stats = [
  { label: "Universities", value: "1" },
  { label: "Features", value: "2+" },
  { label: "AI Models", value: "2" },
];

const Homepage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#ff8a65] opacity-20 blur-3xl animate-blob" />
        <div
          className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-[#7c5cff] opacity-15 blur-3xl animate-blob animation-delay-2000"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-[#12b3a8] opacity-15 blur-3xl animate-blob animation-delay-4000"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,120,94,0.1),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,92,255,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(18,179,168,0.08),transparent_40%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen px-4 py-8 flex items-center justify-center sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:items-center">
            {/* Hero Content */}
            <div className="space-y-6 sm:space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-2 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.06)] w-fit sm:px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff7b54]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600 sm:text-xs sm:tracking-[0.24em]">
                  Welcome to Alfred
                </span>
              </div>

              {/* Hero Heading */}
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
                  Your AI Copilot for
                  <span className="mt-2 block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                    Campus Success
                  </span>
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8 lg:text-xl">
                  Alfred is your unified AI assistant for QUMS. Handle campus
                  admin tasks with ERP Chat, elevate your studies with
                  StudyMate, and get everything done in one place.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  to="/erp-chat"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:translate-y-0"
                >
                  Get Started with ERP Chat
                </Link>
                <Link
                  to="/studymate"
                  className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-slate-50 active:bg-slate-100"
                >
                  Explore StudyMate
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 sm:gap-6 sm:pt-6">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl border border-white/70 bg-white/50 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-5"
                  >
                    <div className="text-2xl font-bold text-slate-950 sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-600 sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration / Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-[#ff7b54]/20 via-[#7c5cff]/15 to-[#12b3a8]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/78 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff7b54] opacity-10 blur-2xl" />
                <div className="absolute -bottom-16 left-0 h-40 w-40 rounded-full bg-[#7c5cff] opacity-10 blur-2xl" />

                <div className="relative space-y-4">
                  {/* Chat bubble simulation */}
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-xs rounded-3xl rounded-tr-none bg-linear-to-r from-[#ff7b54] to-[#ff9a85] px-5 py-3 text-white text-sm shadow-lg">
                        What's my attendance?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-xs rounded-3xl rounded-tl-none bg-slate-100 px-5 py-3 text-slate-900 text-sm">
                        Your attendance is 87%. You need 2 more classes this
                        semester.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-xs rounded-3xl rounded-tr-none bg-linear-to-r from-[#7c5cff] to-[#956fff] px-5 py-3 text-white text-sm shadow-lg">
                        Summarize Chapter 5
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-xs rounded-3xl rounded-tl-none bg-slate-100 px-5 py-3 text-slate-900 text-sm">
                        Chapter 5 covers... ✨ Ready to study?
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-12 space-y-4 sm:mb-16 sm:space-y-6 text-center">
            <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Powerful Features,
              <span className="block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                Seamlessly Integrated
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Everything you need for campus success in one unified platform
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:gap-10">
            {features.map((feature, idx) => (
              <Link
                key={idx}
                to={feature.link}
                className="group relative overflow-hidden rounded-4xl border border-white/70 bg-white/60 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-white/90 hover:bg-white/80 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)] hover:-translate-y-1 sm:p-8 backdrop-blur-xl"
              >
                <div
                  className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-${feature.color}/20 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <div className="relative space-y-4">
                  <div className="text-5xl sm:text-6xl">{feature.icon}</div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-950 sm:text-2xl transition-colors duration-300 group-hover:bg-linear-to-r group-hover:from-[#ff7b54] group-hover:via-[#7c5cff] group-hover:to-[#12b3a8] group-hover:bg-clip-text group-hover:text-transparent">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      {feature.description}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition-transform duration-300 group-hover:translate-x-1">
                    Learn more
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-12 space-y-4 sm:mb-16 sm:space-y-6 text-center">
            <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Built with
              <span className="block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                Advanced Capabilities
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Engineered for reliability, security, and intelligence
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 sm:p-7 shadow-[0_15px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-white/90 hover:bg-white/80 hover:shadow-[0_25px_60px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 backdrop-blur-xl"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-[#ff7b54]/5 via-[#7c5cff]/5 to-[#12b3a8]/5" />

                <div className="relative space-y-3">
                  <div className="text-4xl font-bold bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                    {capability.number}
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
                    {capability.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/60 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12 lg:p-16">
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#ff7b54] opacity-10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-[#7c5cff] opacity-10 blur-3xl" />

            <div className="relative space-y-6 text-center sm:space-y-8">
              <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Ready to Transform Your
                <span className="block bg-linear-to-r from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] bg-clip-text text-transparent">
                  Campus Experience?
                </span>
              </h2>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
                Join hundreds of students using Alfred to streamline their
                academic workflows, boost their productivity, and focus on what
                truly matters—learning.
              </p>

              <div className="flex flex-col gap-3 justify-center sm:flex-row sm:gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:translate-y-0"
                >
                  Get Started Now
                </Link>
                <Link
                  to="/erp-chat"
                  className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-8 py-3 text-base font-semibold text-slate-950 transition-all duration-300 hover:bg-slate-50 active:bg-slate-100"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-white/40 px-4 py-8 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff7b54] via-[#7c5cff] to-[#12b3a8] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,92,255,0.24)]">
                  A
                </div>
                <span className="font-semibold text-slate-950">Alfred</span>
              </div>
              <p className="text-xs text-slate-600 sm:text-sm">
                Your AI Copilot for Campus Success
              </p>
            </div>

            <p className="text-center text-xs text-slate-600 sm:text-sm">
              © 2026 Alfred. Built with ❤️ for QUMS.
            </p>

            <div className="flex gap-4 text-sm text-slate-600">
              <Link
                to="/erp-chat"
                className="transition-colors hover:text-slate-950"
              >
                Features
              </Link>
              <Link
                to="/login"
                className="transition-colors hover:text-slate-950"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
