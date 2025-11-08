import React from 'react';
import { TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Target, Award, Activity } from 'lucide-react';

const AnalyticsSummary = ({ stats, trends, loading }) => {
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getTrendIcon = (trend) => {
    return trend >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      trend: trends?.revenue || 0,
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
      textColor: 'text-white'
    },
    {
      title: 'Active Students',
      value: stats.totalStudents || 0,
      icon: Users,
      trend: trends?.students || 0,
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-white'
    },
    {
      title: 'Course Performance',
      value: `${stats.totalCourses > 0 ? ((stats.activeCourses / stats.totalCourses) * 100).toFixed(0) : 0}%`,
      icon: BookOpen,
      trend: trends?.courses || 0,
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-white'
    },
    {
      title: 'Avg Completion',
      value: `${trends?.avgCompletion || 0}%`,
      icon: Target,
      trend: trends?.completion || 0,
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {summaryCards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-white bg-opacity-20`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(card.trend)}
              <span className={`text-sm font-medium ${card.textColor} opacity-90`}>
                {card.trend >= 0 ? '+' : ''}{card.trend}%
              </span>
            </div>
          </div>
          
          <div className={`${card.textColor}`}>
            <p className="text-sm opacity-80 mb-1">{card.title}</p>
            <p className="text-2xl font-bold">
              {loading ? '...' : card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsSummary;