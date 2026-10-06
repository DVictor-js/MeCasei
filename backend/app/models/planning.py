from datetime import date, datetime
from uuid import UUID
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, TimestampsMixin, WeddingOwnedMixin, now

class Task(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("status IN ('pending','completed')"),
        CheckConstraint("priority IN ('low','medium','high')"),
        CheckConstraint("responsible IN ('self','partner','both')"),
        Index("ix_tasks_wedding_due", "wedding_id", "status", "due_date"),
    )
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    responsible: Mapped[str] = mapped_column(String(20), default="both")
    related_vendor_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    related_event_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("wedding_events.id", ondelete="SET NULL"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TaskSubtask(Base, IdMixin):
    __tablename__ = "task_subtasks"
    task_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
