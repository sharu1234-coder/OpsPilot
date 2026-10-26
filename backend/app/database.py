from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings


settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def check_database_connection() -> str:
    with engine.connect() as connection:
        return connection.execute(
            text("SELECT current_database()")
        ).scalar_one()


def get_db():
    """Provide a database session to FastAPI dependencies."""
    with SessionLocal() as db:
        yield db
