import os
import tempfile

# Point the app at a throwaway SQLite DB before any app module imports.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ["JWT_SECRET"] = "test-secret"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

import app.models  # noqa: F401  (register tables)
from app.db import engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    SQLModel.metadata.create_all(engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)
