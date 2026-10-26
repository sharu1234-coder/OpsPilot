"""Transaction-isolated Authentication security regression tests."""

import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models.auth_session import AuthSession
from app.models.user import User
from app.security import hash_password, verify_password
from app.session_security import (
    SESSION_COOKIE_NAME,
    generate_session_token,
    hash_session_token,
)

ORIGIN = "http://127.0.0.1:5173"
PASSWORD = "OpsPilot-Test-Password-2026!"


class AuthSecurityTests(unittest.TestCase):

    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.test_id = uuid4().hex[:12]
        self.email = f"auth-test-{self.test_id}@example.com"

        def override_get_db():
            with Session(
                bind=self.connection,
                join_transaction_mode="create_savepoint",
            ) as db:
                yield db

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        try:
            self.client.close()
        finally:
            app.dependency_overrides.pop(get_db, None)

            try:
                if self.transaction.is_active:
                    self.transaction.rollback()
            finally:
                self.connection.close()

    def signup(self, **overrides):
        payload = {
            "email": self.email,
            "password": PASSWORD,
        }
        payload.update(overrides)

        return self.client.post(
            "/api/auth/signup",
            json=payload,
            headers={"Origin": ORIGIN},
        )

    def login(self, **overrides):
        payload = {
            "email": self.email,
            "password": PASSWORD,
        }
        payload.update(overrides)

        return self.client.post(
            "/api/auth/login",
            json=payload,
            headers={"Origin": ORIGIN},
        )

    def create_account(self):
        response = self.signup()
        self.assertEqual(
            response.status_code,
            201,
            response.text,
        )
        return response.json()

    def authenticate(self):
        self.create_account()

        response = self.login()
        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        return response

    def csrf_token(self):
        response = self.client.get("/api/auth/csrf")

        self.assertEqual(
            response.status_code,
            200,
            response.text,
        )

        return response.json()["csrf_token"]

    def test_01_signup_creates_employee_only(self):
        result = self.create_account()

        self.assertEqual(result["role"], "employee")
        self.assertTrue(result["is_active"])
        self.assertEqual(result["email"], self.email)

    def test_02_password_is_hashed(self):
        self.create_account()

        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            user = db.scalar(
                select(User).where(User.email == self.email)
            )

            self.assertIsNotNone(user)
            self.assertNotEqual(user.password_hash, PASSWORD)
            self.assertTrue(
                verify_password(
                    PASSWORD,
                    user.password_hash,
                )
            )

    def test_03_signup_cannot_set_admin_role(self):
        response = self.signup(role="admin")

        self.assertEqual(
            response.status_code,
            422,
            response.text,
        )

    def test_04_duplicate_email_rejected(self):
        self.create_account()

        response = self.signup(
            email=self.email.upper()
        )

        self.assertEqual(
            response.status_code,
            409,
            response.text,
        )

    def test_05_weak_password_rejected(self):
        response = self.signup(password="short")

        self.assertEqual(
            response.status_code,
            422,
            response.text,
        )

    def test_06_login_creates_session(self):
        self.authenticate()

        token = self.client.cookies.get(
            SESSION_COOKIE_NAME
        )

        self.assertIsNotNone(token)
        self.assertEqual(len(token), 43)

        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            session = db.scalar(
                select(AuthSession).where(
                    AuthSession.token_hash
                    == hash_session_token(token)
                )
            )

            self.assertIsNotNone(session)
            self.assertIsNone(session.revoked_at)

    def test_07_session_cookie_is_httponly(self):
        response = self.authenticate()

        cookie = response.headers.get("set-cookie", "")

        self.assertIn("httponly", cookie.lower())
        self.assertIn("samesite=lax", cookie.lower())

    def test_08_invalid_password_rejected(self):
        self.create_account()

        response = self.login(
            password="Incorrect-Password-2026"
        )

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

    def test_09_unknown_account_rejected(self):
        response = self.login()

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

    def test_10_me_requires_valid_session(self):
        anonymous = self.client.get("/api/auth/me")

        self.assertEqual(anonymous.status_code, 401)

        self.authenticate()

        authenticated = self.client.get("/api/auth/me")

        self.assertEqual(
            authenticated.status_code,
            200,
            authenticated.text,
        )

        self.assertEqual(
            authenticated.json()["email"],
            self.email,
        )

    def test_11_expired_session_rejected(self):
        self.authenticate()

        token = self.client.cookies.get(
            SESSION_COOKIE_NAME
        )

        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            session = db.scalar(
                select(AuthSession).where(
                    AuthSession.token_hash
                    == hash_session_token(token)
                )
            )

            session.expires_at = (
                datetime.now(timezone.utc)
                - timedelta(minutes=1)
            )

            db.commit()

        response = self.client.get("/api/auth/me")

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

    def test_12_inactive_account_rejected(self):
        self.authenticate()

        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            user = db.scalar(
                select(User).where(User.email == self.email)
            )

            user.is_active = False
            db.commit()

        response = self.client.get("/api/auth/me")

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

        response = self.login()

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

    def test_13_csrf_requires_authentication(self):
        response = self.client.get("/api/auth/csrf")

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )

    def test_14_csrf_is_session_bound(self):
        self.authenticate()

        token = self.csrf_token()

        self.assertEqual(len(token), 64)

        first_session = self.client.cookies.get(
            SESSION_COOKIE_NAME
        )

        self.login()

        second_session = self.client.cookies.get(
            SESSION_COOKIE_NAME
        )

        self.assertNotEqual(
            first_session,
            second_session,
        )

        second_csrf = self.csrf_token()

        self.assertNotEqual(token, second_csrf)

    def test_15_logout_requires_csrf(self):
        self.authenticate()

        response = self.client.post(
            "/api/auth/logout",
            headers={"Origin": ORIGIN},
        )

        self.assertEqual(
            response.status_code,
            403,
            response.text,
        )

        still_authenticated = self.client.get(
            "/api/auth/me"
        )

        self.assertEqual(
            still_authenticated.status_code,
            200,
        )

    def test_16_logout_revokes_session(self):
        self.authenticate()

        token = self.client.cookies.get(
            SESSION_COOKIE_NAME
        )

        csrf = self.csrf_token()

        response = self.client.post(
            "/api/auth/logout",
            headers={
                "Origin": ORIGIN,
                "X-CSRF-Token": csrf,
            },
        )

        self.assertEqual(
            response.status_code,
            204,
            response.text,
        )

        self.assertIsNone(
            self.client.cookies.get(
                SESSION_COOKIE_NAME
            )
        )

        with Session(
            bind=self.connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            session = db.scalar(
                select(AuthSession).where(
                    AuthSession.token_hash
                    == hash_session_token(token)
                )
            )

            self.assertIsNotNone(session)
            self.assertIsNotNone(session.revoked_at)

        self.client.cookies.set(
            SESSION_COOKIE_NAME,
            token,
        )

        response = self.client.get("/api/auth/me")

        self.assertEqual(
            response.status_code,
            401,
            response.text,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
