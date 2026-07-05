from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeDocument
from app.models.tour import Tour
from app.services.promotion_service import is_promotion_active
from app.services.rag_service import ingest_knowledge_documents


def sync_tour_knowledge(db: Session, tour: Tour, rebuild_index: bool = True) -> KnowledgeDocument:
    document = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.source_type == "tour", KnowledgeDocument.source_id == tour.id)
        .first()
    )
    if document is None:
        document = KnowledgeDocument(source_type="tour", source_id=tour.id, title="", content="")
        db.add(document)

    document.title = f"Tour: {tour.title}"
    document.content = build_tour_knowledge_content(tour)
    document.is_active = bool(tour.is_active)
    document.document_metadata = {
        "synced_from": "tours",
        "tour_id": tour.id,
        "slug": tour.slug,
        "destination": tour.destination,
        "duration_days": tour.duration_days,
        "duration_nights": tour.duration_nights,
        "price": str(tour.price),
        "effective_price": str(tour.effective_price),
        "active_promotion_id": tour.active_promotion.id if tour.active_promotion else None,
    }
    db.commit()
    db.refresh(document)
    if rebuild_index:
        ingest_knowledge_documents(db)
    return document


def delete_tour_knowledge(db: Session, tour_id: int, rebuild_index: bool = True) -> None:
    documents = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.source_type == "tour", KnowledgeDocument.source_id == tour_id)
        .all()
    )
    for document in documents:
        db.delete(document)
    db.commit()
    if rebuild_index:
        ingest_knowledge_documents(db)


def build_tour_knowledge_content(tour: Tour) -> str:
    lines = [
        "THONG TIN TOUR DU LICH",
        "",
        f"Ten tour: {tour.title}",
        f"Ma tour/slug: {tour.slug}",
        f"Diem den: {tour.destination}",
        f"Khoi hanh: {tour.departure_location or 'Dang cap nhat'}",
        f"Thoi luong: {tour.duration_days} ngay {tour.duration_nights} dem",
        f"Gia tour: {_format_price(tour.price)} VND/nguoi",
        f"Gia sau khuyen mai: {_format_price(tour.effective_price)} VND/nguoi",
        f"So cho toi da: {tour.max_people}",
        f"So cho con lai: {tour.available_slots}",
        f"Trang thai: {'Dang mo ban' if tour.is_active else 'Tam ngung'}",
    ]

    promotion = tour.active_promotion
    if promotion:
        lines.extend(
            [
                "",
                "Khuyen mai dang ap dung:",
                f"Ten khuyen mai: {promotion.title}",
                f"Loai giam: {_format_discount(promotion.discount_type, promotion.discount_value)}",
                f"Gia goc: {_format_price(tour.price)} VND/nguoi",
                f"Gia uu dai: {_format_price(tour.effective_price)} VND/nguoi",
            ]
        )
        if promotion.terms:
            lines.append(f"Dieu kien: {promotion.terms}")

    code_promotions = [
        item
        for item in tour.promotions or []
        if item.code and not item.auto_apply and is_promotion_active(item)
    ]
    if code_promotions:
        lines.extend(["", "Ma giam gia co the nhap them khi dat tour:"])
        for item in code_promotions:
            lines.append(f"Ma {item.code}: {item.title}, {_format_discount(item.discount_type, item.discount_value)}")
            if item.terms:
                lines.append(f"Dieu kien ma {item.code}: {item.terms}")

    _append_section(lines, "Tom tat", tour.short_description)
    _append_section(lines, "Mo ta chi tiet", tour.description)
    _append_section(lines, "Lich trinh tong quan", tour.schedule)
    _append_section(lines, "Am thuc goi y", tour.food)
    _append_section(lines, "Phu hop voi", tour.suitable_for)
    _append_section(lines, "Diem noi bat", tour.highlights)

    itineraries = list(tour.itineraries or [])
    if itineraries:
        lines.extend(["", "Lich trinh theo ngay:"])
        for item in itineraries:
            lines.append(f"Ngay {item.day_number}: {item.title}")
            lines.append(item.description)
            if item.meals:
                lines.append(f"Bua an: {item.meals}")
            if item.accommodation:
                lines.append(f"Luu tru: {item.accommodation}")

    lines.extend(
        [
            "",
            "Cau hoi thuong gap:",
            f"Hoi: Tour {tour.title} di dau?",
            f"Dap: Tour di {tour.destination}.",
            f"Hoi: Tour {tour.title} gia bao nhieu?",
            f"Dap: Gia tour hien tai la {_format_price(tour.effective_price)} VND/nguoi.",
            f"Hoi: Tour {tour.title} keo dai bao lau?",
            f"Dap: Tour keo dai {tour.duration_days} ngay {tour.duration_nights} dem.",
        ]
    )
    return "\n".join(lines)


def _append_section(lines: list[str], title: str, content: str | None) -> None:
    if content and content.strip():
        lines.extend(["", f"{title}:", content.strip()])


def _format_price(price: Decimal) -> str:
    return f"{int(price):,}".replace(",", ".")


def _format_discount(discount_type, discount_value: Decimal) -> str:
    value = Decimal(discount_value)
    if getattr(discount_type, "value", discount_type) == "percent":
        percent = int(value) if value == value.to_integral_value() else value
        return f"Giam {percent}%"
    return f"Giam {_format_price(value)} VND"
