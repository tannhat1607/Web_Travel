from app.db.database import SessionLocal
from app.models.knowledge import KnowledgeDocument

SAMPLES = [
    {
        "title": "Tour Da Nang - Hoi An 3 ngay 2 dem",
        "source_type": "tour",
        "content": (
            "Tour Da Nang - Hoi An 3 ngay 2 dem co gia 2.990.000 VND. "
            "Lich trinh ngay 1 tham quan ban dao Son Tra va bien My Khe. "
            "Ngay 2 di Ba Na Hills, Cau Vang. Ngay 3 tham quan pho co Hoi An. "
            "Am thuc goi y gom mi Quang, banh trang cuon thit heo va cao lau. "
            "Tour phu hop cho gia dinh, cap doi va nhom ban."
        ),
        "metadata": {"destination": "Da Nang, Hoi An", "duration_days": 3},
    },
    {
        "title": "Tour Hue 1 ngay",
        "source_type": "tour",
        "content": (
            "Tour Hue 1 ngay khoi hanh tu Da Nang, gia 890.000 VND. "
            "Lich trinh gom Dai Noi Hue, chua Thien Mu, lang Khai Dinh va song Huong. "
            "Am thuc goi y gom bun bo Hue, com hen va banh beo. "
            "Tour phu hop voi khach thich van hoa, lich su va kien truc co do."
        ),
        "metadata": {"destination": "Hue", "duration_days": 1},
    },
    {
        "title": "Tour Ba Na Hills 1 ngay",
        "source_type": "tour",
        "content": (
            "Tour Ba Na Hills 1 ngay co gia 1.250.000 VND. "
            "Diem noi bat gom cap treo Ba Na, Cau Vang, lang Phap va Fantasy Park. "
            "Tour phu hop cho gia dinh, cap doi va khach lan dau den Da Nang."
        ),
        "metadata": {"destination": "Da Nang", "duration_days": 1},
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        created = 0
        for sample in SAMPLES:
            exists = db.query(KnowledgeDocument).filter(KnowledgeDocument.title == sample["title"]).first()
            if exists:
                continue
            document = KnowledgeDocument(
                title=sample["title"],
                source_type=sample["source_type"],
                content=sample["content"],
                document_metadata=sample["metadata"],
            )
            db.add(document)
            created += 1
        db.commit()
        print(f"Created {created} knowledge documents.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
