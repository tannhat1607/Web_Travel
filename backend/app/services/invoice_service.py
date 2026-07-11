from io import BytesIO
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


def booking_invoice_pdf(booking) -> bytes:
    buffer = BytesIO()
    font_path = Path("C:/Windows/Fonts/arial.ttf")
    bold_path = Path("C:/Windows/Fonts/arialbd.ttf")
    regular, bold = "Helvetica", "Helvetica-Bold"
    if font_path.exists():
        pdfmetrics.registerFont(TTFont("Invoice", str(font_path)))
        regular = "Invoice"
    if bold_path.exists():
        pdfmetrics.registerFont(TTFont("InvoiceBold", str(bold_path)))
        bold = "InvoiceBold"
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    c.setFillColor(colors.HexColor("#12345b")); c.rect(0, height - 105, width, 105, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont(bold, 24); c.drawString(42, height - 58, "TRAVELORA")
    c.setFont(regular, 10); c.drawString(42, height - 78, "HÓA ĐƠN ĐẶT TOUR")
    c.setFillColor(colors.HexColor("#10233f")); c.setFont(bold, 17); c.drawString(42, height - 145, f"Hóa đơn #{booking.id}")
    c.setFont(regular, 10); c.setFillColor(colors.HexColor("#65758b")); c.drawRightString(width - 42, height - 145, booking.created_at.strftime("%d/%m/%Y"))
    y = height - 185
    rows = [("Khách hàng", booking.customer_name), ("Email", booking.customer_email), ("Điện thoại", booking.customer_phone), ("Tour", booking.tour_title or str(booking.tour_id)), ("Khởi hành", booking.departure_at.strftime("%d/%m/%Y %H:%M") if booking.departure_at else "Lịch linh hoạt"), ("Hành khách", f"{booking.adult_count} người lớn, {booking.child_count} trẻ em"), ("Thanh toán", booking.payment.status.value if booking.payment else "unpaid")]
    for label, value in rows:
        c.setFont(regular, 10); c.setFillColor(colors.HexColor("#65758b")); c.drawString(42, y, label)
        c.setFont(bold, 10); c.setFillColor(colors.HexColor("#10233f")); c.drawString(170, y, str(value)); y -= 28
    y -= 12; c.setStrokeColor(colors.HexColor("#dce4ef")); c.line(42, y, width - 42, y); y -= 38
    c.setFont(bold, 12); c.drawString(42, y, "Tổng thanh toán")
    c.setFont(bold, 19); c.setFillColor(colors.HexColor("#e96318")); c.drawRightString(width - 42, y, f"{float(booking.total_price):,.0f} VND")
    c.setFillColor(colors.HexColor("#65758b")); c.setFont(regular, 9); c.drawString(42, 52, "Hóa đơn điện tử phát hành bởi Travelora - giao dịch demo.")
    c.showPage(); c.save(); return buffer.getvalue()
