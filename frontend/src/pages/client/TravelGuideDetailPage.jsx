import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { contentApi } from "../../api/contentApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Loading } from "../../components/common/Loading.jsx";
import { fallbackGuides, readingTime } from "./TravelGuidesPage.jsx";

export function TravelGuideDetailPage() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    contentApi.detail(slug).then((response) => {
      if (response.data.content_type !== "guide") throw new Error("Not a guide");
      setGuide(response.data);
    }).catch(() => {
      setGuide(fallbackGuides.find((item) => item.slug === slug) || null);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page"><Loading /></div>;
  if (!guide) return <div className="page"><EmptyState title="Không tìm thấy cẩm nang" message="Bài viết có thể đã được ẩn hoặc đường dẫn không còn tồn tại." /></div>;

  const content = guide.content || guide.text || guide.excerpt || "Nội dung đang được cập nhật.";
  const paragraphs = content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <article className="page guide-detail-page">
      <Link className="guide-back-link" to="/travel-guides"><ArrowLeft size={17} />Tất cả cẩm nang</Link>
      <header className="guide-detail-header">
        <div>
          <span className="eyebrow"><BookOpen size={16} />Cẩm nang Travelora</span>
          <h1>{guide.title}</h1>
          {guide.excerpt && <p>{guide.excerpt}</p>}
          <small><Clock size={15} />{readingTime(content)}</small>
        </div>
        {guide.image_url && <img src={guide.image_url} alt={guide.title} />}
      </header>
      <div className="guide-article-body">
        {paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
      </div>
    </article>
  );
}
