'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'gray' | 'blue';
}

export function LoadingSpinner({ size = 'md', color = 'orange' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    orange: 'border-orange-600',
    gray: 'border-gray-600',
    blue: 'border-blue-600'
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]}`}></div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="ml-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4 sm:mb-0"></div>
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
        <LoadingSpinner size="lg" color="gray" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </td>
    </tr>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-64 mb-2 animate-pulse"></div>
            <div className="flex items-center gap-4">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-28 animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Metrics Grid Skeleton */}
          <div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }, (_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <ChartSkeleton />

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {Array.from({ length: 6 }, (_, i) => (
                      <th key={i} className="px-6 py-3">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PulseAnimationProps {
  children: React.ReactNode;
  delay?: number;
}

export function PulseAnimation({ children, delay = 0 }: PulseAnimationProps) {
  return (
    <div 
      className="animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, duration = 300 }: FadeInProps) {
  return (
    <div 
      className="animate-fadeIn"
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}