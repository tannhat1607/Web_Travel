import { ArrowRight, BookOpen, Clock, Map, PlaneTakeoff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contentApi } from "../../api/contentApi";

export const fallbackGuides = [
  {
    icon: PlaneTakeoff,
    slug: "chuan-bi-truoc-khi-dat-tour",
    title: "Chuẩn bị trước khi đặt tour",
    tag: "Kinh nghiệm",
    minutes: "5 phút đọc",
    text: "Kiểm tra lịch trình, điểm đón, bữa ăn, điều kiện hủy và số chỗ còn lại trước khi xác nhận booking.",
    content: "Kiểm tra kỹ lịch trình, điểm đón, bữa ăn, điều kiện hủy và số chỗ còn lại trước khi xác nhận booking. Nếu tour có nhiều lịch khởi hành, hãy chọn đúng ngày phù hợp với kế hoạch cá nhân. Sau khi điền thông tin, kiểm tra lại hóa đơn và phương thức thanh toán trước khi hoàn tất giao dịch.",
  },
  {
    icon: Map,
    slug: "cach-chon-diem-den-theo-thoi-gian",
    title: "Cách chọn điểm đến theo thời gian",
    tag: "Gợi ý",
    minutes: "4 phút đọc",
    text: "Tour 1 ngày phù hợp đi gần, tour 3 ngày 2 đêm phù hợp nghỉ dưỡng ngắn, tour dài hơn nên ưu tiên lịch trình nhẹ.",
    content: "Tour một ngày phù hợp với điểm đến gần và lịch trình tập trung. Tour ba ngày hai đêm phù hợp cho kỳ nghỉ ngắn, còn hành trình dài hơn nên có thời gian nghỉ xen kẽ. Hãy cân nhắc thời gian di chuyển, thời tiết và nhu cầu của trẻ nhỏ hoặc người lớn tuổi trước khi chọn.",
  },
  {
    icon: BookOpen,
    slug: "hoi-chatbot-de-nhan-cau-tra-loi-tot",
    title: "Hỏi chatbot thế nào để nhận câu trả lời tốt",
    tag: "RAG chatbot",
    minutes: "3 phút đọc",
    text: "Hãy hỏi cụ thể về ngân sách, số ngày, điểm khởi hành hoặc nhu cầu gia đình để trợ lý lọc thông tin chính xác hơn.",
    content: "Hãy hỏi cụ thể về ngân sách, số ngày, điểm khởi hành và số người đi cùng. Bạn cũng có thể nêu nhu cầu như đi cùng trẻ nhỏ, thích nghỉ dưỡng hay muốn khám phá. Trợ lý chỉ trả lời dựa trên dữ liệu tour và nội dung đã có trong hệ thống, vì vậy câu hỏi càng rõ thì gợi ý càng sát nhu cầu.",
  },
];

export function readingTime(content) {
  const wordCount = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(wordCount / 220))} phút đọc`;
}

export function TravelGuidesPage() {
  const [guides, setGuides] = useState(fallbackGuides);

  useEffect(() => {
    contentApi.list({ content_type: "guide", limit: 20 }).then((response) => {
      if (response.data.length) {
        setGuides(response.data.map((item) => ({
          icon: BookOpen,
          title: item.title,
          tag: "Cẩm nang",
          slug: item.slug,
          minutes: readingTime(item.content || item.excerpt),
          text: item.excerpt || item.content,
          content: item.content,
          image_url: item.image_url,
        })));
      }
    }).catch(() => {});
  }, []);

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
            <article key={guide.slug || guide.title}>
              <Link className="guide-card-link" to={`/travel-guides/${guide.slug}`}>
                {guide.image_url ? <img className="guide-cover" src={guide.image_url} alt={guide.title} /> : <div className="guide-icon"><Icon size={24} /></div>}
                <div>
                  <span>{guide.tag}</span>
                  <h2>{guide.title}</h2>
                  <p>{guide.text}</p>
                  <div className="guide-card-footer"><small><Clock size={14} />{guide.minutes}</small><strong>Đọc bài <ArrowRight size={16} /></strong></div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
