from datetime import date, datetime
from uuid import UUID
from sqlalchemy import BigInteger, Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, TimestampsMixin, now

class Wedding(Base, IdMixin, TimestampsMixin):
    __tablename__ = "weddings"
    __table_args__ = (
        CheckConstraint("guest_target IS NULL OR guest_target >= 0"),
        CheckConstraint("budget_target_cents >= 0"),
    )
    partner_one_name: Mapped[str] = mapped_column(String(200), default="")
    partner_two_name: Mapped[str] = mapped_column(String(200), default="")
    wedding_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    city: Mapped[str | None] = mapped_column(String(200), nullable=True)
    guest_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget_target_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)


class WeddingMember(Base, IdMixin):
    __tablename__ = "wedding_members"
    __table_args__ = (UniqueConstraint("wedding_id", "user_id"), CheckConstraint("role IN ('owner','partner')"))
    wedding_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("weddings.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="owner")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
