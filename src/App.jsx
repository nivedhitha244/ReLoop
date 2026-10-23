import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  CheckCircle2,
  LogOut,
  AlertCircle,
  Shield,
} from "lucide-react";
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
import WaterDashboard from "./components/WaterDashboard";
import BuyerDashboard from "./components/buyer/BuyerDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import SellerDashboard from "./components/seller/SellerDashboard";

// Exact SVG Icons matching the reference design
function DropletIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function WaterCanisterIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 2h6v3H9z" />
      <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M4 11h16" />
      <path d="M4 16h16" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="14" height="12" rx="2" />
      <path d="M15 8h4.5a2 2 0 0 1 1.7 1l1.8 3v4h-8V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function VerifierShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@reloop.org",
    password: "Password123!",
    name: "Admin",
    phone: "+91 99000 11223",
  },
  buyer: {
    email: "buyer@reloop.org",
    password: "Password123!",
    name: "Green Park",
    phone: "+91 98765 43210",
  },
  supplier: {
    email: "supplier@reloop.org",
    password: "Password123!",
    name: "Apex Tech Park STP",
    phone: "+91 98111 22334",
  },
  transporter: {
    email: "transporter@reloop.org",
    password: "Password123!",
    name: "EcoFlow Logistics Fleet",
    phone: "+91 98777 66554",
  },
  verifier: {
    email: "verifier@reloop.org",
    password: "Password123!",
    name: "AquaCert Labs Quality Assurance",
    phone: "+91 98444 33221",
  },
};
export default function App() {
  // 'login' | 'signup'
  const [mode, setMode] = useState("login");
  // 'supplier' | 'buyer' | 'transporter' | 'verifier' | 'admin' (null by default so user clicks what they need)
  const [selectedRole, setSelectedRole] = useState(null);

  // Form State (strictly empty by default - showing only placeholders)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Authenticated state (persisted to localStorage so refreshes do not kick user out)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('reloop_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('reloop_logged_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('reloop_logged_user');
      }
    } catch {}
  }, [currentUser]);

  const [activePortalView, setActivePortalView] = useState('auto'); // 'auto' | 'hub' | 'buyer'

  // Clicking a role ONLY updates the selection state without modifying input values
  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
  };

  // Quick fill demo credentials
  const handleFillDemo = (roleKey) => {
    setSelectedRole(roleKey);
    const demo = DEMO_ACCOUNTS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      if (mode === "signup") {
        setFullName(demo.name);
        setPhone(demo.phone ? demo.phone.replace(/\D/g, "").slice(0, 10) : "");
        setConfirmPassword(demo.password);
        setAgreeTerms(true);
      }
    }
  };

  // Phone input handler: strictly numbers, maximum 10 digits
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, ""); // strip non-numeric characters
    const maxTenDigits = digitsOnly.slice(0, 10); // cap at 10 digits
    setPhone(maxTenDigits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // ACCOUNT ROLE VALIDATION
    if (!selectedRole) {
      setAlert({
        type: "error",
        message: "Please select an account type above to proceed.",
      });
      return;
    }

    // SIGN UP VALIDATION
    if (mode === "signup") {
      if (!fullName.trim()) {
        setAlert({
          type: "error",
          message: "Please enter your Full Name or Organization Name.",
        });
        return;
      }
      if (!email.trim()) {
        setAlert({ type: "error", message: "Please enter an email address." });
        return;
      }
      if (phone && phone.length !== 10) {
        setAlert({
          type: "error",
          message:
            "Phone number must be exactly 10 digits (no country code or symbols).",
        });
        return;
      }
      if (!password) {
        setAlert({ type: "error", message: "Please enter a password." });
        return;
      }
      if (password !== confirmPassword) {
        setAlert({ type: "error", message: "Passwords do not match." });
        return;
      }
      if (!agreeTerms) {
        setAlert({
          type: "error",
          message: "Please accept the Terms of Service & Privacy Policy.",
        });
        return;
      }
    } else {
      // SIGN IN VALIDATION
      if (!email.trim() || !password) {
        setAlert({
          type: "error",
          message: "Please enter your email address and password.",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "signup"
          ? {
              role: selectedRole,
              fullName: fullName.trim(),
              email: email.trim(),
              phone,
              password,
            }
          : { role: selectedRole, email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback: check localStorage for accounts registered during this session
        const localAccounts = JSON.parse(
          localStorage.getItem("reloop_users") || "[]",
        );
        if (mode === "login") {
          const matched = localAccounts.find(
            (u) =>
              (u.email.toLowerCase() === email.trim().toLowerCase() ||
                (phone && u.phone === phone)) &&
              u.password === password,
          );

          if (matched) {
            setAlert({
              type: "success",
              message: "Login successful! Redirecting to dashboard...",
            });
            setTimeout(() => {
              setCurrentUser({
                id: matched.id,
                role: matched.role,
                fullName: matched.fullName,
                email: matched.email,
                phone: matched.phone,
              });
              setLoading(false);
            }, 400);
            return;
          }
        }
        throw new Error(data.error || "Authentication failed");
      }

      // If registration succeeded:
      if (mode === "signup") {
        // Auto-login newly registered user directly into their role dashboard
        const newUserObj = {
          id: data.user?.id || "user-" + Date.now(),
          role: selectedRole,
          fullName: fullName.trim(),
          email: email.trim(),
          phone,
          password,
        };
        // Update or push
        const existingIdx = localAccounts.findIndex(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (existingIdx >= 0) {
          localAccounts[existingIdx] = newUserObj;
        } else {
          localAccounts.push(newUserObj);
        }
        localStorage.setItem("reloop_users", JSON.stringify(localAccounts));

        setAlert({
          type: "success",
          message:
            "Account registered successfully! Redirecting directly to your dashboard...",
        });

        // Automatically route to the Seller/Buyer dashboard
        setTimeout(() => {
          setCurrentUser(newUserObj);
          setLoading(false);
        }, 400);
        return;
      } else {
        // LOGIN SUCCEEDED
        setAlert({
          type: "success",
          message: "Login successful! Redirecting to dashboard...",
        });

        setTimeout(() => {
          setCurrentUser(data.user);
          setLoading(false);
        }, 400);
      }
    } catch (err) {
      // Local account fallback check
      const localAccounts = JSON.parse(
        localStorage.getItem("reloop_users") || "[]",
      );
      if (mode === "login") {
        const matched = localAccounts.find(
          (u) =>
            (u.email.toLowerCase() === email.trim().toLowerCase() ||
              (u.phone && u.phone === email.trim())) &&
            u.password === password,
        );

        if (matched) {
          // Strict role matching check
          if (matched.role.toLowerCase() !== selectedRole.toLowerCase()) {
            const regCap =
              matched.role.charAt(0).toUpperCase() + matched.role.slice(1);
            const selCap =
              selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
            setAlert({
              type: "error",
              message: `Role Mismatch: This account is registered as "${regCap}", but you selected "${selCap}". Please select "${regCap}" to sign in.`,
            });
            setLoading(false);
            return;
          }

          setAlert({
            type: "success",
            message: "Login successful! Redirecting to dashboard...",
          });
          setTimeout(() => {
            setCurrentUser(matched);
            setLoading(false);
          }, 400);
          return;
        }
      }

      setAlert({
        type: "error",
        message:
          err.message ||
          "Unable to authenticate. Please check your credentials.",
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('reloop_logged_user');
    } catch {}
    setCurrentUser(null);
    setSelectedRole(null);
    setActivePortalView('auto');
    setAlert(null);
    setPassword("");
    setConfirmPassword("");
  };

  // Show the appropriate dashboard for the logged-in user.
  if (currentUser) {
    let dashboardComponent = null;

    if (currentUser.role === "admin") {
      dashboardComponent = (
        <AdminLayout
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      );
    } else if (currentUser.role === "buyer") {
      dashboardComponent = (
        <BuyerDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      );
    } else if (currentUser.role === "supplier" || currentUser.role === "seller") {
      dashboardComponent = (
        <SellerDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      );
    } else {
      dashboardComponent = (
        <WaterDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <ErrorBoundary>
        {dashboardComponent}
      </ErrorBoundary>
    );
  }

  return (
    <div className="auth-container">
      {/* -------------------------------------------------------------
          LEFT HERO PANEL (Smooth gradient & Branding matching image)
          ------------------------------------------------------------- */}
      <div className="left-hero-panel">
        <div className="hero-content">
          {/* Pill Badge */}
          <div className="brand-pill">
            <div className="brand-pill-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#38bdf8"
                stroke="none"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <span className="brand-pill-text">HACKHERWAY</span>
          </div>

          {/* Large Title */}
          <h1 className="hero-title">
            {mode === "login" ? "ReLoop 2.0" : "Join ReLoop 2.0"}
          </h1>

          {/* Accent statement */}
          <div className="hero-statement">
            <div className="hero-accent-bar"></div>
            <p className="hero-statement-text">
              {mode === "login" ? (
                <>
                  Bridging the Gap Between Water Waste and
                  <br />
                  Water Need.
                </>
              ) : (
                <>
                  Bridging the gap between water waste and
                  <br />
                  water need. Start sharing, saving, and sustaining
                  <br />
                  today.
                </>
              )}
            </p>
          </div>

          {/* Footer Metadata */}
          <p className="hero-meta">SUSTAINABILITY PLATFORM • VERIFIED REUSE</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT FORM PANEL (Exact inputs, roles, no social buttons)
          ------------------------------------------------------------- */}
      <div className="right-form-panel">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">
              {mode === "login" ? "Welcome Back" : "Create your account"}
            </h2>
            <p className="form-subtitle">
              {mode === "login"
                ? "Please enter your details to access your dashboard."
                : "Join the ecosystem to provide, request, transport, or verify water."}
            </p>
          </div>

          {/* Alert Message Banner */}
          {alert && (
            <div
              className={`alert-box ${alert.type === "error" ? "alert-error" : "alert-success"}`}
            >
              {alert.type === "error" ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{alert.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account Type Selector Label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>
                {mode === "login" ? "Select Account Type" : "I am joining as a:"}
              </span>
            </div>

            {/* 5 Platform Role Selector Cards */}
            <div className="role-grid">
              {/* 1. Supplier */}
              <button
                type="button"
                id="role-supplier"
                className={`role-card ${selectedRole === "supplier" ? "active" : ""}`}
                onClick={() => handleSelectRole("supplier")}
              >
                <div className="role-icon-box">
                  <DropletIcon />
                </div>
                <span className="role-label">Supplier</span>
                {selectedRole === "supplier" && (
                  <div className="role-check-badge">
                    <CheckCircle2 size={16} strokeWidth={1.8} />
                  </div>
                )}
              </button>

              {/* 2. Buyer */}
              <button
                type="button"
                id="role-buyer"
                className={`role-card ${selectedRole === "buyer" ? "active" : ""}`}
                onClick={() => handleSelectRole("buyer")}
              >
                <div className="role-icon-box">
                  <WaterCanisterIcon />
                </div>
                <span className="role-label">Buyer</span>
                {selectedRole === "buyer" && (
                  <div className="role-check-badge">
                    <CheckCircle2 size={16} strokeWidth={1.8} />
                  </div>
                )}
              </button>

              {/* 3. Transporter */}
              <button
                type="button"
                id="role-transporter"
                className={`role-card ${selectedRole === "transporter" ? "active" : ""}`}
                onClick={() => handleSelectRole("transporter")}
              >
                <div className="role-icon-box">
                  <TruckIcon />
                </div>
                <span className="role-label">Transporter</span>
                {selectedRole === "transporter" && (
                  <div className="role-check-badge">
                    <CheckCircle2 size={16} strokeWidth={1.8} />
                  </div>
                )}
              </button>

              {/* 4. Verifier */}
              <button
                type="button"
                id="role-verifier"
                className={`role-card ${selectedRole === "verifier" ? "active" : ""}`}
                onClick={() => handleSelectRole("verifier")}
              >
                <div className="role-icon-box">
                  <VerifierShieldIcon />
                </div>
                <span className="role-label">Verifier</span>
                {selectedRole === "verifier" && (
                  <div className="role-check-badge">
                    <CheckCircle2 size={16} strokeWidth={1.8} />
                  </div>
                )}
              </button>

              {/* 5. Admin */}
              <button
                type="button"
                id="role-admin"
                className={`role-card ${selectedRole === "admin" ? "active" : ""}`}
                style={{ gridColumn: 'span 2' }}
                onClick={() => handleSelectRole("admin")}
              >
                <div
                  className="role-icon-box"
                  style={{
                    backgroundColor: selectedRole === "admin" ? '#0c6e5d' : '#f8fafc',
                    color: selectedRole === "admin" ? '#ffffff' : '#475569',
                  }}
                >
                  <Shield size={18} strokeWidth={1.8} />
                </div>
                <span className="role-label">Platform Administrator</span>
                {selectedRole === "admin" && (
                  <div className="role-check-badge">
                    <CheckCircle2 size={16} strokeWidth={1.8} />
                  </div>
                )}
              </button>
            </div>

            {/* SIGN UP SPECIFIC: Full Name / Organization */}
            {mode === "signup" && (
              <div className="form-group">
                <label className="input-label">
                  Full Name / Organization Name
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Green Valley Apartments"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* INPUTS FOR SIGN IN VS SIGN UP */}
            {mode === "login" ? (
              <>
                {/* Email Address */}
                <div className="form-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">
                      <Mail size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input has-toggle"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="options-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    className="forgot-password-link"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* 2-column Email & Phone */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-label">Phone Number</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                </div>

                {/* 2-column Password & Confirm Password */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="input-label">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input has-toggle"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-input has-toggle"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms of Service Checkbox */}
                <div className="terms-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <a href="#terms" onClick={(e) => e.preventDefault()}>
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#privacy" onClick={(e) => e.preventDefault()}>
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              className="btn-primary-action"
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === "login" ? (
                <span>Sign In</span>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {/* Switch between Sign In and Sign Up */}
            <div className="switch-mode-box">
              {mode === "login" ? (
                <span>
                  Don't have an account?
                  <button
                    type="button"
                    className="switch-mode-btn"
                    onClick={() => {
                      setMode("signup");
                      setAlert(null);
                    }}
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?
                  <button
                    type="button"
                    className="switch-mode-btn"
                    onClick={() => {
                      setMode("login");
                      setAlert(null);
                    }}
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
