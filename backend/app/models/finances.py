from datetime import date
from uuid import UUID
from sqlalchemy import BigInteger, CheckConstraint, Date, ForeignKey, Index, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, TimestampsMixin, WeddingOwnedMixin

class BudgetCategory(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "budget_categories"
    __table_args__ = (UniqueConstraint("wedding_id", "name"), CheckConstraint("planned_cents >= 0"))
    name: Mapped[str] = mapped_column(String(200))
    planned_cents: Mapped[int] = mapped_column(BigInteger, default=0)


class Vendor(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "vendors"
    __table_args__ = (CheckConstraint("total_cost_cents >= 0"), CheckConstraint("status IN ('researching','negotiating','contracted','canceled')"))
    budget_category_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("budget_categories.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(200), default="Outros")
    contact: Mapped[str | None] = mapped_column(String(300), nullable=True)
    total_cost_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(20), default="researching")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Payment(Base, IdMixin, TimestampsMixin, WeddingOwnedMixin):
    __tablename__ = "payments"
    __table_args__ = (CheckConstraint("amount_cents >= 0"), CheckConstraint("status IN ('pending','paid')"), Index("ix_payments_wedding_due", "wedding_id", "status", "due_date"))
    vendor_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    budget_category_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("budget_categories.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300))
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    due_date: Mapped[date] = mapped_column(Date)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
