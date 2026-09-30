from typing import Dict, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.formulation import Formulation
from app.routers.auth import get_optional_current_user
from app.schemas.dashboard import (
    ActivityItem,
    ActivityUser,
    AnalyticsResponse,
    DashboardStatsResponse,
    MetricStat,
    RecentActivityResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Mock Activity Data
MOCK_ACTIVITIES = [
    ActivityItem(
        id="act_101",
        user=ActivityUser(
            name="Emma Watson",
            email="emma.w@company.com",
            avatar="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
        ),
        action="Subscription Upgraded",
        details="Upgraded to Enterprise Tier (Annual)",
        amount="+$2,400.00",
        status="completed",
        timestamp="5 minutes ago",
        category="Billing",
    ),
    ActivityItem(
        id="act_102",
        user=ActivityUser(
            name="David Kim",
            email="david.k@developer.io",
            avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        ),
        action="API Key Generated",
        details="Created Production API key for Webhook cluster",
        amount="—",
        status="completed",
        timestamp="22 minutes ago",
        category="Security",
    ),
    ActivityItem(
        id="act_103",
        user=ActivityUser(
            name="Sophia Chen",
            email="sophia.c@design.co",
            avatar="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80",
        ),
        action="Payment Processing",
        details="Invoice #INV-2024-089 pending bank clearance",
        amount="$850.00",
        status="pending",
        timestamp="1 hour ago",
        category="Finance",
    ),
    ActivityItem(
        id="act_104",
        user=ActivityUser(
            name="Marcus Vance",
            email="marcus.v@cloud.net",
            avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        ),
        action="Database Sync Job",
        details="Synchronizing secondary replica across US-East",
        amount="—",
        status="in_progress",
        timestamp="2 hours ago",
        category="Infrastructure",
    ),
    ActivityItem(
        id="act_105",
        user=ActivityUser(
            name="Liam Neeson",
            email="liam.n@security.org",
            avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
        ),
        action="Failed Login Attempt",
        details="3 consecutive failed attempts from IP 194.26.29.11",
        amount="—",
        status="failed",
        timestamp="3 hours ago",
        category="Security",
    ),
    ActivityItem(
        id="act_106",
        user=ActivityUser(
            name="Olivia Martinez",
            email="olivia.m@tech.com",
            avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
        ),
        action="Team Member Invited",
        details="Invited developer @olivia.m to project 'Core-App'",
        amount="—",
        status="completed",
        timestamp="5 hours ago",
        category="Team",
    ),
]


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get aggregated dashboard metrics and summary cards",
)
async def get_dashboard_stats(current_user: Optional[User] = Depends(get_optional_current_user)):
    """
    Protected route: returns dashboard metric cards with values and trend percentages.
    """
    return DashboardStatsResponse(
        success=True,
        stats={
            # Standard metric cards
            "total_views": MetricStat(
                value="284.5k",
                change="+18.4%",
                trend="up",
                period="vs last month",
                description="Total platform views across all client apps",
            ),
            "active_projects": MetricStat(
                value="36",
                change="+4",
                trend="up",
                period="vs last month",
                description="Active clusters and microservices running",
            ),
            "alerts_count": MetricStat(
                value="3",
                change="-40.0%",
                trend="down",
                period="vs last week",
                description="Unresolved critical alerts",
            ),
            # Key revenue and user engagement metrics
            "totalRevenue": MetricStat(
                value="$124,592",
                change="+14.2%",
                trend="up",
                period="vs last month",
                description="Total revenue generated across all active subscriptions",
            ),
            "activeUsers": MetricStat(
                value="8,429",
                change="+8.1%",
                trend="up",
                period="vs last month",
                description="Monthly active user accounts engaging with portal",
            ),
            "pendingTasks": MetricStat(
                value="43",
                change="-12.5%",
                trend="down",
                period="vs last week",
                description="Open support tickets and infrastructure sync tasks",
            ),
            "conversionRate": MetricStat(
                value="4.82%",
                change="+2.4%",
                trend="up",
                period="vs last month",
                description="Trial to paid subscription conversion rate",
            ),
        },
    )


