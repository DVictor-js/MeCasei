from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column


def now() -> datetime:
    return datetime.now(timezone.utc)


class IdMixin:
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)


class TimestampsMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class WeddingOwnedMixin:
    wedding_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("weddings.id", ondelete="CASCADE"), index=True)
