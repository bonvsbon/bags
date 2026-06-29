from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.config import get_settings

settings = get_settings()

# SQLite needs check_same_thread=False for FastAPI's threaded request handling;
# the option is harmless to drop for Postgres (we only pass it for sqlite).
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
