import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, Search, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

// --- TypeScript Interfaces ---
interface MetricCardData {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

interface RecentActivity {
  id: string;
  type: "query" | "upload" | "connection";
  description: string;
  timestamp: string; // ISO string format
  status: "success" | "error";
}

interface MetricsData {
    summary_metrics: MetricCardData[];
    recent_activity: RecentActivity[];
}

// --- Helper Components ---
const MetricCard = ({ metric }: { metric: MetricCardData }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <div className="text-muted-foreground">
          {metric.title.includes("Queries") && <Search className="h-5 w-5" />}
          {metric.title.includes("Documents") && <FileText className="h-5 w-5" />}
          {metric.title.includes("Databases") && <Database className="h-5 w-5" />}
          {metric.title.includes("Time") && <Clock className="h-5 w-5" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value}</div>
        {metric.change && (
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={metric.trend === "up" ? "default" : "secondary"}
              className={
                metric.trend === "up" ? "bg-green-500/20 text-green-700"
                : metric.trend === "down" ? "bg-red-500/20 text-red-700"
                : ""
              }
            >
              {metric.trend !== "neutral" && <TrendingUp className={`h-3 w-3 mr-1 ${metric.trend === 'down' ? 'transform rotate-180' : ''}`} />}
              {metric.change}
            </Badge>
            <p className="text-xs text-muted-foreground">from last month</p>
          </div>
        )}
      </CardContent>
    </Card>
);

// --- Main Dashboard Component ---
export const MetricsDashboard = () => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/metrics');
        if (!response.ok) throw new Error("Failed to fetch metrics.");
        const data = await response.json();
        setMetricsData(data);
      } catch (error: any) {
        toast({
          title: "Could not load dashboard",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, [toast]);

  if (!metricsData) {
      return <p className="text-sm text-muted-foreground text-center p-4">Loading dashboard data...</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {metricsData.summary_metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metricsData.recent_activity.length > 0 ? (
                metricsData.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                    {activity.type === "query" && <Search className="h-4 w-4 text-primary" />}
                    {activity.type === "upload" && <FileText className="h-4 w-4 text-primary" />}
                    {activity.type === "connection" && <Database className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                    </div>
                    {activity.status === 'success' && (
                        <Badge variant="default" className="flex-shrink-0 gap-1 bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Success
                        </Badge>
                    )}
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center">No recent activity to display.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

