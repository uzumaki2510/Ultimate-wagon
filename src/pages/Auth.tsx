import { Brand } from "@/components/Brand";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Train, LogIn, UserPlus, Eye, EyeOff, Shield, User as UserIcon, Clock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [portal, setPortal] = useState<"employee" | "admin">("employee");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingName, setPendingName] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmpCode, setSignupEmpCode] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("");
  const [signupDesignation, setSignupDesignation] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/");
    } else {
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!signupEmail || !signupPassword || !signupName || !signupEmpCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 12) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 12 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signup({
      email: signupEmail,
      password: signupPassword,
      name: signupName,
      empCode: signupEmpCode,
      department: signupDepartment || "C&W Department",
      designation: signupDesignation || "Staff",
    });

    if (result.success) {
      setPendingName(signupName);
      setPendingApproval(true);
    } else {
      toast({
        title: "Signup Failed",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return <div className="min-h-svh flex items-center justify-center bg-background px-4 py-10">
    <div className="w-full max-w-md space-y-6">
      <div className="flex justify-center"><Brand /></div>
      {pendingApproval ? <Card><CardHeader><CardTitle>Approval requested</CardTitle><CardDescription>{pendingName}, your account is waiting for administrator approval.</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Your department administrator will review your request. You can sign in after approval.</p><Button className="w-full" variant="outline" onClick={() => setPendingApproval(false)}>Back to Login</Button></CardContent></Card> :
      <Card className="shadow-sm"><CardHeader><CardTitle className="text-2xl">Welcome to YardPilot</CardTitle><CardDescription>Your wagon maintenance workspace.</CardDescription></CardHeader>
        <CardContent><Tabs defaultValue="login"><TabsList className="grid w-full grid-cols-2 mb-5"><TabsTrigger value="login">Sign in</TabsTrigger><TabsTrigger value="signup">Request access</TabsTrigger></TabsList>
          <TabsContent value="login"><form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="login-email">Work email</Label><Input id="login-email" type="email" autoComplete="username" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="login-password">Password</Label><div className="flex gap-2"><Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required /><Button type="button" variant="outline" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
            <Button className="w-full" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Login'}</Button>
            <p className="text-xs text-muted-foreground leading-relaxed">One secure sign-in for staff and administrators. Forgotten your password? Contact your administrator.</p>
          </form></TabsContent>
          <TabsContent value="signup"><form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[
              { key: 'name', label: 'Full name', value: signupName, change: setSignupName, required: true },
              { key: 'code', label: 'Employee code', value: signupEmpCode, change: setSignupEmpCode, required: true },
              { key: 'department', label: 'Department', value: signupDepartment, change: setSignupDepartment },
              { key: 'designation', label: 'Designation', value: signupDesignation, change: setSignupDesignation },
            ].map(f => <div key={f.key} className="space-y-2"><Label htmlFor={'signup-' + f.key}>{f.label}</Label><Input id={'signup-' + f.key} value={f.value} onChange={e => f.change(e.target.value)} required={f.required} /></div>)}</div>
            <div className="space-y-2"><Label htmlFor="signup-email">Work email</Label><Input id="signup-email" type="email" autoComplete="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" autoComplete="new-password" minLength={12} value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required /><p className="text-xs text-muted-foreground">At least 12 characters. Your account must be approved before sign-in.</p></div>
            <Button className="w-full" disabled={isLoading}>{isLoading ? 'Submitting…' : 'Request access'}</Button>
          </form></TabsContent>
        </Tabs></CardContent>
      </Card>}
    </div>
  </div>;
};

export default Auth;
