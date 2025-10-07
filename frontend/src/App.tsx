import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { DatabaseConnector } from "@/components/DatabaseConnector";
import { DocumentUploader } from "@/components/DocumentUploader";
import { QueryPanel, QueryHistoryItem } from "@/components/QueryPanel"; // Import the exported type
import { ResultsView } from "@/components/ResultsView";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function App() {
  const [connectionString, setConnectionString] = useState("");
  const [queryResults, setQueryResults] = useState(null);
  const [schema, setSchema] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("database");
  
  // --- THIS IS THE FIX ---
  // The query history state is now managed by the parent App component.
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  // --------------------

  const loadHistoryQueryInPanel = (query: string) => {
    // A potential function to pass down if you want history clicks to update the input
    // For now, we handle rendering here.
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background font-sans antialiased">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex items-center"><span className="font-bold text-lg">NLP Query Engine</span></div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <nav className="flex items-center"><ModeToggle /></nav>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-4 md:p-8">
          <main className="grid flex-1 items-start gap-8 md:grid-cols-[1fr_350px]">
            <div className="grid gap-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="database">1. Database</TabsTrigger>
                  <TabsTrigger value="documents">2. Documents</TabsTrigger>
                  <TabsTrigger value="query">3. Query</TabsTrigger>
                </TabsList>
                
                <TabsContent value="database" className="mt-6">
                  <DatabaseConnector setConnectionString={setConnectionString} setSchema={setSchema} />
                </TabsContent>
                
                <TabsContent value="documents" className="mt-6">
                  <DocumentUploader />
                </TabsContent>

                <TabsContent value="query" className="mt-6">
                  <div className="grid gap-6">
                    {/* --- THIS IS THE FIX --- */}
                    {/* Components are now rendered in the correct logical order */}
                    
                    {/* 1. The Query Panel */}
                    <QueryPanel 
                      setQueryResults={setQueryResults} 
                      connectionString={connectionString}
                      setQueryHistory={setQueryHistory} // Pass the history setter down
                    />
                    
                    {/* 2. The Results View (if there are results) */}
                    {queryResults && <ResultsView results={queryResults} />}

                    {/* 3. The Query History (at the bottom) */}
                    {queryHistory.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-4 w-4" /> Query History</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {queryHistory.map((item) => (
                              <div 
                                key={item.id} 
                                className="p-3 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                // Note: onClick functionality would need to pass a setter for the query input back down
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm flex-1">{item.query}</p>
                                  <Badge variant="outline" className="flex-shrink-0">{item.type}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{item.timestamp.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {/* ------------------------- */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <aside className="sticky top-20 hidden flex-col gap-8 md:flex">
              <MetricsDashboard />
            </aside>
          </main>
        </div>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;

