import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Download, Upload, Shield } from "lucide-react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/profile", { displayName });
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/password", { password: newPassword });
      toast({ title: "Password updated" }); setNewPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleFullExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/export", { credentials: "include" });
      const data = await res.json();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `full_app_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast({ title: "Success", description: "Full backup exported successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFullImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
          credentials: "include",
        });
        if (res.ok) {
          toast({ title: "Success", description: "Full data restored successfully" });
          window.location.reload();
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to import JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-xl" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and account</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled data-testid="input-email" />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-display-name" />
          </div>
          <Button onClick={handleUpdateProfile} disabled={saving} className="gradient-primary text-primary-foreground" data-testid="button-save-profile">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
          <CardDescription>Set a new password for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" data-testid="input-new-password" />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} variant="outline" data-testid="button-update-password">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Shield className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription>Backup or restore all application data (databases, tables, and rows)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={handleFullExport}
              disabled={isExporting}
              data-testid="button-full-export"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export All Data (JSON)
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFullImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="full-json-import"
              />
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" data-testid="button-full-import">
                <Upload className="w-4 h-4 mr-2" /> Import & Restore Data
              </Button>
            </div>
          </div>
          <div className="pt-4 border-t border-destructive/10">
            <Button variant="destructive" onClick={signOut} data-testid="button-sign-out">Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
