from datetime import datetime
from uuid import UUID
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, TimestampsMixin, WeddingOwnedMixin, now

class GuestGroup(Base, IdMixin, WeddingOwnedMixin):
    __tablename__ = "guest_groups"
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Guest(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "guests"
    __table_args__ = (CheckConstraint("rsvp_status IN ('pending','confirmed','declined')"), CheckConstraint("companion_count >= 0"))
    group_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("guest_groups.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    rsvp_status: Mapped[str] = mapped_column(String(20), default="pending")
    companion_count: Mapped[int] = mapped_column(Integer, default=0)
    dietary_restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)
    table_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    invitation_sent: Mapped[bool] = mapped_column(Boolean, default=False)


class GuestEventInvitation(Base, IdMixin):
    __tablename__ = "guest_event_invitations"
    __table_args__ = (UniqueConstraint("guest_id", "event_id"), CheckConstraint("rsvp_status IN ('pending','confirmed','declined')"))
    guest_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("guests.id", ondelete="CASCADE"), index=True)
    event_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("wedding_events.id", ondelete="CASCADE"), index=True)
    invited: Mapped[bool] = mapped_column(Boolean, default=True)
    rsvp_status: Mapped[str] = mapped_column(String(20), default="pending")
