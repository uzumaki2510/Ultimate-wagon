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
  const [signupEmployeeId, setSignupEmployeeId] = useState("");
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

    if (!signupEmail || !signupPassword || !signupName || !signupEmployeeId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signup({
      email: signupEmail,
      password: signupPassword,
      name: signupName,
      employeeId: signupEmployeeId,
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <Train className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Railway C&W Department</h1>
          <p className="text-muted-foreground">Wagon Repair Management System</p>
        </div>

        {/* Pending Approval Screen */}
        {pendingApproval ? (
          <Card className="glass border-amber-400/30">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-amber-500/15">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Awaiting Admin Approval</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Hi <span className="font-semibold text-foreground">{pendingName}</span>, your account request has been submitted.
                </p>
              </div>
              <div className="w-full rounded-lg bg-amber-500/10 border border-amber-400/30 p-4 text-sm text-amber-800 dark:text-amber-300 text-left space-y-1">
                <p className="font-semibold">What happens next?</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                  <li>The administrator reviews your request</li>
                  <li>Once approved, you can log in with your credentials</li>
                  <li>If rejected, contact your department head</li>
                </ul>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => { setPendingApproval(false); setPortal("employee"); }}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary">
          <Button
            type="button"
            variant={portal === "employee" ? "default" : "ghost"}
            className="gap-2"
            onClick={() => setPortal("employee")}
          >
            <UserIcon className="h-4 w-4" /> Employee
          </Button>
          <Button
            type="button"
            variant={portal === "admin" ? "default" : "ghost"}
            className="gap-2"
            onClick={() => setPortal("admin")}
          >
            <Shield className="h-4 w-4" /> Admin
          </Button>
        </div>

        <Card className="glass border-primary/20">
          {portal === "admin" ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Admin Login
                </CardTitle>
                <CardDescription>
                  Restricted access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@railway.gov.in"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in as Admin"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <CardTitle className="text-lg mb-1">Welcome Back</CardTitle>
                <CardDescription className="mb-4">
                  Enter your credentials to access the system
                </CardDescription>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@railway.gov.in"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <CardTitle className="text-lg mb-1">Create Account</CardTitle>
                <CardDescription className="mb-4">
                  Register to access the wagon repair system
                </CardDescription>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name *</Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-employee-id">Employee ID *</Label>
                      <Input
                        id="signup-employee-id"
                        placeholder="EMP001"
                        value={signupEmployeeId}
                        onChange={(e) => setSignupEmployeeId(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@railway.gov.in"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-department">Department</Label>
                      <Input
                        id="signup-department"
                        placeholder="C&W Department"
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-designation">Designation</Label>
                      <Input
                        id="signup-designation"
                        placeholder="Senior Technician"
                        value={signupDesignation}
                        onChange={(e) => setSignupDesignation(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
          )}
        </Card>
        </>
        )} {/* end pendingApproval else */}

        <p className="text-center text-xs text-muted-foreground">
          Data stored locally for offline access
        </p>
      </div>
    </div>
  );
};

export default Auth;
