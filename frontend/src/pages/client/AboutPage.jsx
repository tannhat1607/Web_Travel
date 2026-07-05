import { Award, Headphones, MapPinned, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  { icon: ShieldCheck, title: "Minh bạch", text: "Thông tin tour, lịch trình và chi phí được trình bày rõ trước khi đặt." },
  { icon: Headphones, title: "Hỗ trợ nhanh", text: "Khách hàng có thể hỏi trợ lý AI hoặc gửi liên hệ để được tư vấn." },
  { icon: MapPinned, title: "Hiểu điểm đến", text: "Dữ liệu tour được tổ chức để gợi ý hành trình phù hợp với nhu cầu thật." },
];

export function AboutPage() {
  return (
    <div className="page content-page">
      <section className="content-hero about-hero">
        <div>
          <span className="eyebrow"><Sparkles size={16} />Về Travelora</span>
          <h1>Chúng tôi xây dựng trải nghiệm đặt tour gọn, rõ và dễ tin cậy.</h1>
          <p>
            Travelora là nền tảng đặt tour du lịch kết hợp trợ lý chatbot RAG, giúp khách xem tour,
            hỏi thông tin, đặt chỗ và quản lý chuyến đi trên cùng một hệ thống.
          </p>
          <Link className="primary-button" to="/tours">Khám phá tour</Link>
        </div>
      </section>

      <section className="metric-strip">
        <article><strong>15+</strong><span>điểm đến mẫu</span></article>
        <article><strong>24/7</strong><span>trợ lý tư vấn</span></article>
        <article><strong>3 bước</strong><span>hoàn tất booking</span></article>
      </section>

      <section className="section-heading">
        <div>
          <span className="eyebrow">Cách chúng tôi làm</span>
          <h2>Tập trung vào hành trình của khách</h2>
        </div>
      </section>
      <div className="info-grid">
        {values.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={25} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>

      <section className="story-band">
        <div>
          <Award size={28} />
          <h2>Mục tiêu dự án</h2>
        </div>
        <p>
          Dự án ưu tiên hoàn thiện backend API, quản trị tour, booking, đánh giá, liên hệ và RAG chatbot.
          Frontend React được xây dựng để trình bày đầy đủ các luồng chính cho người dùng và admin.
        </p>
        <div>
          <Users size={28} />
          <h2>Đối tượng sử dụng</h2>
        </div>
        <p>
          Khách du lịch cần tìm tour nhanh, admin cần quản lý dữ liệu tour, và hệ thống chatbot cần truy xuất
          kiến thức đã upload để trả lời chính xác hơn.
        </p>
      </section>
    </div>
  );
}
