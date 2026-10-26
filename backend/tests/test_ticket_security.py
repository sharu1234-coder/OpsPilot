"""Transaction-isolated Ticket security regression tests."""

import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models.auth_session import AuthSession
from app.models.ticket import Ticket
from app.models.user import User
from app.csrf_security import generate_csrf_token
from app.session_security import (
    SESSION_COOKIE_NAME,
    generate_session_token,
    hash_session_token,
)

ORIGIN = "http://127.0.0.1:5173"


class TicketSecurityTests(unittest.TestCase):

    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.tokens = {}
        self.users = {}
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
                for role in (
                    "admin",
                    "agent",
                    "employee",
                    "other_employee",
                ):
                    actual_role = (
                        "employee"
                        if role == "other_employee"
                        else role
                    )

                    user = User(
                        email=(
                            f"ticket-{role}-{self.test_id}"
                            "@example.test"
                        ),
                        password_hash="test-only-password-hash",
                        role=actual_role,
                        is_active=True,
                    )

                    db.add(user)
                    db.flush()

                    self.users[role] = {
                        "id": user.id,
                        "email": user.email,
                    }

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

    def payload(self, role="employee"):
        return {
            "title": f"Test incident {self.test_id}",
            "description": "Automated security test",
            "requester": self.users[role]["email"],
            "priority": "Medium",
        }

    def create_ticket(self, role="employee", overrides=None):
        self.login(role)

        payload = self.payload(role)

        if overrides:
            payload.update(overrides)

        response = self.client.post(
            "/api/tickets/",
            json=payload,
            headers=self.headers(role),
        )

        self.assertEqual(
            response.status_code,
            201,
            response.text,
        )

        return response.json()

    def update_payload(self):
        return {
            "status": "In Progress",
            "priority": "High",
            "assignee": "Test Support Agent",
        }

    def test_01_anonymous_list_denied(self):
        response = self.client.get("/api/tickets/")

        self.assertEqual(response.status_code, 401)

    def test_02_anonymous_create_denied(self):
        response = self.client.post(
            "/api/tickets/",
            json=self.payload(),
            headers={"Origin": ORIGIN},
        )

        self.assertIn(response.status_code, (401, 403))

    def test_03_employee_can_create_own_ticket(self):
        ticket = self.create_ticket("employee")

        self.assertEqual(
            ticket["requester_user_id"],
            self.users["employee"]["id"],
        )

        self.assertEqual(
            ticket["requester"],
            self.users["employee"]["email"],
        )

        self.assertEqual(ticket["status"], "Open")

    def test_04_employee_cannot_forge_requester(self):
        ticket = self.create_ticket(
            "employee",
            {"requester": "forged@example.test"},
        )

        self.assertEqual(
            ticket["requester"],
            self.users["employee"]["email"],
        )

        self.assertEqual(
            ticket["requester_user_id"],
            self.users["employee"]["id"],
        )

    def test_05_employee_cannot_assign_ticket(self):
        self.login("employee")

        response = self.client.post(
            "/api/tickets/",
            json={
                **self.payload(),
                "assignee": "Unauthorized Agent",
            },
            headers=self.headers("employee"),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_06_employee_sees_only_own_tickets(self):
        own = self.create_ticket("employee")
        other = self.create_ticket("other_employee")

        self.login("employee")

        response = self.client.get("/api/tickets/")

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        ids = {ticket["id"] for ticket in response.json()}

        self.assertIn(own["id"], ids)
        self.assertNotIn(other["id"], ids)

        for ticket in response.json():
            self.assertEqual(
                ticket["requester_user_id"],
                self.users["employee"]["id"],
            )

    def test_07_employee_cannot_read_other_ticket(self):
        other = self.create_ticket("other_employee")
        self.login("employee")

        for path in (
            f"/api/tickets/{other['id']}",
            f"/api/tickets/{other['id']}/activities",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(
                    response.status_code,
                    404,
                    response.text,
                )

    def test_08_employee_can_read_own_ticket(self):
        own = self.create_ticket("employee")

        for path in (
            f"/api/tickets/{own['id']}",
            f"/api/tickets/{own['id']}/activities",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(
                    response.status_code,
                    200,
                    response.text,
                )

    def test_09_employee_cannot_update_ticket(self):
        own = self.create_ticket("employee")

        response = self.client.patch(
            f"/api/tickets/{own['id']}",
            json=self.update_payload(),
            headers=self.headers("employee"),
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_10_staff_can_see_all_test_tickets(self):
        first = self.create_ticket("employee")
        second = self.create_ticket("other_employee")

        for role in ("admin", "agent"):
            with self.subTest(role=role):
                self.login(role)

                response = self.client.get("/api/tickets/")

                self.assertEqual(
                    response.status_code,
                    200,
                    response.text,
                )

                ids = {
                    ticket["id"]
                    for ticket in response.json()
                }

                self.assertIn(first["id"], ids)
                self.assertIn(second["id"], ids)

    def test_11_staff_can_create_assigned_ticket(self):
        ticket = self.create_ticket(
            "agent",
            {
                "requester": "Helpdesk Customer",
                "assignee": "Support Agent",
            },
        )

        self.assertEqual(
            ticket["requester"],
            "Helpdesk Customer",
        )

        self.assertEqual(
            ticket["assignee"],
            "Support Agent",
        )

        self.assertEqual(
            ticket["requester_user_id"],
            self.users["agent"]["id"],
        )

    def test_12_create_requires_csrf(self):
        self.login("employee")

        response = self.client.post(
            "/api/tickets/",
            json=self.payload(),
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_13_patch_requires_csrf(self):
        ticket = self.create_ticket("employee")
        self.login("admin")

        response = self.client.patch(
            f"/api/tickets/{ticket['id']}",
            json=self.update_payload(),
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

    def test_14_staff_update_creates_audit(self):
        ticket = self.create_ticket("employee")
        self.login("agent")

        response = self.client.patch(
            f"/api/tickets/{ticket['id']}",
            json=self.update_payload(),
            headers=self.headers("agent"),
        )

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        self.assertEqual(
            response.json()["status"],
            "In Progress",
        )

        history = self.client.get(
            f"/api/tickets/{ticket['id']}/activities"
        )

        self.assertEqual(
            history.status_code,
            200,
            history.text,
        )

        fields = {
            item["field_name"]
            for item in history.json()
        }

        self.assertTrue(
            {"status", "priority", "assignee"}
            .issubset(fields)
        )

    def test_15_employee_cannot_read_legacy_ticket(self):
        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            legacy = Ticket(
                title=f"Legacy test {self.test_id}",
                description="Ownership intentionally null",
                requester="Legacy Requester",
                requester_user_id=None,
                priority="Medium",
                status="Open",
                assignee=None,
            )

            db.add(legacy)
            db.commit()
            legacy_id = legacy.id

        self.login("employee")

        detail = self.client.get(
            f"/api/tickets/{legacy_id}"
        )

        activities = self.client.get(
            f"/api/tickets/{legacy_id}/activities"
        )

        listing = self.client.get("/api/tickets/")

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(activities.status_code, 404)
        self.assertEqual(listing.status_code, 200)

        ids = {item["id"] for item in listing.json()}

        self.assertNotIn(legacy_id, ids)

        self.login("admin")

        staff_detail = self.client.get(
            f"/api/tickets/{legacy_id}"
        )

        self.assertEqual(
            staff_detail.status_code,
            200,
            staff_detail.text,
        )

    def test_16_invalid_priority_rejected(self):
        self.login("employee")

        response = self.client.post(
            "/api/tickets/",
            json={
                **self.payload(),
                "priority": "InvalidPriority",
            },
            headers=self.headers("employee"),
        )

        self.assertEqual(
            response.status_code,
            422,
            response.text,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
