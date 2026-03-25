import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui";
import { Trophy, LogOut, LayoutDashboard, Heart, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isScrolled = true; // Simplified for this example

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <Trophy className="text-white h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Fairway<span className="text-primary">Impact</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/charities" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/charities' ? 'text-primary' : 'text-muted-foreground'}`}>
              Charities
            </Link>
            <Link href="/draws" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/draws' ? 'text-primary' : 'text-muted-foreground'}`}>
              Draws
            </Link>
            
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-accent ${location.startsWith('/admin') ? 'text-accent' : 'text-muted-foreground'}`}>
                Admin Panel
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="hidden sm:flex border-primary/20 hover:border-primary/50 text-primary">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                  <span className="font-semibold text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                  <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-border/50 bg-secondary/30 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Trophy className="text-primary h-5 w-5" />
              <span className="font-display font-bold text-xl">FairwayImpact</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              Transforming every round of golf into meaningful charitable impact. Play your game, change the world, win big.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/charities" className="hover:text-primary">Our Charities</Link></li>
              <li><Link href="/draws" className="hover:text-primary">Monthly Draws</Link></li>
              <li><Link href="/register" className="hover:text-primary">Subscribe</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary">Responsible Play</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
