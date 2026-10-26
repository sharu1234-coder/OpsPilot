"""Transaction-isolated regression tests for OpsPilot Asset security."""

import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models.asset import Asset
from app.models.asset_activity import AssetActivity
from app.models.auth_session import AuthSession
from app.models.user import User
from app.csrf_security import generate_csrf_token
from app.session_security import (
    SESSION_COOKIE_NAME,
    generate_session_token,
    hash_session_token,
)


ORIGIN = "http://127.0.0.1:5173"


class AssetSecurityTests(unittest.TestCase):

    def setUp(self):
        # A real PostgreSQL transaction is opened for each test.
        # Every request uses a SAVEPOINT inside this transaction.
        self.connection = engine.connect()
        self.transaction = self.connection.begin()

        self.tokens = {}
        self.test_id = uuid4().hex[:12]

        def override_get_db():
            with Session(
                bind=self.connection,
                join_transaction_mode="create_savepoint",
            ) as db:
                yield db

        app.dependency_overrides[get_db] = override_get_db

        self.client = TestClient(app)

        # Create test users and genuine database-backed sessions.
        # These writes remain inside the outer transaction.
        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        ) as db:
            for role in ("admin", "agent", "employee"):
                user = User(
                    email=f"asset-{role}-{self.test_id}@example.test",
                    password_hash="test-only-password-hash",
                    role=role,
                    is_active=True,
                )

                db.add(user)
                db.flush()

                token = generate_session_token()

                db.add(
                    AuthSession(
                        user_id=user.id,
                        token_hash=hash_session_token(token),
                        expires_at=(
                            datetime.now(timezone.utc)
                            + timedelta(hours=1)
                        ),
                    )
                )

                self.tokens[role] = token

            db.commit()

    def tearDown(self):
        try:
            self.client.close()
        finally:
            app.dependency_overrides.pop(get_db, None)

            try:
                # Roll back everything, including writes committed
                # by the application inside request SAVEPOINTs.
                if self.transaction.is_active:
                    self.transaction.rollback()
            finally:
                self.connection.close()

    def login_as(self, role):
        self.client.cookies.set(
            SESSION_COOKIE_NAME,
            self.tokens[role],
        )

    def csrf_headers(self, role, origin=ORIGIN):
        return {
            "Origin": origin,
            "X-CSRF-Token": generate_csrf_token(
                self.tokens[role]
            ),
        }

    def asset_payload(self):
        return {
            "name": "OpsPilot Automated Test Laptop",
            "category": "Laptop",
            "serial_number": f"TEST-{self.test_id}",
            "status": "Available",
            "assigned_to": None,
            "location": "Test Lab",
        }

    def create_asset(self, role="admin"):
        self.login_as(role)

        response = self.client.post(
            "/api/assets/",
            json=self.asset_payload(),
            headers=self.csrf_headers(role),
        )

        self.assertEqual(
            response.status_code,
            201,
            response.text,
        )

        return response.json()

    def test_01_anonymous_reads_are_blocked(self):
        for path in (
            "/api/assets/",
            "/api/assets/999999999",
            "/api/assets/999999999/activities",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(
                    response.status_code,
                    401,
                    response.text,
                )

    def test_02_employee_cannot_access_assets(self):
        self.login_as("employee")

        requests = (
            ("GET", "/api/assets/", None),
            ("GET", "/api/assets/999999999", None),
            (
                "GET",
                "/api/assets/999999999/activities",
                None,
            ),
            (
                "POST",
                "/api/assets/",
                self.asset_payload(),
            ),
            (
                "PATCH",
                "/api/assets/999999999",
                {
                    "status": "Available",
                    "assigned_to": None,
                    "location": "Test Lab",
                },
            ),
        )

        for method, path, payload in requests:
            with self.subTest(method=method, path=path):
                response = self.client.request(
                    method,
                    path,
                    json=payload,
                    headers=self.csrf_headers("employee"),
                )

                self.assertEqual(
                    response.status_code,
                    403,
                    response.text,
                )

    def test_03_staff_can_read_asset_list(self):
        for role in ("admin", "agent"):
            with self.subTest(role=role):
                self.login_as(role)

                response = self.client.get("/api/assets/")

                self.assertEqual(
                    response.status_code,
                    200,
                    response.text,
                )

                self.assertIsInstance(response.json(), list)

    def test_04_admin_can_create_and_read_asset(self):
        created = self.create_asset("admin")

        self.assertEqual(
            created["serial_number"],
            f"TEST-{self.test_id}",
        )

        response = self.client.get(
            f"/api/assets/{created['id']}"
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        self.assertEqual(
            response.json()["id"],
            created["id"],
        )

    def test_05_agent_can_create_asset(self):
        created = self.create_asset("agent")

        self.assertEqual(
            created["name"],
            "OpsPilot Automated Test Laptop",
        )

    def test_06_post_requires_csrf(self):
        self.login_as("admin")

        response = self.client.post(
            "/api/assets/",
            json=self.asset_payload(),
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_07_post_rejects_untrusted_origin(self):
        self.login_as("admin")

        response = self.client.post(
            "/api/assets/",
            json=self.asset_payload(),
            headers=self.csrf_headers(
                "admin",
                origin="https://untrusted.example",
            ),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_08_patch_requires_csrf(self):
        created = self.create_asset("admin")

        response = self.client.patch(
            f"/api/assets/{created['id']}",
            json={
                "status": "Maintenance",
                "assigned_to": None,
                "location": "Repair Lab",
            },
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

        unchanged = self.client.get(
            f"/api/assets/{created['id']}"
        )

        self.assertEqual(
            unchanged.json()["status"],
            "Available",
        )

    def test_09_admin_patch_creates_audit_history(self):
        created = self.create_asset("admin")
        asset_id = created["id"]

        response = self.client.patch(
            f"/api/assets/{asset_id}",
            json={
                "status": "Assigned",
                "assigned_to": "Test Employee",
                "location": "Head Office",
            },
            headers=self.csrf_headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        updated = response.json()

        self.assertEqual(updated["status"], "Assigned")
        self.assertEqual(
            updated["assigned_to"],
            "Test Employee",
        )
        self.assertEqual(
            updated["location"],
            "Head Office",
        )

        history = self.client.get(
            f"/api/assets/{asset_id}/activities"
        )

        self.assertEqual(
            history.status_code,
            200,
            history.text,
        )

        changed_fields = {
            entry["field_name"]
            for entry in history.json()
        }

        self.assertTrue(
            {"status", "assigned_to", "location"}
            .issubset(changed_fields)
        )

    def test_10_agent_can_update_asset(self):
        created = self.create_asset("admin")

        self.login_as("agent")

        response = self.client.patch(
            f"/api/assets/{created['id']}",
            json={
                "status": "Maintenance",
                "assigned_to": None,
                "location": "Service Center",
            },
            headers=self.csrf_headers("agent"),
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        self.assertEqual(
            response.json()["status"],
            "Maintenance",
        )

    def test_11_duplicate_serial_is_rejected(self):
        self.create_asset("admin")

        payload = self.asset_payload()
        payload["serial_number"] = (
            payload["serial_number"].lower()
        )

        response = self.client.post(
            "/api/assets/",
            json=payload,
            headers=self.csrf_headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            409,
            response.text,
        )

    def test_12_invalid_asset_is_rejected(self):
        self.login_as("admin")

        payload = self.asset_payload()
        payload["category"] = "InvalidCategory"

        response = self.client.post(
            "/api/assets/",
            json=payload,
            headers=self.csrf_headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            422,
            response.text,
        )

    def test_13_patch_rejects_untrusted_origin(self):
        created = self.create_asset("admin")

        response = self.client.patch(
            f"/api/assets/{created['id']}",
            json={
                "status": "Maintenance",
                "assigned_to": None,
                "location": "Repair Lab",
            },
            headers=self.csrf_headers(
                "admin",
                origin="https://untrusted.example",
            ),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_14_rollback_scope_contains_test_writes(self):
        created = self.create_asset("admin")

        # Confirm this is a real PostgreSQL record,
        # not a mocked response.
        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            asset = db.scalar(
                select(Asset).where(
                    Asset.id == created["id"]
                )
            )

            self.assertIsNotNone(asset)

            activities = db.scalars(
                select(AssetActivity).where(
                    AssetActivity.asset_id == created["id"]
                )
            ).all()

            self.assertEqual(activities, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
