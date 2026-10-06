from fastapi import APIRouter
from .endpoints import auth, weddings, tasks, guests, guest_groups, events, budget, budget_categories, vendors, payments, appointments, imports

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(weddings.router)
router.include_router(tasks.router)
router.include_router(guests.router)
router.include_router(guest_groups.router)
router.include_router(events.router)
router.include_router(budget.router)
router.include_router(budget_categories.router)
router.include_router(vendors.router)
router.include_router(payments.router)
router.include_router(appointments.router)
router.include_router(imports.router)
