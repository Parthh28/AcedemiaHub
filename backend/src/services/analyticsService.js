// src/services/analyticsService.js — Seller & platform analytics
const supabase = require('../config/supabase');

async function getSellerDashboard(sellerId) {
  // Total earnings
  const { data: earningsData } = await supabase
    .from('seller_earnings')
    .select('net_amount, gross_amount, platform_commission, status')
    .eq('seller_id', sellerId);

  const sellerEarningsOnly = (earningsData || []).filter(e => e.gross_amount > 0);
  const totalEarnings = sellerEarningsOnly.reduce((sum, e) => sum + e.net_amount, 0);
  const pendingEarnings = sellerEarningsOnly.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.net_amount, 0);
  
  // Available earnings acts as the user's wallet balance, so it MUST include debits from purchases
  const availableEarnings = (earningsData || []).filter(e => e.status === 'available').reduce((sum, e) => sum + e.net_amount, 0);
  
  // Calculate total spent by looking at negative net_amount (purchases)
  const buyerSpendData = (earningsData || []).filter(e => e.gross_amount < 0);
  const totalSpent = buyerSpendData.reduce((sum, e) => sum + Math.abs(e.net_amount), 0);
  
  // Sales count should only count actual sales, not purchases
  const totalSales = sellerEarningsOnly.length;

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

  // Global Subject Demand for Market Insights
  const { data: allNotes } = await supabase
    .from('notes')
    .select('subject, price, download_count')
    .eq('status', 'live');
    
  const subjectsMap = {};
  (allNotes || []).forEach(n => {
    const name = n.subject || 'General';
    const revenue = (n.price || 0) * (n.download_count || 0);
    if (!subjectsMap[name]) subjectsMap[name] = 0;
    subjectsMap[name] += revenue;
  });
  
  const subjectDemand = Object.entries(subjectsMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  return {
    total_earnings: totalEarnings,
    available_earnings: availableEarnings,
    pending_earnings: pendingEarnings,
    total_sales: totalSales,
    total_spent: totalSpent,
    total_notes: notesCount || 0,
    total_downloads: totalDownloads,
    avg_rating: parseFloat(avgRating),
    subject_demand: subjectDemand
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
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersCount, notesCount, purchasesCount, newNotesCount, totalEarnings, recentEarnings] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('notes').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
    supabase.from('seller_earnings').select('gross_amount, platform_commission'),
    supabase.from('seller_earnings').select('platform_commission, created_at').gte('created_at', sevenDaysAgo)
  ]);

  const totalGMV = (totalEarnings.data || []).reduce((sum, e) => sum + (e.gross_amount || 0), 0);
  const platformRevenue = (totalEarnings.data || []).reduce((sum, e) => sum + (e.platform_commission || 0), 0);

  // Group weekly revenue by day for chart
  const weeklyData = {};
  for(let i=6; i>=0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      weeklyData[d.toISOString().slice(0,10)] = 0;
  }
  
  (recentEarnings.data || []).forEach(e => {
      const day = e.created_at.slice(0, 10);
      if (weeklyData[day] !== undefined) {
          weeklyData[day] += (e.platform_commission || 0);
      }
  });

  return {
    total_users: usersCount.count || 0,
    total_notes: notesCount.count || 0,
    total_purchases: purchasesCount.count || 0,
    total_gmv: totalGMV,
    platform_revenue: platformRevenue,
    new_notes_today: newNotesCount.count || 0,
    weekly_revenue: Object.entries(weeklyData).map(([date, revenue]) => ({ date, revenue }))
  };
}

module.exports = { getSellerDashboard, getSellerSalesChart, getAdminAnalytics };
