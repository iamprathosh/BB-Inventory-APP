"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Package,
  TrendingUp,
  Activity
} from "lucide-react";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;
  
  const analytics = useQuery(api.projects.getProjectAnalytics, { projectId });
  const project = useQuery(api.projects.getProject, { id: projectId });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Debug logging
  console.log("Project ID:", projectId);
  console.log("Project data:", project);
  console.log("Analytics data:", analytics);

  if (!project) {
    return (
      <LoggedInLayout title="Project Analytics">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
            <p className="text-sm text-muted-foreground mt-2">Project ID: {projectId}</p>
          </div>
        </div>
      </LoggedInLayout>
    );
  }

  if (!analytics) {
    return (
      <LoggedInLayout title="Project Analytics">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project analytics...</p>
            <p className="text-sm text-muted-foreground mt-2">Project ID: {projectId}</p>
          </div>
        </div>
      </LoggedInLayout>
    );
  }

  const { project: projectData, totalInventoryCost, userActivity, consumptionData, totalTransactions } = analytics;

  // Prepare chart data
  const consumptionChartData = [
    { name: 'This Week', value: consumptionData.thisWeek.totalValue },
    { name: 'Last Week', value: consumptionData.lastWeek.totalValue },
    { name: 'This Month', value: consumptionData.thisMonth.totalValue },
  ];

  const userActivityChartData = userActivity.map(user => ({
    name: user.user?.name || 'Unknown',
    value: user.totalValue,
    transactions: user.transactionCount,
  }));

  const transactionTimeline = consumptionData.thisMonth.transactions
    .sort((a, b) => a.date - b.date)
    .slice(-10)
    .map(t => ({
      date: formatDate(t.date),
      value: Math.abs(t.quantity) * t.unitPrice,
    }));

  return (
    <LoggedInLayout title={`${project.name} - Analytics`}>
      <div className="space-y-6">
        {/* Project Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </div>
              <Badge className={`${
                project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(project.startDate)}</p>
                </div>
              </div>
              {project.endDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(project.endDate)}</p>
                  </div>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(project.budget)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInventoryCost)}</div>
              <p className="text-xs text-muted-foreground">
                All time inventory costs
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Inventory movements
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userActivity.length}</div>
              <p className="text-xs text-muted-foreground">
                Users with activity
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(consumptionData.thisMonth.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                {consumptionData.thisMonth.count} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Consumption by Time Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Consumption by Time Period
              </CardTitle>
              <CardDescription>
                Inventory costs across different time frames
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#D10D38" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity Distribution
              </CardTitle>
              <CardDescription>
                Inventory costs by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userActivityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userActivityChartData.map((entry, index) => {
                        const colors = ['#D10D38', '#0374EF', '#886DE8', '#F7C959', '#EF7037'];
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Timeline */}
        {transactionTimeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Transaction Timeline
              </CardTitle>
              <CardDescription>
                Inventory costs over the last 10 transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transactionTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="value" stroke="#0374EF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Activity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity Details
            </CardTitle>
            <CardDescription>
              Detailed breakdown of user activity and inventory costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Average per Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivity.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {user.user?.name || 'Unknown User'}
                    </TableCell>
                    <TableCell>{user.transactionCount}</TableCell>
                    <TableCell>{formatCurrency(user.totalValue)}</TableCell>
                    <TableCell>
                      {formatCurrency(user.totalValue / user.transactionCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest inventory movements for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionData.thisMonth.transactions
                  .sort((a, b) => b.date - a.date)
                  .slice(0, 10)
                  .map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{transaction.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'pull' ? 'destructive' : 'default'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.abs(transaction.quantity)}</TableCell>
                      <TableCell>{formatCurrency(Math.abs(transaction.quantity) * transaction.unitPrice)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </LoggedInLayout>
  );
}
