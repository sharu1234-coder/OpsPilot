from app.routers.tickets import router as tickets_router
from app.routers.analytics import router as analytics_router
from app.routers.assets import router as assets_router
from app.routers.team import router as team_router
from app.routers.activity import router as activity_router
from app.routers.auth import router as auth_router
from app.config import get_settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OpsPilot API",
    description="Enterprise IT Service Management Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_settings().allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "application": "OpsPilot",
        "message": "OpsPilot backend is running",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OpsPilot API",
    }

app.include_router(tickets_router)
app.include_router(analytics_router)
app.include_router(assets_router)
app.include_router(team_router)
app.include_router(activity_router)
app.include_router(auth_router)
