import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Table2, Edit2, Trash2, Plus, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TableColumn { id: string; name: string; dataType: string; }
interface TableRowData { id: string; data: Record<string, any>; createdAt: string; }

const TableData = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tableName, setTableName] = useState("");
  const [dbId, setDbId] = useState("");
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Row Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TableRowData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fetchData = async () => {
    if (!id) return;
    try {
      const [tableRes, colRes, rowRes] = await Promise.all([
        fetch(`/api/tables/${id}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/tables/${id}/columns`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/tables/${id}/rows`, { credentials: "include" }).then(r => r.json()),
      ]);
      setTableName(tableRes.name);
      setDbId(tableRes.databaseId);
      setColumns(colRes || []);
      setRows(rowRes || []);
    } catch (e) {
      console.error("Failed to fetch table data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddRow = () => {
    setEditingRow(null);
    const initialData: Record<string, any> = {};
    columns.forEach(col => {
      initialData[col.name] = "";
    });
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const handleEditRow = (row: TableRowData) => {
    setEditingRow(row);
    setFormData({ ...row.data });
    setIsModalOpen(true);
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm("Are you sure you want to delete this row?")) return;
    try {
      const res = await fetch(`/api/rows/${rowId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Success", description: "Row deleted successfully" });
        fetchData();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete row", variant: "destructive" });
    }
  };

  const handleSaveRow = async () => {
    try {
      const url = editingRow ? `/api/rows/${editingRow.id}` : `/api/tables/${id}/rows`;
      const method = editingRow ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Success", description: `Row ${editingRow ? "updated" : "created"} successfully` });
        setIsModalOpen(false);
        fetchData();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save row", variant: "destructive" });
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ tableName, columns, rows }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${tableName}_data.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.rows && Array.isArray(json.rows)) {
          // Simplistic bulk import: just create each row
          for (const row of json.rows) {
            await fetch(`/api/tables/${id}/rows`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: row.data || row }),
              credentials: "include",
            });
          }
          toast({ title: "Success", description: "Data imported successfully" });
          fetchData();
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to import JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6" data-testid="table-data-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(dbId ? `/databases/${dbId}` : "/databases")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-table-name">{tableName}</h1>
            <p className="text-muted-foreground text-sm">Table Data View</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJSON} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" /> Export JSON
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="json-import"
            />
            <Button variant="outline" size="sm" data-testid="button-import">
              <Upload className="w-4 h-4 mr-2" /> Import JSON
            </Button>
          </div>
          <Button onClick={handleAddRow} data-testid="button-add-row">
            <Plus className="w-4 h-4 mr-2" /> Add Row
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.id}>{c.name}</TableHead>
                ))}
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-12 text-muted-foreground">
                    <Table2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No data in this table
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={c.id}>
                        <span className="text-sm">{String(row.data?.[c.name] ?? "")}</span>
                      </TableCell>
                    ))}
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditRow(row)} data-testid={`button-edit-${row.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRow(row.id)} data-testid={`button-delete-${row.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Row" : "Add New Row"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map(col => (
              <div key={col.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={col.id} className="text-right">{col.name}</Label>
                <Input
                  id={col.id}
                  value={formData[col.name] || ""}
                  onChange={(e) => setFormData({ ...formData, [col.name]: e.target.value })}
                  className="col-span-3"
                  data-testid={`input-field-${col.name}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRow} data-testid="button-save-row">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableData;
