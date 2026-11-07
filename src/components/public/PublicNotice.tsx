interface PublicNoticeProps {
  title: string;
  description: string;
  // Spacing and background, which change with the section around the notice.
  className?: string;
}

// Shown instead of a list that is empty or could not be loaded.
export default function PublicNotice({ title, description, className = "py-16 px-6 bg-site-card" }: PublicNoticeProps) {
  return (
    <div role="status" className={`text-center border border-site-text/8 ${className}`}>
      <p className="text-[18px] text-site-text mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{title}</p>
      <p className="text-[14px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{description}</p>
    </div>
  );
}
