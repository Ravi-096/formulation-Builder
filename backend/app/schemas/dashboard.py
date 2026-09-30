from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class MetricStat(BaseModel):
    value: str
    change: str
    trend: str  # "up" | "down"
    period: str
    description: Optional[str] = None


class DashboardStatsResponse(BaseModel):
    success: bool = True
    stats: Dict[str, MetricStat]


class ActivityUser(BaseModel):
    name: str
    email: str
    avatar: str


class ActivityItem(BaseModel):
    id: str
    user: ActivityUser
    action: str
    details: str
    amount: str
    status: str  # "completed" | "pending" | "in_progress" | "failed"
    timestamp: str
    category: str


class RecentActivityResponse(BaseModel):
    success: bool = True
    activities: List[ActivityItem]
    total: int


class WeeklyTrafficItem(BaseModel):
    day: str
    visits: int
    pageViews: int
    bounceRate: str


class DeviceBreakdown(BaseModel):
    platform: str
    percentage: int
    color: str


class ServerMetrics(BaseModel):
    uptime: str
    avgLatency: str
    errorRate: str
    requestsPerMin: str


class AnalyticsData(BaseModel):
    weeklyTraffic: List[WeeklyTrafficItem]
    devices: List[DeviceBreakdown]
    serverMetrics: ServerMetrics


class AnalyticsResponse(BaseModel):
    success: bool = True
    analytics: AnalyticsData
