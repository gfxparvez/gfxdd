import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Log {
  id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number | null;
  createdAt: string;
}

interface DBRecord { id: string; name: string; }

const QueryLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [databases, setDatabases] = useState<DBRecord[]>([]);
  const [filterDb, setFilterDb] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/databases", { credentials: "include" }).then(r => r.json()).then(d => setDatabases(d || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDb !== "all") params.set("database_id", filterDb);
    if (filterMethod !== "all") params.set("method", filterMethod);
    fetch(`/api/query-logs?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then((items: Log[]) => {
        setLogs(items || []);
        const byDay: Record<string, number> = {};
        (items || []).forEach((l) => {
          const day = new Date(l.createdAt).toLocaleDateString();
          byDay[day] = (byDay[day] || 0) + 1;
        });
        setChartData(Object.entries(byDay).map(([date, count]) => ({ date, count })).reverse().slice(-14));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, filterDb, filterMethod]);

  const statusColor = (code: number) => code < 300 ? "bg-green-100 text-green-700" : code < 500 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-6" data-testid="query-logs-page">
      <div>
        <h1 className="text-2xl font-bold">Query Logs</h1>
        <p className="text-muted-foreground text-sm">Monitor API usage and performance</p>
      </div>

      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Requests Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(258, 80%, 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <Select value={filterDb} onValueChange={setFilterDb}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-db"><SelectValue placeholder="All databases" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All databases</SelectItem>
            {databases.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-method"><SelectValue placeholder="All methods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {["select", "insert", "update", "delete"].map((m) => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <Card className="glass-card"><CardContent className="flex flex-col items-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No query logs yet. Make some API requests!</p>
        </CardContent></Card>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} data-testid={`row-log-${l.id}`}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{l.method.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-sm font-mono">{l.endpoint}</TableCell>
                  <TableCell><Badge className={statusColor(l.statusCode)}>{l.statusCode}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.responseTimeMs ? `${l.responseTimeMs}ms` : "\u2014"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default QueryLogs;
