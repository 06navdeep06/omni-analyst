import { Upload, FileText, MessageSquare, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Omni-Analyst</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="h-8 w-8 rounded-full bg-muted"></div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="col-span-full">
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-col space-y-1.5 pb-4">
                  <h3 className="font-semibold leading-none tracking-tight">Quick Analysis</h3>
                  <p className="text-sm text-muted-foreground">Upload a file or paste a URL to start.</p>
                </div>
                <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-medium">Drag & drop or click to upload</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow p-6 h-48">
              <h3 className="font-semibold mb-2">Recent Reports</h3>
              <p className="text-sm text-muted-foreground">No reports generated yet.</p>
            </div>

            {/* Usage Stats Placeholder */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow p-6 h-48">
              <h3 className="font-semibold mb-2">Usage Statistics</h3>
              <p className="text-sm text-muted-foreground">0/100 Credits Used</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
