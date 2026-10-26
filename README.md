# OpsPilot

**Full-Stack IT Service Management Platform**

OpsPilot is a full-stack IT Service Management (ITSM) application for managing IT support tickets, assets, team members, operational activity, and service analytics through a unified interface.

Built with **FastAPI, React, TypeScript, and PostgreSQL**, OpsPilot demonstrates secure backend development, relational database design, role-based access control, automated testing, and production-oriented application architecture.

> **Status:** Source code published on GitHub. Implemented features have passed local regression tests. Production deployment is being prepared.

## Features

### Ticket Management

- Create, view, and update IT support tickets.
- Track ticket details and status changes.
- Review ticket-specific activity history.
- Access ticket management interfaces through the React frontend.

### Asset Management

- Create, view, and update IT asset records.
- View asset details and activity timelines.
- Manage asset information through dedicated frontend pages.

### Authentication and Security

- User signup, login, and logout.
- Database-backed authenticated sessions.
- Secure, HttpOnly session cookies.
- CSRF protection.
- Role-based authorization for admin, agent, and employee workflows.
- Protected backend endpoints and frontend routes.
- Trusted-origin validation and environment-aware security settings.

### Team Management

- Create and view team member records.
- Update team member information.
- Access individual team member details.
- Apply role-based permissions to team operations.

### Dashboard and Analytics

- Dashboard metrics and visualizations.
- Ticket trend analytics.
- Ticket and asset activity timelines.
- Global activity interface.
- Frontend analytics export functionality.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database migrations | Alembic |
| Authentication | Database-backed sessions, secure cookies, CSRF protection |
| Backend testing | Python unittest |
| Deployment design | Ubuntu VPS, Caddy, systemd, Uvicorn |

## System Architecture

~~~text
Browser
   |
   v
React + TypeScript Frontend
   |
   v
FastAPI REST API
   |
   +-- Authentication and Authorization
   |
   +-- Ticket Management
   |
   +-- Asset Management
   |
   +-- Team Management
   |
   +-- Analytics and Activity
   |
   v
SQLAlchemy ORM
   |
   v
PostgreSQL
~~~

### Planned Production Architecture

~~~text
                HTTPS
                  |
                  v
                Caddy
                  |
         +--------+--------+
         |                 |
         v                 v
   React Static       /api Requests
      Files                |
                           v
                    FastAPI/Uvicorn
                           |
                           v
                       PostgreSQL
~~~

The planned deployment uses one HTTPS domain. Caddy serves the frontend and reverse-proxies API requests to FastAPI on the server's loopback interface.

## Project Structure

~~~text
OpsPilot/
|
+-- backend/
|   +-- app/
|   |   +-- models/
|   |   +-- routers/
|   |   +-- main.py
|   |   +-- config.py
|   |   +-- database.py
|   +-- migrations/
|   +-- tests/
|   +-- alembic.ini
|   +-- requirements.txt
|
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- contexts/
|   |   +-- layouts/
|   |   +-- lib/
|   |   +-- pages/
|   +-- package.json
|
+-- deploy/
|   +-- Caddyfile
|   +-- backend.env.example
|   +-- opspilot-api.service
|
+-- docs/
+-- infrastructure/
+-- .gitignore
+-- README.md
~~~

## Local Development Setup

### Prerequisites

- Python 3.12 or a compatible version
- Node.js and npm
- PostgreSQL
- Git

The following examples use Windows PowerShell.

### 1. Clone the Repository

~~~powershell
git clone https://github.com/sharu1234-coder/OpsPilot.git
cd OpsPilot
~~~

### 2. Configure PostgreSQL

Create a local PostgreSQL database and an application database user.

Configure the backend database connection for your development environment. Keep real database credentials in ignored local configuration files, not in Git.

The repository includes `deploy/backend.env.example` as a reference for production environment variables.

**Important:** Do not use production credentials or a production database for local development or automated testing.

### 3. Install Backend Dependencies

From the project root:

