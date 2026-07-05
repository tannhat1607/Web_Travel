import { BookOpen, Clock, Map, PlaneTakeoff } from "lucide-react";

const guides = [
  {
    icon: PlaneTakeoff,
    title: "Chuẩn bị trước khi đặt tour",
    tag: "Kinh nghiệm",
    minutes: "5 phút đọc",
    text: "Kiểm tra lịch trình, điểm đón, bữa ăn, điều kiện hủy và số chỗ còn lại trước khi xác nhận booking.",
  },
  {
    icon: Map,
    title: "Cách chọn điểm đến theo thời gian",
    tag: "Gợi ý",
    minutes: "4 phút đọc",
    text: "Tour 1 ngày phù hợp đi gần, tour 3 ngày 2 đêm phù hợp nghỉ dưỡng ngắn, tour dài hơn nên ưu tiên lịch trình nhẹ.",
  },
  {
    icon: BookOpen,
    title: "Hỏi chatbot thế nào để nhận câu trả lời tốt",
    tag: "RAG chatbot",
    minutes: "3 phút đọc",
    text: "Hãy hỏi cụ thể về ngân sách, số ngày, điểm khởi hành hoặc nhu cầu gia đình để trợ lý lọc thông tin chính xác hơn.",
  },
];

export function TravelGuidesPage() {
  return (
    <div className="page content-page">
      <section className="content-hero guides-hero">
        <div>
          <span className="eyebrow"><BookOpen size={16} />Travel guides</span>
          <h1>Hướng dẫn ngắn để đặt tour tự tin hơn.</h1>
          <p>Các ghi chú thực tế giúp người dùng mới hiểu cách chọn tour, đặt chỗ và hỏi trợ lý du lịch.</p>
        </div>
      </section>

      <div className="guide-list">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <article key={guide.title}>
              <div className="guide-icon"><Icon size={24} /></div>
              <div>
                <span>{guide.tag}</span>
                <h2>{guide.title}</h2>
                <p>{guide.text}</p>
                <small><Clock size={14} />{guide.minutes}</small>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
