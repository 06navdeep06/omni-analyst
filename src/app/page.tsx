'use client';

import { FileText, MessageSquare, Settings, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import QuickAnalysis from "@/components/dashboard/QuickAnalysis";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Optional: Redirect to login or just show public view
        // For this app, let's redirect to login for "everything to work"
        router.push('/login');
        return;
      }
      
      setUser(session.user);

      // Fetch recent reports
      const { data } = await supabase
        .from('reports')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) setRecentReports(data);
      setLoading(false);
    }

    checkAuthAndFetch();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-4 flex flex-col gap-4 hidden md:flex">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Omni-Analyst</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <FileText className="h-4 w-4" />
            Reports
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <div className="border-t border-border pt-4">
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
             <div className="text-sm text-muted-foreground hidden sm:block">
               {user?.email}
             </div>
             <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user?.email?.substring(0, 2).toUpperCase()}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="col-span-full">
              <QuickAnalysis />
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow p-6 h-64 overflow-hidden flex flex-col">
              <h3 className="font-semibold mb-4">Recent Reports</h3>
              {recentReports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No reports generated yet.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto">
                    {recentReports.map(report => (
                        <Link 
                            key={report.id} 
                            href={`/report/${report.id}`}
                            className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="font-medium text-sm truncate">{report.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {new Date(report.created_at).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}
                </div>
              )}
            </div>

            {/* Usage Stats Placeholder */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow p-6 h-64">
              <h3 className="font-semibold mb-2">Usage Statistics</h3>
              <div className="flex items-center justify-center h-full pb-6">
                  <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                          {recentReports.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Reports</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
