from datetime import datetime
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, TimestampsMixin, WeddingOwnedMixin

class WeddingEvent(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "wedding_events"
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)


class Appointment(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "appointments"
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    appointment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    vendor_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    task_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
