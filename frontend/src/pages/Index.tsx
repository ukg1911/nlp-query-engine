import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Database, FileText, Search, BarChart3, Sparkles } from "lucide-react";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { DatabaseConnector } from "@/components/DatabaseConnector";
import { DocumentUploader } from "@/components/DocumentUploader";
import { QueryPanel } from "@/components/QueryPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NLP Query Engine
              </h1>
              <p className="text-sm text-muted-foreground">
                Intelligent data exploration powered by AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid h-auto p-1 bg-muted/50 backdrop-blur">
            <TabsTrigger 
              value="dashboard" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="database" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="query" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Query</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h2 className="text-2xl font-semibold mb-2">Welcome to NLP Query Engine</h2>
              <p className="text-muted-foreground">
                Connect your database, upload documents, and start exploring your data with natural language queries.
              </p>
            </Card>
            <MetricsDashboard />
          </TabsContent>

          <TabsContent value="database" className="animate-in fade-in-50 duration-500">
            <DatabaseConnector />
          </TabsContent>

          <TabsContent value="documents" className="animate-in fade-in-50 duration-500">
            <DocumentUploader />
          </TabsContent>

          <TabsContent value="query" className="animate-in fade-in-50 duration-500">
            <QueryPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Built with React, TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
