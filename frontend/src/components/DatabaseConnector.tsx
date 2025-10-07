import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle2, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Props definition to communicate with the parent App component
interface DatabaseConnectorProps {
  setSchema: (schema: any | null) => void;
  setConnectionString: (cs: string) => void;
}

// Interfaces to define the shape of data for type safety
interface SchemaTable { 
    name: string; 
    columns: Array<{ name: string; type: string; isPrimary: boolean; isForeign: boolean; }>; 
}
interface ApiTable { 
    name: string; 
    columns: Array<{ name: string; type: string; is_primary_key: boolean; }>; 
    foreign_keys: Array<{ constrained_columns: string[] }>; 
}

export const DatabaseConnector = ({ setSchema, setConnectionString }: DatabaseConnectorProps) => {
  const [localConnectionString, setLocalConnectionString] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [schemaData, setSchemaData] = useState<SchemaTable[] | null>(null); // Local state for rendering the schema
  const { toast } = useToast();

  const handleTestConnection = async () => {
    // Validate input before making an API call
    if (!localConnectionString.trim()) {
      toast({ title: "Connection string required", variant: "destructive" });
      return;
    }

    // Reset state for a new connection attempt
    setIsConnecting(true);
    setIsConnected(false);
    setSchema(null);
    setSchemaData(null);
    setConnectionString("");

    try {
      // Make the API call to the backend
      const response = await fetch('http://localhost:8000/api/connect-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_string: localConnectionString }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "An unknown error occurred.");
      }

      // Transform the raw API response into the format needed by the frontend UI
      const apiSchema = data.tables as ApiTable[];
      const foreignKeyColumns = new Set<string>();
      apiSchema.forEach(table => 
        table.foreign_keys.forEach(fk => 
          fk.constrained_columns.forEach(col => foreignKeyColumns.add(`${table.name}.${col}`))
        )
      );

      const formattedSchema: SchemaTable[] = apiSchema.map(table => ({
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          isPrimary: col.is_primary_key,
          isForeign: foreignKeyColumns.has(`${table.name}.${col.name}`),
        })),
      }));
      
      // Update parent and local state on success
      setSchema(formattedSchema);
      setSchemaData(formattedSchema);
      setConnectionString(localConnectionString);
      setIsConnected(true);
      toast({ title: "Connection Successful", description: `Discovered ${formattedSchema.length} tables.` });

    } catch (error: any) {
      // Handle any errors during the connection process
      setIsConnected(false);
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
          <CardDescription>
            Connect to your database to discover and analyze its schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection-string">Connection String</Label>
            <Input
              id="connection-string"
              type="text"
              placeholder="postgresql://user:password@host:port/database"
              value={localConnectionString}
              onChange={(e) => setLocalConnectionString(e.target.value)}
              disabled={isConnecting}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={isConnecting || !localConnectionString.trim()}
              className="gap-2"
            >
              {isConnecting ? ( <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</> ) : ( <>Connect & Analyze</> )}
            </Button>
            {isConnected && ( <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" /> Connected</Badge> )}
          </div>
        </CardContent>
      </Card>

      {/* This section renders the discovered schema after a successful connection */}
      {schemaData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Discovered Schema
            </CardTitle>
            <CardDescription>
              {schemaData.length} tables found in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schemaData.map((table) => (
                <div
                  key={table.name}
                  className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                >
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Table className="h-4 w-4 text-primary" />
                    {table.name}
                  </h4>
                  <div className="grid gap-2">
                    {table.columns.map((column) => (
                      <div
                        key={column.name}
                        className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                      >
                        <span className="font-mono">{column.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                          {column.isPrimary && (
                            <Badge variant="default" className="text-xs">PK</Badge>
                          )}
                          {column.isForeign && (
                            <Badge variant="secondary" className="text-xs">FK</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

