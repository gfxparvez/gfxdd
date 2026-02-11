import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Database, Shield, Zap, CheckCircle, Rocket, BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Full Premium Connected System</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Enterprise Database <br />Management & Connectivity
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Experience the next generation of cloud database management. Secure, lightning-fast, and fully connected to all your applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Premium Security",
                description: "Enterprise-grade encryption and secure access protocols for all your sensitive data."
              },
              {
                icon: Zap,
                title: "Ultra Performance",
                description: "Optimized connection pooling and low-latency routing for real-time synchronization."
              },
              {
                icon: Database,
                title: "Universal Connect",
                description: "Seamlessly connect and manage multiple database types through a single dashboard."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-background p-8 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connectivity Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">Fully Connected Infrastructure</h2>
              <ul className="space-y-4">
                {[
                  "Real-time database synchronization",
                  "Automated API key rotation",
                  "Comprehensive query monitoring",
                  "Advanced data explorer interface",
                  "Detailed audit logs & security"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-primary/5 rounded-2xl p-8 border border-primary/10">
              <div className="flex items-center gap-4 mb-8">
                <Rocket className="w-10 h-10 text-primary" />
                <div>
                  <h4 className="font-bold">Premium System Status</h4>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[98%]" />
                </div>
                <p className="text-xs text-muted-foreground text-right">99.9% System Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-muted-foreground">
        <div className="container mx-auto max-w-6xl">
          <p>© 2026 Premium Connected System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
