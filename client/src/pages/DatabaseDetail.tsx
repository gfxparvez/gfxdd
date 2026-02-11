import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Loader2, Table2 } from "lucide-react";

interface DBTable { id: string; name: string; createdAt: string; }
type Column = { name: string; data_type: string; is_nullable: boolean; default_value: string };

const DATA_TYPES = ["text", "integer", "boolean", "timestamp", "uuid", "jsonb", "float"];

const DatabaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dbName, setDbName] = useState("");
  const [tables, setTables] = useState<DBTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<Column[]>([{ name: "", data_type: "text", is_nullable: true, default_value: "" }]);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [dbRes, tablesRes] = await Promise.all([
        fetch(`/api/databases/${id}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/databases/${id}/tables`, { credentials: "include" }).then(r => r.json()),
      ]);
      setDbName(dbRes.name || "");
      setTables(tablesRes || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const addColumn = () => setColumns([...columns, { name: "", data_type: "text", is_nullable: true, default_value: "" }]);
  const removeColumn = (i: number) => setColumns(columns.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, field: keyof Column, value: string | boolean) => {
    const updated = [...columns];
    (updated[i] as any)[field] = value;
    setColumns(updated);
  };

  const handleCreateTable = async () => {
    if (!id || !user || !tableName.trim()) return;
    const validCols = columns.filter((c) => c.name.trim());
    if (validCols.length === 0) { toast({ title: "Add at least one column", variant: "destructive" }); return; }
    setCreating(true);
    try {
      await apiRequest("POST", `/api/databases/${id}/tables`, { name: tableName.trim(), columns: validCols });
      toast({ title: "Table created!" });
      setTableName(""); setColumns([{ name: "", data_type: "text", is_nullable: true, default_value: "" }]); setCreateOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      await apiRequest("DELETE", `/api/tables/${tableId}`);
      toast({ title: "Table deleted" });
      fetchData();
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6" data-testid="database-detail-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/databases")} data-testid="button-back"><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-db-name">{dbName}</h1>
          <p className="text-muted-foreground text-sm">Manage tables in this database</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground" data-testid="button-new-table"><Plus className="w-4 h-4" /> New Table</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Table</DialogTitle>
              <DialogDescription>Define your table name and columns.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Table Name</Label><Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="users" data-testid="input-table-name" /></div>
              <div className="space-y-2">
                <Label>Columns</Label>
                {columns.map((col, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Input className="flex-1 min-w-[120px]" placeholder="Column name" value={col.name} onChange={(e) => updateColumn(i, "name", e.target.value)} data-testid={`input-col-name-${i}`} />
                    <Select value={col.data_type} onValueChange={(v) => updateColumn(i, "data_type", v)}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{DATA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Switch checked={col.is_nullable} onCheckedChange={(v) => updateColumn(i, "is_nullable", v)} />
                      <span>Null</span>
                    </div>
                    {columns.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeColumn(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addColumn}><Plus className="w-3 h-3" /> Add Column</Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTable} disabled={creating || !tableName.trim()} className="gradient-primary text-primary-foreground" data-testid="button-create-table">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tables.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Table2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tables yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((t) => (
                <TableRow key={t.id} data-testid={`row-table-${t.id}`}>
                  <TableCell className="font-medium">
                    <Link to={`/tables/${t.id}`} className="hover:underline text-primary" data-testid={`link-table-${t.id}`}>
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-table-${t.id}`}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete table "{t.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will delete all data in this table.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTable(t.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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

export default DatabaseDetail;
