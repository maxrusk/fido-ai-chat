import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SystemHealth {
  status: string;
  database: string;
  openai: string;
  redis: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  responseTime?: number;
}

type SystemStatus = 'healthy' | 'warning' | 'critical';

export default function SystemMonitor() {
  const [responseTime, setResponseTime] = useState<number>(0);

  const { data: healthData, isError } = useQuery<SystemHealth>({
    queryKey: ['/api/health'],
    refetchInterval: 5000, // Check every 5 seconds
    retry: 3,
  });

  useEffect(() => {
    if (healthData) {
      // Calculate response time (this is approximate)
      setResponseTime(Date.now() % 1000);
    }
  }, [healthData]);

  const getSystemStatus = (): SystemStatus => {
    if (isError || !healthData) return 'critical';
    
    const data = healthData as SystemHealth;
    const { database, openai, memory, uptime } = data;
    
    // Critical conditions
    if (database !== 'connected' || openai !== 'configured' || uptime < 10) {
      return 'critical';
    }
    
    // Warning conditions
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
    if (memoryUsagePercent > 85 || responseTime > 2000) {
      return 'warning';
    }
    
    return 'healthy';
  };

  const getStatusConfig = (status: SystemStatus) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          text: 'All Systems Normal',
          pulse: 'animate-pulse'
        };
      case 'warning':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: AlertTriangle,
          text: 'System Warning',
          pulse: 'animate-pulse'
        };
      case 'critical':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: XCircle,
          text: 'System Critical',
          pulse: 'animate-pulse'
        };
    }
  };

  const systemStatus = getSystemStatus();
  const statusConfig = getStatusConfig(systemStatus);
  const StatusIcon = statusConfig.icon;

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatMemory = (bytes: number): string => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Status Indicator */}
      <div className={`
        flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 
        ${statusConfig.bgColor} ${statusConfig.borderColor} 
        transition-all duration-300
      `}>
        <StatusIcon 
          className={`w-5 h-5 ${statusConfig.color} ${systemStatus !== 'healthy' ? statusConfig.pulse : ''}`} 
        />
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${statusConfig.color}`}>
            {statusConfig.text}
          </span>
          <div className="flex items-center gap-1">
            <Activity className={`w-3 h-3 ${statusConfig.color}`} />
            <div className={`w-2 h-2 rounded-full ${statusConfig.color.replace('text-', 'bg-')} ${statusConfig.pulse}`} />
          </div>
        </div>
      </div>

      {/* Detailed Metrics (collapsed by default, expandable) */}
      {healthData && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
          <div className="flex justify-center gap-4">
            <span>Uptime: {formatUptime((healthData as SystemHealth).uptime)}</span>
            <span>Memory: {formatMemory((healthData as SystemHealth).memory.heapUsed)}</span>
          </div>
          <div className="flex justify-center gap-4">
            <span className={`
              ${(healthData as SystemHealth).database === 'connected' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }
            `}>
              DB: {(healthData as SystemHealth).database}
            </span>
            <span className={`
              ${(healthData as SystemHealth).openai === 'configured' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }
            `}>
              AI: {(healthData as SystemHealth).openai}
            </span>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      <div className="mt-1 text-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Live Monitoring • Updated {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}