~~~powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
~~~

### 4. Apply Database Migrations

After confirming your local database configuration:

~~~powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
~~~

Migrations modify the configured database schema. Verify the database target before executing them.

### 5. Start the Backend

From the `backend` directory:

~~~powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
~~~

Development API:

http://127.0.0.1:8000

Interactive Swagger documentation:

http://127.0.0.1:8000/docs

### 6. Start the Frontend

Open a second PowerShell terminal at the project root:

~~~powershell
cd frontend
npm ci
npm run dev
~~~

Development frontend:

http://127.0.0.1:5173

The frontend uses the local backend during development and supports same-origin API requests for production hosting.

## API Overview

| Area | Route Prefix | Operations |
|---|---|---|
| Authentication | `/api/auth` | Signup, login, current user, logout, CSRF |
| Tickets | `/api/tickets` | List, create, details, update, activity |
| Assets | `/api/assets` | List, create, details, update, activity |
| Team | `/api/team` | List, create, details, update |
| Activity | `/api/activity` | Activity feed |
| Analytics | `/api/analytics` | Ticket trends |

### Authentication

~~~text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/csrf
~~~

### Tickets

~~~text
GET   /api/tickets/
POST  /api/tickets/
GET   /api/tickets/{ticket_id}
PATCH /api/tickets/{ticket_id}
GET   /api/tickets/{ticket_id}/activities
~~~

### Assets

~~~text
GET   /api/assets/
POST  /api/assets/
GET   /api/assets/{asset_id}
PATCH /api/assets/{asset_id}
GET   /api/assets/{asset_id}/activities
~~~

### Team, Activity, and Analytics

~~~text
POST  /api/team/
GET   /api/team/
GET   /api/team/{member_id}
PATCH /api/team/{member_id}

GET   /api/activity/
GET   /api/analytics/ticket-trends
~~~

Endpoint availability depends on authentication and role permissions. Use FastAPI Swagger UI to inspect the actual request and response schemas.

## Testing

The backend includes four automated test suites:

~~~text
backend/tests/test_auth_security.py
backend/tests/test_ticket_security.py
backend/tests/test_asset_security.py
backend/tests/test_team_reporting_security.py
~~~

### Run Backend Tests

From the `backend` directory:

~~~powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
~~~

**Latest verified local result: 62 tests passed.**

The tests require an appropriately configured PostgreSQL test environment.

### Build the Frontend

From the `frontend` directory:

~~~powershell
npm run build
~~~

The latest verified local production build completed successfully.

## Security Design

OpsPilot implements security controls including:

- Password hashing.
- Database-backed authentication sessions.
- HttpOnly session cookies.
- Secure cookie settings outside development.
- CSRF protection.
- Role-based authorization.
- Trusted-origin validation.
- Production environment configuration checks.

Never commit passwords, secret keys, session credentials, private certificates, or production environment files.

Automated tests do not replace a full production security review.

## Deployment

Deployment configuration is included in the `deploy/` directory.

| File | Purpose |
|---|---|
| `Caddyfile` | HTTPS reverse proxy and frontend hosting |
| `opspilot-api.service` | systemd service for FastAPI |
| `backend.env.example` | Example production environment configuration |

The planned hosting environment uses:

- Ubuntu VPS
- Caddy HTTPS reverse proxy
- FastAPI with Uvicorn
- PostgreSQL with private database access
- Environment secrets stored outside Git

**Production status:** Deployment configuration is prepared, but a live production deployment has not yet been confirmed.

## Engineering Goals

OpsPilot demonstrates practical experience with:

- Full-stack application development.
- REST API design.
- Relational database modeling.
- Authentication and authorization.
- Secure session management.
- Automated regression testing.
- Frontend integration.
- Git and GitHub workflows.
- Deployment preparation.

## Author

**sharu1234-coder**

GitHub: https://github.com/sharu1234-coder

## Repository

https://github.com/sharu1234-coder/OpsPilot
