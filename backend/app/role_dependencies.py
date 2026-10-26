"""Role-based authorization dependencies for OpsPilot."""

from fastapi import Depends, HTTPException, status

from app.auth_dependencies import require_current_user
from app.models.user import User


VALID_ROLES = frozenset({
    "admin",
    "agent",
    "employee",
})


def require_roles(*allowed_roles: str):
    """Require an authenticated user with an allowed role."""

    if not allowed_roles:
        raise ValueError(
            "At least one allowed role is required."
        )

    allowed = frozenset(allowed_roles)

    if not allowed.issubset(VALID_ROLES):
        raise ValueError(
            "Unknown authorization role."
        )

    def role_dependency(
        current_user: User = Depends(require_current_user),
    ) -> User:
        if (
            not current_user.is_active
            or current_user.role not in allowed
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )

        return current_user

    return role_dependency


# Administrative operations.
require_admin = require_roles("admin")

# Operations available to administrators and IT agents.
require_staff = require_roles("admin", "agent")

# Operations available to any authenticated account.
require_authenticated_user = require_roles(
    "admin",
    "agent",
    "employee",
)
