import { BadgePercent } from "lucide-react";
import { useEffect, useState } from "react";
import { promotionApi } from "../../api/promotionApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Loading } from "../../components/common/Loading.jsx";
import { PromotionShowcase } from "../../components/promotions/PromotionShowcase.jsx";

export function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    promotionApi.list({ limit: 50 })
      .then((response) => setPromotions(response.data))
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page content-page promotions-client-page">
      <section className="promotion-page-heading">
        <span className="eyebrow"><BadgePercent size={16} />Ưu đãi Travelora</span>
        <h1>Khuyến mãi đang áp dụng</h1>
        <p>Chọn mã phù hợp, sao chép và nhập tại bước hóa đơn khi đặt tour.</p>
      </section>
      {loading ? <Loading /> : promotions.length ? (
        <PromotionShowcase promotions={promotions} showAll />
      ) : (
        <EmptyState title="Chưa có khuyến mãi" message="Các chương trình mới sẽ được cập nhật tại đây." />
      )}
    </div>
  );
}
