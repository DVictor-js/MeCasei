from datetime import datetime
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


from app.models.common import IdMixin, now

class ImportJob(Base, IdMixin):
    __tablename__ = "import_jobs"
    __table_args__ = (UniqueConstraint("user_id", "client_import_id"),)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    client_import_id: Mapped[str] = mapped_column(String(200))
    wedding_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("weddings.id", ondelete="CASCADE"))
    mapping: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
