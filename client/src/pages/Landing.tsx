import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { Database, Shield, Zap, BarChart3, ChevronRight, Layout } from "lucide-react";
import { SiPostgresql, SiRedis, SiMongodb } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">NexusDB</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="font-medium">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="font-medium hover-elevate">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-muted/50 text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Zap className="w-4 h-4 mr-2 text-yellow-500" />
            Next Generation Database Management
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground lg:leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Manage your data with <span className="text-primary">Nexus precision</span>.
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-1000">
            A premium, unified interface for all your PostgreSQL, Redis, and NoSQL databases. 
            Real-time insights, zero-config setup, and enterprise-grade security.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Link to="/auth">
              <Button size="lg" className="min-h-12 px-8 text-lg font-semibold hover-elevate group">
                Get Started for Free
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/docs">
              <Button size="lg" variant="outline" className="min-h-12 px-8 text-lg font-semibold">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Marks */}
      <section className="py-12 border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Supported Technologies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <SiPostgresql className="w-8 h-8" />
              <span className="text-lg font-bold">PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <SiRedis className="w-8 h-8" />
              <span className="text-lg font-bold">Redis</span>
            </div>
            <div className="flex items-center gap-2">
              <SiMongodb className="w-8 h-8" />
              <span className="text-lg font-bold">MongoDB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need, unified.</h2>
          <p className="text-muted-foreground text-lg">Stop juggling multiple tabs. NexusDB brings your entire stack into one view.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Instant Setup",
              description: "Connect your existing databases in seconds with simple connection strings.",
              icon: Zap,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10"
            },
            {
              title: "Secure by Default",
              description: "Military-grade encryption for your credentials and data in transit.",
              icon: Shield,
              color: "text-blue-500",
              bg: "bg-blue-500/10"
            },
            {
              title: "Powerful Explorer",
              description: "Visual query builder and data editor for complex operations without SQL knowledge.",
              icon: Layout,
              color: "text-purple-500",
              bg: "bg-purple-500/10"
            },
            {
              title: "Performance Monitoring",
              description: "Track query latency and resource usage with high-fidelity charts.",
              icon: BarChart3,
              color: "text-green-500",
              bg: "bg-green-500/10"
            }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-xl border bg-card hover-elevate transition-all">
              <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight relative z-10">Ready to transform your data workflow?</h2>
          <p className="text-primary-foreground/80 text-lg relative z-10">Join 10,000+ developers managing their databases with NexusDB.</p>
          <div className="relative z-10">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="min-h-12 px-10 text-lg font-bold hover-elevate">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-12 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">NexusDB</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 NexusDB Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
