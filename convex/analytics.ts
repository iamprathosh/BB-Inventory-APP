import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDashboardAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const purchaseOrders = await ctx.db.query("purchaseOrders").collect();
    const transactions = await ctx.db.query("inventoryTransactions").collect();
    
    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.quantity * product.price);
    }, 0);

    // Calculate cost-based inventory value
    const totalCostValue = products.reduce((sum, product) => {
      const costPrice = product.costPrice || product.price * 0.6; // Assume 60% if no cost price
      return sum + (product.quantity * costPrice);
    }, 0);

    // Stock alerts (products below reorder level)
    const stockAlerts = products.filter(product => {
      const reorderLevel = product.reorderLevel || 10; // Default reorder level
      return product.quantity <= reorderLevel;
    });

    // Open POs
    const openPOs = purchaseOrders.filter(po => po.status === "pending");

    // Calculate inventory turnover rate (simplified)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSales = transactions.filter(t => 
      t.type === "sale" && t.date >= thirtyDaysAgo
    );
    
    const totalSalesValue = recentSales.reduce((sum, sale) => {
      return sum + (Math.abs(sale.quantity) * sale.unitPrice);
    }, 0);

    const inventoryTurnoverRate = totalCostValue > 0 ? 
      (totalSalesValue / totalCostValue) * 12 : 0; // Annualized

    // Category breakdown
    const categoryData = products.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, count: 0 };
      }
      acc[category].value += product.quantity * product.price;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    // Monthly sales trend (last 6 months)
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    const monthlySales = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = Date.now() - (i * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = Date.now() - ((i - 1) * 30 * 24 * 60 * 60 * 1000);
      
      const monthTransactions = transactions.filter(t => 
        t.type === "sale" && t.date >= monthStart && t.date < monthEnd
      );
      
      const monthSales = monthTransactions.reduce((sum, sale) => {
        return sum + (Math.abs(sale.quantity) * sale.unitPrice);
      }, 0);

      const monthName = new Date(monthStart).toLocaleDateString('en-US', { month: 'short' });
      monthlySales.push({
        month: monthName,
        sales: monthSales,
        transactions: monthTransactions.length
      });
    }

    // Top products by value
    const topProducts = products
      .map(product => ({
        name: product.name,
        value: product.quantity * product.price,
        quantity: product.quantity,
        sku: product.sku
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      kpis: {
        totalInventoryValue,
        inventoryTurnoverRate,
        stockAlerts: stockAlerts.length,
        openPOs: openPOs.length,
        totalProducts: products.length,
        totalCategories: Object.keys(categoryData).length
      },
      charts: {
        categoryBreakdown: Object.values(categoryData),
        monthlySales,
        topProducts
      },
      alerts: {
        stockAlerts: stockAlerts.map(product => ({
          id: product._id,
          name: product.name,
          sku: product.sku,
          currentStock: product.quantity,
          reorderLevel: product.reorderLevel || 10
        })),
        openPOs: openPOs.map(po => ({
          id: po._id,
          poNumber: po.poNumber,
          supplier: po.supplier,
          totalAmount: po.totalAmount,
          orderDate: po.orderDate
        }))
      }
    };
  }
});

export const getInventoryTrends = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    // Stock level distribution
    const stockDistribution = {
      outOfStock: products.filter(p => p.quantity === 0).length,
      lowStock: products.filter(p => p.quantity > 0 && p.quantity <= 10).length,
      mediumStock: products.filter(p => p.quantity > 10 && p.quantity <= 50).length,
      highStock: products.filter(p => p.quantity > 50).length,
    };

    return {
      stockDistribution: [
        { name: 'Out of Stock', value: stockDistribution.outOfStock, color: '#D10D38' }, // B&B Primary Red
        { name: 'Low Stock', value: stockDistribution.lowStock, color: '#EF7037' }, // B&B Accent 4
        { name: 'Medium Stock', value: stockDistribution.mediumStock, color: '#F7C959' }, // B&B Accent 3
        { name: 'High Stock', value: stockDistribution.highStock, color: '#0374EF' } // B&B Accent 1 Blue
      ]
    };
  }
});
