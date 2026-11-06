import logoImg from "@/imports/image.png";

interface Props {
  className?: string;
  imageClassName?: string;
  subtitle?: string;
  onClick?: () => void;
}

export default function EldoLogo({ className = "", imageClassName = "w-[38px] h-[38px]", subtitle = "PINTURA ELETROSTÁTICA", onClick }: Props) {
  const content = (
    <>
      <div className={`${imageClassName} overflow-hidden flex-shrink-0`}>
        <img src={logoImg.src} alt="Eldo Pintura Eletrostática" className="w-full h-full object-contain" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
      </div>
      <div>
        <p className="text-[#f5f2ec] text-[13px] tracking-[2.1px] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>ELDO</p>
        <p className="text-[rgba(245,242,236,0.5)] text-[8px] tracking-[2.2px] leading-tight" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{subtitle}</p>
      </div>
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 text-left ${className}`}>{content}</button>
  ) : (
    <div className={`flex items-center gap-3 ${className}`}>{content}</div>
  );
}
