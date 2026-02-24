'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, MessageSquare, FileText, Share2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Report = {
  id: string;
  title: string;
  summary: string;
  key_insights: string[];
  created_at: string;
  file_path?: string;
  file_type?: string;
};

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Unwrap params
  const { id } = use(params);

  useEffect(() => {
    async function fetchReportAndChat() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUserId(session.user.id);

        // Fetch Report
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (reportError) throw reportError;
        setReport(reportData);

        // Fetch Chat History
        // First get session id
        const { data: chatSession } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('report_id', id)
          .eq('user_id', session.user.id)
          .single();
        
        if (chatSession) {
          const { data: history } = await supabase
            .from('messages')
            .select('role, content')
            .eq('session_id', chatSession.id)
            .order('created_at', { ascending: true });
          
          if (history) setMessages(history);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReportAndChat();
  }, [id, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          reportId: id,
          userId: userId
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      console.error(err);
      // Optional: Show error in chat
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Report not found'}</p>
        <Link href="/" className="text-primary hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border h-16 flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-lg">{report.title}</h1>
            <p className="text-xs text-muted-foreground">
              Generated on {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Report Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-10 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold uppercase tracking-wider">Executive Summary</h2>
            </div>
            <div className="prose prose-invert max-w-none bg-card p-6 rounded-xl border border-border shadow-sm">
              <p className="leading-relaxed whitespace-pre-wrap">{report.summary}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-5 w-5 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <h2 className="text-lg font-semibold uppercase tracking-wider">Key Insights</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {report.key_insights.map((insight, idx) => (
                <div key={idx} className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Chat Sidebar */}
        <aside className="w-96 border-l border-border bg-card flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center opacity-70">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p>Ask questions about your data to get deeper insights.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg p-3 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                placeholder="Ask a question..." 
                className="w-full h-10 rounded-md border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <button 
                type="submit"
                disabled={!input.trim() || sending}
                className="absolute right-2 top-2 p-1 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}
