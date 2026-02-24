'use client';

import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnalysisResult = {
  summary: string;
  key_insights: string[];
  sentiment?: string;
};

export default function QuickAnalysis() {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeContent = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let content = '';
      let type = '';

      if (activeTab === 'upload') {
        if (!file) {
          throw new Error('Please select a file to analyze.');
        }

        // Handle file reading based on type
        if (file.type.startsWith('image/')) {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          type = 'image_url';
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsText(file);
            });
            type = 'text';
        } else {
             // Fallback for other text-based files, might need more robust handling for PDFs etc.
             // For now, let's try reading as text if it's not an image
             try {
                content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
                type = 'text';
             } catch (e) {
                 throw new Error('Unsupported file type. Please upload an image or text file.');
             }
        }
      } else {
        if (!inputValue.trim()) {
          throw new Error('Please enter a URL or text to analyze.');
        }
        content = inputValue;
        type = inputValue.startsWith('http') ? 'url' : 'text';
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight text-lg">Quick Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Analyze text, images, or URLs instantly using AI.
            </p>
          </div>

          <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-4 w-fit">
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'upload' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'url' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <LinkIcon className="h-4 w-4" />
              Paste URL / Text
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative",
                file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50 hover:border-primary/50"
              )}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.txt,.md,.json,.csv" // Limit accepted types for now
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-200">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground/70">Supports Images (JPG, PNG), Text, Markdown</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
                <textarea
                    placeholder="Paste a URL (e.g., https://example.com/image.png) or enter text to analyze..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={analyzeContent}
              disabled={isLoading || (activeTab === 'upload' && !file) || (activeTab === 'url' && !inputValue.trim())}
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Generate Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">Analysis Report</h3>
                    {result.sentiment && (
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            result.sentiment.toLowerCase().includes('positive') ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            result.sentiment.toLowerCase().includes('negative') ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                            {result.sentiment}
                        </span>
                    )}
                </div>
                
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Summary</h4>
                    <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Insights</h4>
                    <ul className="space-y-2">
                        {result.key_insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span>{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
