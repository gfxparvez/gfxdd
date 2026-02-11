import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, CheckCircle, Rocket, Shield, Zap, Code, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Docs() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const phpCode = `<?php
$ch = curl_init("https://${window.location.host}/api/db-api");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "api_key" => "YOUR_API_KEY",
  "action" => "select",
  "table" => "your_table"
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
print_r($data);
?>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(phpCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "PHP script copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Book className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Documentation & API Guide</h1>
      </div>

      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" /> Getting Started
          </h2>
          <Card className="hover-elevate transition-all">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                NexusDB provides a unified API to interact with all your connected databases. Use this guide to integrate our high-performance query engine into your applications.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl h-fit">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">Create a Database</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Head to the Databases tab and connect your storage engine. We support PostgreSQL, Redis, and MongoDB.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl h-fit">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">Generate an API Key</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Navigate to API Keys to create a unique credential for your database. Never share this key publicly.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" /> API Implementation
          </h2>
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> PHP cURL Example
                </CardTitle>
                <p className="text-sm text-muted-foreground">The most reliable way to integrate NexusDB into your PHP backend.</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-background rounded-md transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
              </button>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 text-slate-50 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed shadow-xl border border-white/5">
                {phpCode}
              </pre>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> API Actions Reference
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "select", desc: "Retrieve rows from your table with optional filters.", icon: Zap, color: "text-yellow-500" },
              { title: "insert", desc: "Add new data to your table. Pass an object in the 'data' field.", icon: CheckCircle, color: "text-green-500" },
              { title: "update", desc: "Modify existing records. Requires an 'id' and 'data'.", icon: Rocket, color: "text-blue-500" },
              { title: "delete", desc: "Permanently remove records by ID.", icon: Shield, color: "text-red-500" },
            ].map((action, i) => (
              <Card key={i} className="hover-elevate transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 font-mono">
                    <action.icon className={`w-4 h-4 ${action.color}`} /> {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Detailed Architecture</h2>
          <Card>
            <ScrollArea className="h-[300px] w-full rounded-md p-6">
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-xl mb-3">1. Unified Endpoint</h3>
                  <p className="text-muted-foreground leading-relaxed">All requests are sent to the <code className="bg-muted px-1.5 py-0.5 rounded text-primary">/api/db-api</code> endpoint. Our system automatically routes your request to the correct database based on the provided API Key.</p>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3">2. Authentication</h3>
                  <p className="text-muted-foreground leading-relaxed">We use Header-based or Body-based API Key authentication. The <code className="bg-muted px-1.5 py-0.5 rounded text-primary">api_key</code> field is mandatory for every request.</p>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3">3. Payload Structure</h3>
                  <p className="text-muted-foreground leading-relaxed">The request body must be a valid JSON object containing the following keys:
                    <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
                      <li><span className="font-bold">api_key:</span> Your unique database access key.</li>
                      <li><span className="font-bold">action:</span> One of select, insert, update, or delete.</li>
                      <li><span className="font-bold">table:</span> The name of the table to interact with.</li>
                      <li><span className="font-bold">data:</span> (Optional) Required for insert and update.</li>
                    </ul>
                  </p>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </section>
      </div>
    </div>
  );
}

