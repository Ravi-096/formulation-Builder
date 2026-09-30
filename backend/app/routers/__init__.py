from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.formulation import router as formulation_router

__all__ = ["auth_router", "dashboard_router", "formulation_router"]
