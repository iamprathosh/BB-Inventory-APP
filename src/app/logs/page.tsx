"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Activity } from "lucide-react";

export default function LogsPage() {
  const logs = useQuery(api.logs.list);

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex space-x-4 items-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("Added")) return "default";
    if (action.includes("Updated")) return "secondary";
    if (action.includes("Deleted")) return "destructive";
    return "outline";
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  return (
    <LoggedInLayout title="Activity Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              View all activities and changes in your inventory system
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{logs?.length ?? 0} total activities</span>
          </div>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity History
            </CardTitle>
            <CardDescription>
              Complete history of all actions performed in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs === undefined ? (
              <TableSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3 text-muted-foreground">
                          <Activity className="h-12 w-12 opacity-50" />
                          <div className="space-y-1">
                            <p className="text-lg font-medium">No activities yet</p>
                            <p className="text-sm">
                              Activity logs will appear here when you start using the system
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => {
                      const { date, time } = formatDateTime(log._creationTime);
                      return (
                        <TableRow key={log._id} className={index === 0 ? "bg-blue-50/50" : ""}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{date}</span>
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                                <User className="h-3 w-3" />
                              </div>
                              <span className="font-medium">
                                {log.user?.name ?? "System"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getActionBadgeVariant(log.action) as "default" | "secondary" | "destructive" | "outline"}
                              className="font-medium"
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-md">
                            <p className="truncate" title={log.details}>
                              {log.details}
                            </p>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {logs && logs.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time activity count
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {logs.length > 0 ? "Active" : "None"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {logs.length > 0 
                    ? `Last: ${formatDateTime(logs[0]._creationTime).time}`
                    : "No recent activity"
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(logs.map(log => log.user?.name ?? "System")).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique users with activity
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </LoggedInLayout>
  );
}