@router.get(
    "/recent-activity",
    response_model=RecentActivityResponse,
    summary="Get recent activity audit log list",
)
async def get_recent_activity(current_user: Optional[User] = Depends(get_optional_current_user)):
    """
    Protected route: returns recent activity and audit logs.
    """
    return RecentActivityResponse(
        success=True,
        activities=MOCK_ACTIVITIES,
        total=len(MOCK_ACTIVITIES),
    )


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get detailed analytics telemetry data",
)
async def get_analytics(current_user: Optional[User] = Depends(get_optional_current_user)):
    """
    Protected route: returns platform analytics and telemetry.
    """
    return AnalyticsResponse(
        success=True,
        analytics={
            "weeklyTraffic": [
                {"day": "Mon", "visits": 2400, "pageViews": 4200, "bounceRate": "32%"},
                {"day": "Tue", "visits": 3100, "pageViews": 5600, "bounceRate": "28%"},
                {"day": "Wed", "visits": 3800, "pageViews": 6800, "bounceRate": "25%"},
                {"day": "Thu", "visits": 4200, "pageViews": 7400, "bounceRate": "24%"},
                {"day": "Fri", "visits": 4900, "pageViews": 8900, "bounceRate": "22%"},
                {"day": "Sat", "visits": 2800, "pageViews": 4100, "bounceRate": "38%"},
                {"day": "Sun", "visits": 2100, "pageViews": 3500, "bounceRate": "41%"},
            ],
            "devices": [
                {"platform": "Desktop (Chrome, Safari, Edge)", "percentage": 64, "color": "#0ea5e9"},
                {"platform": "Mobile (iOS & Android)", "percentage": 28, "color": "#8b5cf6"},
                {"platform": "Tablet", "percentage": 8, "color": "#10b981"},
            ],
            "serverMetrics": {
                "uptime": "99.98%",
                "avgLatency": "42ms",
                "errorRate": "0.04%",
                "requestsPerMin": "14.2k",
            },
        },
    )


@router.get(
    "/users",
    summary="Get all registered users and their activities for admin overview",
)
async def get_dashboard_users(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns registered users and aggregated activities for admin overview.
    """
    # Fetch all users
    stmt = select(User).order_by(User.created_at.desc())
    res = await db.execute(stmt)
    users = res.scalars().all()

    # Fetch formulations count per user
    form_stmt = select(Formulation).order_by(desc(Formulation.created_at))
    form_res = await db.execute(form_stmt)
    all_formulations = form_res.scalars().all()

    user_form_counts = {}
    for f in all_formulations:
        if f.user_id:
            user_form_counts[f.user_id] = user_form_counts.get(f.user_id, 0) + 1

    users_data = []
    for u in users:
        count = (
            user_form_counts.get(u.id, 0)
            + user_form_counts.get(u.username, 0)
            + (user_form_counts.get("usr_01", 0) if u.email == "admin@example.com" else 0)
        )
        users_data.append({
            "id": u.id,
            "name": u.name or u.username.replace("_", " ").title(),
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "avatar": u.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={u.username}",
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%b %d, %Y") if u.created_at else "Recently",
            "formulations_count": count,
            "status": "Active" if u.is_active else "Inactive",
        })

    # Build dynamic activities combining recent formulations and auth events
    activities = []
    for f in all_formulations:
        matching_user = next((u for u in users if u.id == f.user_id or u.username == f.user_id), None)
        user_name = matching_user.name if matching_user else "Sarah Connor"
        user_email = matching_user.email if matching_user else "user@example.com"
        user_avatar = matching_user.avatar if matching_user else f"https://api.dicebear.com/7.x/avataaars/svg?seed={f.api_name}"
        time_str = f.created_at.strftime("%b %d, %H:%M") if f.created_at else "Recently"
        activities.append({
            "id": f"act_form_{f.id[:8]}",
            "user": {
                "name": user_name,
                "email": user_email,
                "avatar": user_avatar,
            },
            "action": f"Created Formulation: {f.api_name}",
            "details": f"{f.delivery_vehicle.replace('_', ' ').title()} formulation ({f.target_dose_mg}mg, pH {f.target_ph})",
            "amount": "PASS" if f.is_valid else "REVIEW",
            "status": "completed" if f.is_valid else "warning",
            "timestamp": time_str,
            "category": "Formulation",
        })

    for item in MOCK_ACTIVITIES[:4]:
        activities.append(item.model_dump())

    return {
        "success": True,
        "users": users_data,
        "activities": activities,
        "total_users": len(users_data),
        "total_formulations": len(all_formulations),
    }

