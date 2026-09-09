import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, ClipboardCheck, Eye, EyeOff, FileCheck2, KeyRound, LoaderCircle, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import "./Auth.css";

const features = [
  { icon: ClipboardCheck, title: "Track the work", description: "Inspections, defects and repairs." },
  { icon: UsersRound, title: "Connect the team", description: "Assignments and clear handoffs." },
  { icon: FileCheck2, title: "Keep the record", description: "Documents, history and reports." },
];

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const approvalHeading = useRef<HTMLHeadingElement>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmpCode, setSignupEmpCode] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("");
  const [signupDesignation, setSignupDesignation] = useState("");

  useEffect(() => {
    if (pendingApproval) approvalHeading.current?.focus();
  }, [pendingApproval]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await login(loginEmail.trim(), loginPassword);
      if (result.success) {
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        navigate("/");
      } else {
        setError(result.error || "We couldn't sign you in. Check your details and try again.");
      }
    } catch {
      setError("We couldn't connect. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError("");
    if (!signupEmail.trim() || !signupPassword || !signupName.trim() || !signupEmpCode.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (signupPassword.length < 12) {
      setError("Your password must be at least 12 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signup({
        email: signupEmail.trim(), password: signupPassword, name: signupName.trim(),
        empCode: signupEmpCode.trim(), department: signupDepartment.trim() || "C&W Department",
        designation: signupDesignation.trim() || "Staff",
      });
      if (result.success) {
        setPendingName(signupName.trim());
        setSignupPassword("");
        setPendingApproval(true);
      } else {
        setError(result.error || "We couldn't submit your request. Please try again.");
      }
    } catch {
      setError("We couldn't connect. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <a className="auth-skip" href="#workspace-access">Skip to sign in</a>
      <header className="auth-header">
        <Brand />
        <span className="auth-header-note"><ShieldCheck size={17} aria-hidden="true" /> Staff & administrator access</span>
      </header>

      <main className="auth-main">
        <section className="auth-story" aria-labelledby="about-railflow">
          <p className="auth-eyebrow"><span /> MADE FOR THE MAINTENANCE YARD</p>
          <h2 id="about-railflow">Every wagon.<br />Every step.<br /><span>One workspace.</span></h2>
          <p className="auth-introduction">RailFlow brings wagon inspections, repair coordination and maintenance records together, so your team knows what needs attention and what comes next.</p>
          <ul className="auth-features">
            {features.map(({ icon: Icon, title, description }) => <li key={title}>
              <Icon size={21} strokeWidth={1.65} aria-hidden="true" />
              <h3>{title}</h3><p>{description}</p>
            </li>)}
          </ul>
        </section>

        <section id="workspace-access" className="auth-access" aria-labelledby="access-heading" tabIndex={-1}>
          <div className="auth-form-panel">
            {pendingApproval ? (
              <div className="auth-approval">
                <span className="auth-approval-icon"><Check size={26} aria-hidden="true" /></span>
                <p className="auth-eyebrow">REQUEST RECEIVED</p>
                <h1 id="access-heading" ref={approvalHeading} tabIndex={-1}>You're on the list.</h1>
                <p>{pendingName}, your account is waiting for administrator approval.</p>
                <div className="auth-approval-note"><ShieldCheck size={21} aria-hidden="true" /><p>Your department administrator will review your request. You can sign in once it is approved.</p></div>
                <Button className="auth-submit" variant="outline" onClick={() => { setPendingApproval(false); setTab("login"); setError(""); }}>Back to Login <ArrowRight size={18} aria-hidden="true" /></Button>
              </div>
            ) : (
              <>
                <div className="auth-form-heading">
                  <span className="auth-access-icon"><KeyRound size={23} strokeWidth={1.7} aria-hidden="true" /></span>
                  <h1 id="access-heading">{tab === "login" ? "Welcome back." : "Join your team."}</h1>
                  <p>{tab === "login" ? "Sign in to your wagon maintenance workspace." : "Request an account for your maintenance team."}</p>
                </div>
                <Tabs value={tab} onValueChange={value => { setTab(value); setError(""); setShowPassword(false); }}>
                  <TabsList className="auth-tabs" aria-label="Workspace access">
                    <TabsTrigger value="login" disabled={isLoading}>Sign in</TabsTrigger>
                    <TabsTrigger value="signup" disabled={isLoading}>Request access</TabsTrigger>
                  </TabsList>
                  {error && <p className="auth-error" role="alert" id="auth-error">{error}</p>}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} aria-label="Sign in" aria-describedby={error ? "auth-error" : undefined} aria-busy={isLoading}>
                      <fieldset disabled={isLoading} className="auth-fields">
                        <div className="auth-field">
                          <Label htmlFor="login-email">Work email</Label>
                          <div className="auth-input-wrap"><Mail size={18} aria-hidden="true" /><Input id="login-email" name="email" type="email" placeholder="you@example.com" autoComplete="username" autoCapitalize="none" spellCheck={false} value={loginEmail} onChange={event => setLoginEmail(event.target.value)} required /></div>
                        </div>
                        <div className="auth-field">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="auth-input-wrap auth-password-wrap">
                            <KeyRound size={18} aria-hidden="true" />
                            <Input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={loginPassword} onChange={event => setLoginPassword(event.target.value)} required />
                            <Button className="auth-password-toggle" type="button" variant="ghost" size="icon" aria-controls="login-password" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
                          </div>
                        </div>
                        <Button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" /> Signing in…</> : <>Login <ArrowRight size={18} aria-hidden="true" /></>}</Button>
                      </fieldset>
                    </form>
                    <details className="auth-help"><summary>Trouble signing in?</summary><p>Forgotten your password or waiting for access? Contact your department administrator. New team members can use <button type="button" onClick={() => { setTab("signup"); setError(""); }}>Request access</button> above.</p></details>
                  </TabsContent>
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} aria-label="Request access" aria-describedby={error ? "auth-error" : undefined} aria-busy={isLoading}>
                      <fieldset disabled={isLoading} className="auth-fields">
                        <div className="auth-signup-grid">
                          {[
                            { key: "name", label: "Full name", value: signupName, change: setSignupName, required: true, complete: "name" },
                            { key: "code", label: "Employee code", value: signupEmpCode, change: setSignupEmpCode, required: true, complete: "off" },
                            { key: "department", label: "Department", value: signupDepartment, change: setSignupDepartment, complete: "organization" },
                            { key: "designation", label: "Designation", value: signupDesignation, change: setSignupDesignation, complete: "organization-title" },
                          ].map(field => <div key={field.key} className="auth-field"><Label htmlFor={"signup-" + field.key}>{field.label}{!field.required && <span className="auth-optional"> (optional)</span>}</Label><Input id={"signup-" + field.key} name={field.key} autoComplete={field.complete} value={field.value} onChange={event => field.change(event.target.value)} required={field.required} /></div>)}
                        </div>
                        <div className="auth-field"><Label htmlFor="signup-email">Work email</Label><Input id="signup-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} value={signupEmail} onChange={event => setSignupEmail(event.target.value)} required /></div>
                        <div className="auth-field"><Label htmlFor="signup-password">Create a password</Label><Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={12} value={signupPassword} onChange={event => setSignupPassword(event.target.value)} aria-describedby="signup-password-hint" required /><p id="signup-password-hint" className="auth-field-hint">Use at least 12 characters. Approval is required before sign-in.</p></div>
                        <Button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" /> Submitting…</> : <>Request access <ArrowRight size={18} aria-hidden="true" /></>}</Button>
                      </fieldset>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
          <div className="auth-access-note"><ShieldCheck size={20} strokeWidth={1.7} aria-hidden="true" /><p><strong>One sign-in. The right access.</strong><br />Staff and administrators use the same login.<br className="auth-note-break" /> Your approved role determines what you can do.</p></div>
        </section>
      </main>
      <footer className="auth-footer"><span>RailFlow <span aria-hidden="true">/</span> Built for wagon maintenance teams.</span><span>Inspections. Repairs. Records.</span></footer>
    </div>
  );
};

export default Auth;
