from typing import Literal
from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


Rsvp = Literal["pending", "confirmed", "declined"]
VendorStatus = Literal["researching", "negotiating", "contracted", "canceled"]
