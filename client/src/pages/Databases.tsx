import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Database, Loader2, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface DB {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
}

const Databases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [databases, setDatabases] = useState<DB[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchDatabases = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/databases", { credentials: "include" });
      const data = await res.json();
      setDatabases(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDatabases(); }, [user]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      await apiRequest("POST", "/api/databases", { name: name.trim(), description });
      toast({ title: "Database created!" });
      setName(""); setDescription(""); setCreateOpen(false);
      fetchDatabases();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/databases/${id}`);
      toast({ title: "Deleted" });
      fetchDatabases();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6" data-testid="databases-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Databases</h1>
          <p className="text-muted-foreground text-sm">Create and manage your databases</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground" data-testid="button-new-database"><Plus className="w-4 h-4" /> New Database</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Database</DialogTitle>
              <DialogDescription>Give your database a name and optional description.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-app-db" data-testid="input-db-name" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." data-testid="input-db-description" /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating || !name.trim()} className="gradient-primary text-primary-foreground" data-testid="button-create-db">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : databases.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No databases yet</p>
            <Button onClick={() => setCreateOpen(true)} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /> Create your first database</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map((db) => (
                <TableRow key={db.id} data-testid={`row-database-${db.id}`}>
                  <TableCell className="font-medium">{db.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">{db.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(db.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild size="sm" variant="ghost"><Link to={`/databases/${db.id}`} data-testid={`link-view-db-${db.id}`}><Eye className="w-4 h-4" /></Link></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-db-${db.id}`}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{db.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the database, all its tables, data, and API keys.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(db.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default Databases;
