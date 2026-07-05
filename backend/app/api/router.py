from fastapi import APIRouter

from app.api.routes import admin, auth, bookings, chat, contacts, knowledge, promotions, reviews, tours

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(tours.router)
api_router.include_router(promotions.router)
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(contacts.router)
api_router.include_router(chat.router)
api_router.include_router(knowledge.router)
api_router.include_router(admin.router)
