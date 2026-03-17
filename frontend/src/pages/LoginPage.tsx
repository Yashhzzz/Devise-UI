import { useState } from "react";
import { Link } from "react-router-dom";
import { Grid2x2, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    
    try {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:block relative overflow-hidden bg-[#0A0E1A]">
        {/* Background Image */}
        <img
          src="/src/assets/login-image.png"
          alt="Premium background"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* TOP LEFT RECTANGLE LOGO */}
        <div className="absolute top-0 left-0 p-8 flex items-center gap-2 z-10">
          <div className="w-8 h-8 bg-[#F04E23] rounded-lg flex items-center justify-center">
            <Grid2x2 className="text-white w-4 h-4" />
          </div>
          <span className="text-white font-bold text-lg">Devise</span>
        </div>


      </div>

      {/* RIGHT PANEL */}
      <div className="bg-white flex flex-col items-center justify-center px-8 md:px-16 lg:px-20 relative">
        {/* BACK TO HOME (MOBILE) */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 z-10 lg:ml-0"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to home
        </Link>

        {/* FORM CONTAINER */}
        <div className="max-w-md w-full">
          {/* MOBILE LOGO */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#F04E23] rounded-lg flex items-center justify-center">
              <Grid2x2 className="text-white w-4 h-4" />
            </div>
            <span className="text-[#1A1A1A] font-bold text-lg">Devise</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your Devise account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5 block">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F04E23] focus:ring-1 focus:ring-[#F04E23] transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 block">
                  Password
                </label>
                <Link to="#" className="text-xs text-[#F04E23] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F04E23] focus:ring-1 focus:ring-[#F04E23] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F04E23] text-white rounded-xl py-3.5 font-semibold text-sm mt-2 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4 text-gray-100">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button className="w-full border border-gray-200 rounded-xl py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <Link to="/signup" className="text-[#F04E23] font-medium hover:underline ml-1">
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-8">
            By signing in you agree to our{" "}
            <Link to="#" className="text-gray-400 hover:text-[#F04E23] underline transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="#" className="text-gray-400 hover:text-[#F04E23] underline transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
