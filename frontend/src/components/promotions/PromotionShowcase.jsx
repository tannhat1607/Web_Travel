import { BadgePercent, ChevronRight, Copy, Gift, Info } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../../utils/format";

function formatDiscount(promotion) {
  if (promotion.discount_type === "percent") return `${Number(promotion.discount_value)}%`;
  return formatCurrency(promotion.discount_value);
}

export function PromotionShowcase({ promotions = [], compact = false, onCodeSelect }) {
  const [copiedCode, setCopiedCode] = useState("");
  const visiblePromotions = promotions.filter((promotion) => promotion.code);

  function copyCode(promotion) {
    navigator.clipboard?.writeText(promotion.code);
    setCopiedCode(promotion.code);
    onCodeSelect?.(promotion.code);
  }

  if (!visiblePromotions.length) return null;

  return (
    <section className={compact ? "promo-showcase compact" : "promo-showcase"}>
      {!compact && (
        <div className="promo-hero-banner">
          <div className="promo-sale-mark">Deal tốt trên app</div>
          <div className="promo-sale-number">7.7</div>
          <div>
            <strong>Epic Sale</strong>
            <span>Ưu đãi tour lên đến {formatDiscount(visiblePromotions[0])}</span>
          </div>
          <div className="promo-ticket">Mã giảm giá cộng dồn</div>
          <div className="promo-qr" aria-hidden="true">
            {Array.from({ length: 49 }).map((_, index) => <i key={index} />)}
          </div>
          <button type="button">Xem ưu đãi <ChevronRight size={18} /></button>
        </div>
      )}

      <div className="promo-heading">
        <Gift size={30} />
        <div>
          <h2>Phiếu giảm giá cho người đặt tour</h2>
          <p>Nhập mã khi đặt tour để giảm thêm trên giá ưu đãi hiện có.</p>
        </div>
      </div>

      <div className="promo-coupon-row">
        {visiblePromotions.slice(0, compact ? 3 : 6).map((promotion) => (
          <article className="promo-coupon-card" key={promotion.id}>
            <div className="promo-coupon-top">
              <span><BadgePercent size={15} /></span>
              <div>
                <strong>{promotion.title}</strong>
                <p>{promotion.description || `Giảm ${formatDiscount(promotion)} khi nhập mã.`}</p>
              </div>
              <Info size={16} />
            </div>
            <div className="promo-coupon-code">
              <Copy size={17} />
              <strong>{promotion.code}</strong>
              <button type="button" onClick={() => copyCode(promotion)}>
                {copiedCode === promotion.code ? "Đã copy" : "Copy"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
