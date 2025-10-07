import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- TypeScript Interfaces ---

// Defines the structure of the data coming back from the API
interface QueryResult {
  user_query: string;
  query_type: "SQL" | "DOCUMENT" | "HYBRID";
  results: any[];
  performance_metrics: {
    response_time_seconds: number;
  };
}

// Defines the structure for a history item (exported for use in App.tsx)
export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  type: "SQL" | "DOCUMENT" | "HYBRID";
}

// Defines the props the component expects from its parent (App.tsx)
interface QueryPanelProps {
  setQueryResults: (results: QueryResult | null) => void;
  connectionString: string;
  setQueryHistory: (updater: (history: QueryHistoryItem[]) => QueryHistoryItem[]) => void;
}
// -------------------------

export const QueryPanel = ({ setQueryResults, connectionString, setQueryHistory }: QueryPanelProps) => {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const { toast } = useToast();

  const suggestions = [
    "how many employees",
    "average salary",
    "resumes with python",
    "highest paid engineers",
  ];

  const handleQuery = async () => {
    // 1. Check for connection string first
    if (!connectionString) {
      toast({
        title: "Database Not Connected",
        description: "Please connect to a database before querying.",
        variant: "destructive",
      });
      return;
    }
    // 2. Check for empty query
    if (!query.trim()) {
      toast({ title: "Query required", variant: "destructive" });
      return;
    }

    setIsQuerying(true);
    setQueryResults(null); // Clear previous results immediately

    try {
      // 3. Make the API call
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data: QueryResult = await response.json();

      if (!response.ok) {
        throw new Error((data as any).detail || "Failed to process query.");
      }
      
      // 4. Lift the results state up to the parent component
      setQueryResults(data);

      // 5. Create the new history item
      const newHistoryItem: QueryHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        query: query.trim(),
        timestamp: new Date(),
        type: data.query_type, // Use the type from the API response
      };
      
      // 6. Lift the history state up to the parent component
      setQueryHistory((prevHistory) => [newHistoryItem, ...prevHistory].slice(0, 10));

      toast({
        title: "Query Executed",
        description: `Results retrieved successfully in ${data.performance_metrics.response_time_seconds}s.`,
      });

    } catch (error: any) {
      toast({ title: "Query Error", description: error.message, variant: "destructive" });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Intelligent Query</CardTitle>
        <CardDescription>Ask questions in natural language - works across databases and documents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., 'Show me all users who ordered in the last month' or 'Find resumes with Python experience'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isQuerying}
            className="min-h-[100px] resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { handleQuery(); } }}
          />
          <p className="text-xs text-muted-foreground">Press Ctrl+Enter (or ⌘+Enter on Mac) to execute.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0"><Sparkles className="h-3 w-3" /> Suggestions:</span>
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>

        <Button onClick={handleQuery} disabled={isQuerying || !query.trim()} className="w-full gap-2" size="lg">
          {isQuerying ? ( <><Loader2 className="h-4 w-4 animate-spin" /> Executing Query...</> ) : ( <><Search className="h-4 w-4" /> Execute Query</> )}
        </Button>
      </CardContent>
    </Card>
  );
};

