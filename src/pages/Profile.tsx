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
import { Save, User, Building, BadgeCheck, Calendar, Mail, IdCard } from "lucide-react";

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
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and department details.</p>
      </div>

      <Card className="bg-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          {!isEditing ? (
            <>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="secondary">{user.designation}</Badge>
              </CardDescription>
            </>
          ) : (
            <CardTitle className="text-xl">Edit Profile</CardTitle>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
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

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
                <Button variant="default" className="flex-1" onClick={() => navigate("/")}>
                  Back to Dashboard
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter your department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-designation">Designation</Label>
                  <Input
                    id="edit-designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Enter your designation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input value={user.empCode || "Not Assigned"} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Employee ID cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border">
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default Profile;
