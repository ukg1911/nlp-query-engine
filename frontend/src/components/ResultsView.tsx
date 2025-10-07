import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, FileText, Clock, AlertTriangle, Zap, ZapOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

// --- TypeScript Interfaces ---

interface SQLData {
  [key: string]: string | number | boolean | null;
}

interface DocumentData {
  filename: string;
  snippet: string;
  relevance_score: number;
}

interface ResultItem {
  source: "Database" | "Documents";
  query?: string;
  data: SQLData[] | DocumentData[] | { error: string };
}

interface ResultsViewProps {
  results: {
    user_query: string;
    query_type: string;
    results: ResultItem[];
    performance_metrics: {
      response_time_seconds: number;
      cache_status: "hit" | "miss";
    };
  } | null;
}

// --- Helper Components for Rendering ---

const SQLResultTable = ({ data }: { data: SQLData[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  }, [data, currentPage]);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No records returned from the database.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map(header => (
                  <TableCell key={`${rowIndex}-${header}`}>{String(row[header])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentResultCard = ({ data }: { data: DocumentData[] }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No relevant documents found.</p>;
  }
    
  return (
    <div className="space-y-4">
      {data.map((doc, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <h5 className="font-semibold text-primary">{doc.filename}</h5>
                <Badge variant="secondary">{`${(doc.relevance_score * 100).toFixed(0)}% match`}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{doc.snippet}</p>
        </div>
      ))}
    </div>
  );
};

// --- Main ResultsView Component ---

export const ResultsView = ({ results }: ResultsViewProps) => {
  if (!results) {
    return null; // Don't render anything if there are no results
  }

  const renderResultData = (result: ResultItem) => {
    // Check for an error object in the data
    if (typeof result.data === 'object' && result.data !== null && !Array.isArray(result.data) && 'error' in result.data) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-mono">{result.data.error}</p>
        </div>
      );
    }

    if (result.source === "Database" && Array.isArray(result.data)) {
      return <SQLResultTable data={result.data as SQLData[]} />;
    }
    
    if (result.source === "Documents" && Array.isArray(result.data)) {
      return <DocumentResultCard data={result.data as DocumentData[]} />;
    }
    
    return <p className="text-sm text-muted-foreground">Could not render results.</p>;
  };
  
  const isCacheHit = results.performance_metrics.cache_status === "hit";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Results for: "{results.user_query}"</CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
           <div className="flex items-center gap-1">
             <Clock className="h-4 w-4" />
             <span>{results.performance_metrics.response_time_seconds}s</span>
           </div>
           <div className="flex items-center gap-1">
             <Badge variant="outline">{results.query_type}</Badge>
           </div>
           <div className={`flex items-center gap-1 font-semibold ${isCacheHit ? 'text-green-500' : 'text-orange-500'}`}>
             {isCacheHit ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" /> }
             <span>Cache {isCacheHit ? 'Hit' : 'Miss'}</span>
           </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.results.map((result, index) => (
          <div key={index}>
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              {result.source === "Database" ? <Database className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              Source: {result.source}
            </h4>
            <div className="p-4 border rounded-md bg-muted/50">
              {renderResultData(result)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

