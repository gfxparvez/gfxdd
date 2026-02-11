import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Trash2, Key, Loader2, Eye, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ApiKeyWithDb {
  id: string;
  keyValue: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  databaseId: string;
  databaseName: string | null;
}

const ApiKeys = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyWithDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<ApiKeyWithDb | null>(null);

  const fetchKeys = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/api-keys", { credentials: "include" });
      const data = await res.json();
      setKeys(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [user]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copied to clipboard!" });
  };

  const toggleVisibility = (id: string) => {
    const next = new Set(visibleKeys);
    next.has(id) ? next.delete(id) : next.add(id);
    setVisibleKeys(next);
  };

  const regenerateKey = async (id: string) => {
    try {
      await apiRequest("PATCH", `/api/api-keys/${id}/regenerate`);
      toast({ title: "API key regenerated" });
      fetchKeys();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
      toast({ title: "API key deleted" });
      fetchKeys();
    } catch {}
  };

  const apiUrl = `${window.location.origin}/api/db-api`;

  const getSnippets = (key: string) => ({
    curl: `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "${key}", "action": "select", "table": "your_table"}'`,
    javascript: `const res = await fetch("${apiUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: "${key}",
    action: "select",
    table: "your_table"
  })
});
const data = await res.json();`,
    php: `<?php
$ch = curl_init("${apiUrl}");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "api_key" => "${key}",
  "action" => "select",
  "table" => "your_table"
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);`,
  });

  return (
    <div className="space-y-6" data-testid="api-keys-page">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm">Manage your API keys and get connection snippets</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : keys.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Key className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No API keys yet. Create a database to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Your Keys</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Database</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.id} className={selectedKey?.id === k.id ? "bg-muted/50" : ""} data-testid={`row-apikey-${k.id}`}>
                      <TableCell className="font-medium text-sm">{k.databaseName || "\u2014"}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {visibleKeys.has(k.id) ? k.keyValue.slice(0, 20) + "..." : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => toggleVisibility(k.id)} data-testid={`button-toggle-key-${k.id}`}>
                            {visibleKeys.has(k.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => copyKey(k.keyValue)} data-testid={`button-copy-key-${k.id}`}><Copy className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setSelectedKey(k)} data-testid={`button-snippets-${k.id}`}><Key className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => regenerateKey(k.id)} data-testid={`button-regenerate-${k.id}`}><RefreshCw className="w-3 h-3" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive" data-testid={`button-delete-key-${k.id}`}><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                                <AlertDialogDescription>Any apps using this key will stop working.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteKey(k.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Connection Snippets</CardTitle></CardHeader>
            <CardContent>
              {selectedKey ? (
                <Tabs defaultValue="curl">
                  <TabsList className="w-full">
                    <TabsTrigger value="curl" className="flex-1">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="flex-1">JavaScript</TabsTrigger>
                    <TabsTrigger value="php" className="flex-1">PHP</TabsTrigger>
                  </TabsList>
                  {Object.entries(getSnippets(selectedKey.keyValue)).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto"><code>{code}</code></pre>
                        <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => copyKey(code)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Select a key to see connection snippets</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
