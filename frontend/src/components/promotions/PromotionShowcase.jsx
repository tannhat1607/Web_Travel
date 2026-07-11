import { BadgePercent, ChevronRight, Copy, Gift, Info } from "lucide-react";
import { useRef, useState } from "react";
import { formatCurrency } from "../../utils/format";

function formatDiscount(promotion) {
  if (promotion.discount_type === "percent") return `${Number(promotion.discount_value)}%`;
  return formatCurrency(promotion.discount_value);
}

export function PromotionShowcase({ promotions = [], compact = false, onCodeSelect }) {
  const [copiedCode, setCopiedCode] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerTrackRef = useRef(null);
  const dragRef = useRef(null);
  const visiblePromotions = promotions.filter((promotion) => promotion.code);
  const bannerPromotions = visiblePromotions.filter((promotion) => promotion.banner_image_url);

  function copyCode(promotion) {
    navigator.clipboard?.writeText(promotion.code);
    setCopiedCode(promotion.code);
    onCodeSelect?.(promotion.code);
  }

  function updateActiveBanner(event) {
    const track = event.currentTarget;
    if (!track.clientWidth) return;
    setActiveBanner(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goToBanner(index) {
    bannerTrackRef.current?.scrollTo({ left: index * bannerTrackRef.current.clientWidth, behavior: "smooth" });
    setActiveBanner(index);
  }

  function startBannerDrag(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragRef.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveBannerDrag(event) {
    if (!dragRef.current) return;
    event.currentTarget.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.x);
  }

  function endBannerDrag(event) {
    if (!dragRef.current) return;
    dragRef.current = null;
    const index = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
    goToBanner(index);
  }

  if (!visiblePromotions.length) return null;

  return (
    <section id={compact ? undefined : "promotions"} className={compact ? "promo-showcase compact" : "promo-showcase"}>
      {!compact && (bannerPromotions.length ? (
        <div className="promo-banner-carousel">
          <div
            className="promo-banner-track"
            ref={bannerTrackRef}
            onScroll={updateActiveBanner}
            onPointerDown={startBannerDrag}
            onPointerMove={moveBannerDrag}
            onPointerUp={endBannerDrag}
            onPointerCancel={endBannerDrag}
          >
            {bannerPromotions.map((promotion) => (
              <article className="promo-image-banner" key={promotion.id}>
                <img src={promotion.banner_image_url} alt={`Khuyến mãi ${promotion.title}`} draggable="false" />
                <div className="promo-image-caption">
                  <span>Ưu đãi đang diễn ra</span>
                  <strong>{promotion.title}</strong>
                  <button type="button" onClick={() => copyCode(promotion)}>Copy mã {promotion.code}<Copy size={17} /></button>
                </div>
              </article>
            ))}
          </div>
          {bannerPromotions.length > 1 && (
            <div className="promo-banner-dots" aria-label="Chọn banner khuyến mãi">
              {bannerPromotions.map((promotion, index) => (
                <button
                  type="button"
                  key={promotion.id}
                  className={index === activeBanner ? "active" : ""}
                  onClick={() => goToBanner(index)}
                  aria-label={`Xem banner ${index + 1}`}
                  aria-current={index === activeBanner ? "true" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
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
          <button type="button" onClick={() => document.querySelector(".promo-coupon-row")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Xem ưu đãi <ChevronRight size={18} /></button>
        </div>
      ))}

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
