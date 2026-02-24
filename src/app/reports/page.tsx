'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Calendar, ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

type Report = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  file_type: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);

        const { data, error } = await supabase
          .from('reports')
          .select('id, title, summary, created_at, file_type')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
       {/* Sidebar (Simplified for now, ideally a component) */}
       <aside className="w-64 border-r border-border p-4 flex flex-col gap-4 hidden md:flex">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Omni-Analyst</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
            <FileText className="h-4 w-4" />
            Reports
          </Link>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Reports Library</h1>
          <div className="text-sm text-muted-foreground">
             {user?.email}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <FileText className="h-12 w-12 opacity-20" />
              <p>No reports found. Generate one from the dashboard!</p>
              <Link href="/" className="text-primary hover:underline">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <Link 
                  href={`/report/${report.id}`} 
                  key={report.id}
                  className="group block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {report.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {report.summary}
                  </p>
                  
                  <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Report <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
