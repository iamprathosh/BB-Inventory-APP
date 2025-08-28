"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Line,
  Legend
} from "recharts";
import { 
  Package, 
  TrendingDown, 
  Activity, 
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Database,
  Eye,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from "lucide-react";

export default function AnalyticsPage() {
  const analytics = useQuery(api.analytics.getDashboardAnalytics);
  const trends = useQuery(api.analytics.getInventoryTrends);
  const logs = useQuery(api.logs.list);
  const projectActivities = useQuery(api.analytics.getProjectActivities);
  const createSampleData = useMutation(api.sampleData.createSampleData);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);

  const handleCreateSampleData = async () => {
    setIsCreatingSampleData(true);
    try {
      await createSampleData();
    } finally {
      setIsCreatingSampleData(false);
    }
  };

  // Loading skeletons
  const StatsCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );

  const ChartSkeleton = ({ height = "h-64" }: { height?: string }) => (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className={`${height} bg-gray-100 rounded animate-pulse`} />
      </CardContent>
    </Card>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <LoggedInLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights and metrics for your business
            </p>
          </div>
        </div>

        {/* Show sample data button if no data */}
        {analytics?.kpis.totalProducts === 0 && (
          <Card className="border-dashed border-2 border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-primary/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground text-center mb-4">
                To see the full analytics dashboard in action, create some sample data first.
              </p>
              <Button 
                onClick={handleCreateSampleData} 
                disabled={isCreatingSampleData}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isCreatingSampleData ? 'animate-spin' : ''}`} />
                {isCreatingSampleData ? 'Creating...' : 'Create Sample Data'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analytics === undefined ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card className="border-0 shadow-lg transition-all duration-200 hover:scale-105" style={{
                background: 'linear-gradient(135deg, #D10D38 0%, #B8082F 100%)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Inventory Value</CardTitle>
                  <DollarSign className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(analytics.kpis.totalInventoryValue)}
                  </div>
                  <p className="text-xs text-white/80">
                    Current market value
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg transition-all duration-200 hover:scale-105" style={{
                background: 'linear-gradient(135deg, #0374EF 0%, #0256C7 100%)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Inventory Turnover</CardTitle>
                  <RefreshCw className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {analytics.kpis.inventoryTurnoverRate.toFixed(2)}x
                  </div>
                  <p className="text-xs text-white/80">
                    Annual turnover rate
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg transition-all duration-200 hover:scale-105" style={{
                background: 'linear-gradient(135deg, #EF7037 0%, #D4551F 100%)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Stock Alerts</CardTitle>
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {analytics.kpis.stockAlerts}
                  </div>
                  <p className="text-xs text-white/80">
                    Items need reordering
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg transition-all duration-200 hover:scale-105" style={{
                background: 'linear-gradient(135deg, #886DE8 0%, #6B46C1 100%)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Active Projects</CardTitle>
                  <Users className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {analytics.kpis.activeProjects}
                  </div>
                  <p className="text-xs text-white/80">
                    Currently running
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Inventory Activity */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Inventory Activity
              </CardTitle>
              <CardDescription>
                Inventory pulled or returned in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'pull' 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {activity.type === 'pull' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === 'pull' ? 'Pulled' : 'Returned'} {Math.abs(activity.quantity)} units
                          {activity.project && ` for ${activity.project.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(Math.abs(activity.quantity) * activity.unitPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* External Project Activities */}
        {projectActivities && projectActivities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activities by Active Projects
              </CardTitle>
              <CardDescription>
                Recent activities from external project management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectActivities.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{project.projectName}</h4>
                    <div className="space-y-2">
                      {project.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'task_completed' ? 'bg-green-500' :
                            activity.type === 'task_started' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`} />
                          <span className="text-muted-foreground">{activity.description}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Category Breakdown Pie Chart */}
          {analytics === undefined ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Inventory by Category
                </CardTitle>
                <CardDescription>
                  Distribution of inventory value across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.charts.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.charts.categoryBreakdown.map((entry, index) => {
                          const colors = ['#D10D38', '#0374EF', '#886DE8', '#F7C959', '#EF7037']; // B&B Brand Colors
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
          )}

          {/* Stock Level Distribution */}
          {trends === undefined ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Level Distribution
                </CardTitle>
                <CardDescription>
                  Products grouped by stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.stockDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      >
                        {trends.stockDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Sales Trend */}
          {analytics === undefined ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sales Trend (6 Months)
                </CardTitle>
                <CardDescription>
                  Monthly sales performance and transaction count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.charts.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'sales' ? formatCurrency(value) : value,
                          name === 'sales' ? 'Sales' : 'Transactions'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="sales" 
                        fill="#D10D38" 
                        name="Sales"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="#0374EF" 
                        strokeWidth={2}
                        name="Transactions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products by Value */}
          {analytics === undefined ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Top Products by Value
                </CardTitle>
                <CardDescription>
                  Highest value products in inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.charts.topProducts} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar 
                        dataKey="value" 
                        fill="#886DE8" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Alerts and Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Stock Alerts
              </CardTitle>
              <CardDescription>
                Products that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics === undefined ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : analytics.alerts.stockAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>All products are well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.alerts.stockAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{alert.name}</p>
                        <p className="text-sm text-muted-foreground">{alert.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {alert.currentStock} left
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reorder at {alert.reorderLevel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Purchase Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Open Purchase Orders
              </CardTitle>
              <CardDescription>
                Pending orders awaiting delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics === undefined ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : analytics.alerts.openPOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <p>No pending purchase orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.alerts.openPOs.map((po) => (
                    <div key={po.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{po.poNumber}</p>
                        <p className="text-sm text-muted-foreground">{po.supplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(po.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest 10 activities in your inventory system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No activities yet. Start by creating some sample data or adding products!
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.slice(0, 10).map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="text-sm">
                          {new Date(log._creationTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.user?.name ?? "System"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.action.includes('Added') ? 'default' : 
                                   log.action.includes('Updated') ? 'secondary' :
                                   log.action.includes('Deleted') ? 'destructive' : 'outline'}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </LoggedInLayout>
  );
}
