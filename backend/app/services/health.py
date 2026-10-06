from sqlalchemy import text
from sqlalchemy.orm import Session

def check_health(db: Session):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
