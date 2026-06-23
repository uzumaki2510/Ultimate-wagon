import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Building, BadgeCheck, Calendar, Mail, IdCard, Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [designation, setDesignation] = useState(user?.designation || "");

  if (!user) {
    navigate("/auth");
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleSave = () => {
    updateProfile({ name, department, designation });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      <PageHeader 
        title="Employee Profile"
        description="Manage your personal information and department details."
        icon={User}
        actions={
          !isEditing && (
            <Button variant="outline" className="gap-2 shadow-sm bg-background" onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4" /> Edit Profile
            </Button>
          )
        }
      />

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
        <CardHeader className="text-center pb-6 bg-secondary/10 border-b border-border/50 relative">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-primary/5"></div>
          <div className="flex justify-center mb-4 relative z-10 pt-8">
            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
              <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="relative z-10">
            {!isEditing ? (
              <>
                <CardTitle className="text-3xl font-bold tracking-tight">{user.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="shadow-sm font-medium">{user.designation}</Badge>
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 px-6 sm:px-8">
          {!isEditing ? (
            <>
              {/* Employee Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem icon={IdCard} label="Employee ID" value={user.empCode || "Not Assigned"} />
                <DetailItem icon={Mail} label="Email" value={user.email} />
                <DetailItem icon={Building} label="Department" value={user.department} />
                <DetailItem icon={BadgeCheck} label="Designation" value={user.designation} />
                <DetailItem icon={User} label="Full Name" value={user.name} />
                <DetailItem icon={Calendar} label="Member Since" value={formatDate(user.createdAt)} />
              </div>

              <div className="flex pt-4 justify-end">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
                  Back to Dashboard
                </Button>
              </div>
            </>
          ) : (
            <div className="max-w-xl mx-auto">
              {/* Edit Form */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department" className="text-sm font-medium">Department</Label>
                  <Input
                    id="edit-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter your department"
                    className="shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-designation" className="text-sm font-medium">Designation</Label>
                  <Input
                    id="edit-designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Enter your designation"
                    className="shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <Input value={user.empCode || "Not Assigned"} disabled className="bg-muted/50 border-dashed" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <Input value={user.email} disabled className="bg-muted/50 border-dashed" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3" /> Core identity fields cannot be changed directly
                </p>
              </div>

              <div className="flex gap-3 pt-8 justify-end border-t mt-8">
                <Button variant="outline" className="shadow-sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="shadow-sm gap-2" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
      <div className="p-2.5 rounded-lg bg-background shadow-sm border border-border/50">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-foreground text-sm truncate mt-0.5" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default Profile;
