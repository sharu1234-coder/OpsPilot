"""Transaction-isolated Team and Reporting security regression tests."""

import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models.auth_session import AuthSession
from app.models.user import User
from app.csrf_security import generate_csrf_token
from app.session_security import (
    SESSION_COOKIE_NAME,
    generate_session_token,
    hash_session_token,
)

ORIGIN = "http://127.0.0.1:5173"


class TeamReportingSecurityTests(unittest.TestCase):

    def setUp(self):
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

        try:
            with Session(
                bind=self.connection,
                join_transaction_mode="create_savepoint",
                expire_on_commit=False,
            ) as db:
                for role in ("admin", "agent", "employee"):
                    user = User(
                        email=f"team-test-{role}-{self.test_id}@example.test",
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
        except BaseException:
            self.tearDown()
            raise

    def tearDown(self):
        try:
            if hasattr(self, "client"):
                self.client.close()
        finally:
            app.dependency_overrides.pop(get_db, None)

            try:
                if self.transaction.is_active:
                    self.transaction.rollback()
            finally:
                self.connection.close()

    def login(self, role):
        self.client.cookies.set(
            SESSION_COOKIE_NAME,
            self.tokens[role],
        )

    def headers(self, role, origin=ORIGIN):
        return {
            "Origin": origin,
            "X-CSRF-Token": generate_csrf_token(
                self.tokens[role]
            ),
        }

    def payload(self):
        return {
            "full_name": "Automated Test Engineer",
            "email": f"engineer-{self.test_id}@example.test",
            "department": "IT Operations",
            "role": "Support Engineer",
            "status": "Active",
            "location": "Hyderabad",
        }

    def create_member(self):
        self.login("admin")

        response = self.client.post(
            "/api/team/",
            json=self.payload(),
            headers=self.headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            201,
            response.text,
        )

        return response.json()

    def test_01_anonymous_access_denied(self):
        paths = [
            "/api/team/",
            "/api/team/999999999",
            "/api/analytics/ticket-trends?days=7",
            "/api/activity/?entity_type=all&limit=10",
        ]

        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(
                    response.status_code,
                    401,
                    response.text,
                )

    def test_02_employee_cannot_read_staff_data(self):
        self.login("employee")

        paths = [
            "/api/team/",
            "/api/team/999999999",
            "/api/analytics/ticket-trends?days=7",
            "/api/activity/?entity_type=all&limit=10",
        ]

        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(
                    response.status_code,
                    403,
                    response.text,
                )

    def test_03_staff_can_read_team(self):
        for role in ("admin", "agent"):
            with self.subTest(role=role):
                self.login(role)

                response = self.client.get("/api/team/")

                self.assertEqual(
                    response.status_code,
                    200,
                    response.text,
                )

                self.assertIsInstance(response.json(), list)

    def test_04_admin_can_create_member(self):
        created = self.create_member()

        self.assertEqual(
            created["email"],
            self.payload()["email"],
        )

        response = self.client.get(
            f"/api/team/{created['id']}"
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

    def test_05_agent_cannot_create_member(self):
        self.login("agent")

        response = self.client.post(
            "/api/team/",
            json=self.payload(),
            headers=self.headers("agent"),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_06_employee_cannot_create_member(self):
        self.login("employee")

        response = self.client.post(
            "/api/team/",
            json=self.payload(),
            headers=self.headers("employee"),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_07_create_requires_csrf(self):
        self.login("admin")

        response = self.client.post(
            "/api/team/",
            json=self.payload(),
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_08_create_rejects_untrusted_origin(self):
        self.login("admin")

        response = self.client.post(
            "/api/team/",
            json=self.payload(),
            headers=self.headers(
                "admin",
                origin="https://untrusted.example",
            ),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_09_admin_can_update_member(self):
        created = self.create_member()

        response = self.client.patch(
            f"/api/team/{created['id']}",
            json={
                "department": "Infrastructure",
                "status": "Inactive",
            },
            headers=self.headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        self.assertEqual(
            response.json()["department"],
            "Infrastructure",
        )

        self.assertEqual(
            response.json()["status"],
            "Inactive",
        )

    def test_10_agent_cannot_update_member(self):
        created = self.create_member()
        self.login("agent")

        response = self.client.patch(
            f"/api/team/{created['id']}",
            json={"department": "Infrastructure"},
            headers=self.headers("agent"),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_11_update_requires_csrf(self):
        created = self.create_member()

        response = self.client.patch(
            f"/api/team/{created['id']}",
            json={"department": "Infrastructure"},
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_12_duplicate_email_rejected(self):
        self.create_member()

        payload = self.payload()
        payload["email"] = payload["email"].upper()

        response = self.client.post(
            "/api/team/",
            json=payload,
            headers=self.headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            409,
            response.text,
        )

    def test_13_staff_can_read_analytics(self):
        for role in ("admin", "agent"):
            with self.subTest(role=role):
                self.login(role)

                response = self.client.get(
                    "/api/analytics/ticket-trends?days=7"
                )

                self.assertEqual(
                    response.status_code,
                    200,
                    response.text,
                )

                data = response.json()

                self.assertEqual(data["days"], 7)
                self.assertEqual(data["timezone"], "Asia/Kolkata")
                self.assertEqual(len(data["data"]), 7)

    def test_14_staff_can_read_activity(self):
        for role in ("admin", "agent"):
            with self.subTest(role=role):
                self.login(role)

                for entity_type in ("all", "ticket", "asset"):
                    with self.subTest(entity_type=entity_type):
                        response = self.client.get(
                            "/api/activity/",
                            params={
                                "entity_type": entity_type,
                                "limit": 10,
                            },
                        )

                        self.assertEqual(
                            response.status_code,
                            200,
                            response.text,
                        )

                        self.assertIsInstance(
                            response.json(),
                            list,
                        )

    def test_15_invalid_reporting_parameters(self):
        self.login("admin")

        paths = [
            "/api/analytics/ticket-trends?days=0",
            "/api/analytics/ticket-trends?days=31",
            "/api/activity/?limit=0",
            "/api/activity/?limit=101",
            "/api/activity/?entity_type=invalid",
        ]

        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(
                    response.status_code,
                    422,
                    response.text,
                )

    def test_16_team_update_rejects_null(self):
        created = self.create_member()

        response = self.client.patch(
            f"/api/team/{created['id']}",
            json={"department": None},
            headers=self.headers("admin"),
        )

        self.assertEqual(
            response.status_code,
            422,
            response.text,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
