// src/services/analyticsService.js — Seller & platform analytics
const supabase = require('../config/supabase');

async function getSellerDashboard(sellerId) {
  // Total earnings
  const { data: earningsData } = await supabase
    .from('seller_earnings')
    .select('net_amount, gross_amount, platform_commission, status')
    .eq('seller_id', sellerId);

  const totalEarnings = (earningsData || []).reduce((sum, e) => sum + e.net_amount, 0);
  const pendingEarnings = (earningsData || []).filter(e => e.status === 'pending').reduce((sum, e) => sum + e.net_amount, 0);
  const availableEarnings = (earningsData || []).filter(e => e.status === 'available').reduce((sum, e) => sum + e.net_amount, 0);
  const totalSales = (earningsData || []).length;

  // Total notes listed
  const { count: notesCount } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .neq('status', 'deleted');

  // Total downloads across all notes
  const { data: notesData } = await supabase
    .from('notes')
    .select('download_count, rating, rating_count')
    .eq('seller_id', sellerId)
    .neq('status', 'deleted');

  const totalDownloads = (notesData || []).reduce((sum, n) => sum + (n.download_count || 0), 0);
  const avgRating = notesData?.length
    ? (notesData.reduce((sum, n) => sum + (n.rating || 0), 0) / notesData.length).toFixed(2)
    : 0;

  return {
    total_earnings: totalEarnings,
    available_earnings: availableEarnings,
    pending_earnings: pendingEarnings,
    total_sales: totalSales,
    total_notes: notesCount || 0,
    total_downloads: totalDownloads,
    avg_rating: parseFloat(avgRating)
  };
}

async function getSellerSalesChart(sellerId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: sales } = await supabase
    .from('seller_earnings')
    .select('net_amount, created_at')
    .eq('seller_id', sellerId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  // Group by day
  const chartData = {};
  (sales || []).forEach(sale => {
    const day = sale.created_at.slice(0, 10);
    chartData[day] = (chartData[day] || 0) + sale.net_amount;
  });

  return Object.entries(chartData).map(([date, revenue]) => ({ date, revenue }));
}

async function getAdminAnalytics() {
  const [usersCount, notesCount, purchasesCount, revenueData] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('payments').select('amount').eq('status', 'completed')
  ]);

  const totalRevenue = (revenueData.data || []).reduce((sum, p) => sum + p.amount, 0);
  const platformRevenue = totalRevenue * parseFloat(process.env.PLATFORM_COMMISSION || 0.2);

  return {
    total_users: usersCount.count || 0,
    total_notes: notesCount.count || 0,
    total_purchases: purchasesCount.count || 0,
    total_gmv: totalRevenue,
    platform_revenue: platformRevenue
  };
}

module.exports = { getSellerDashboard, getSellerSalesChart, getAdminAnalytics };
