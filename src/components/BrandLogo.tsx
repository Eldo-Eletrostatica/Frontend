"use client";

import { useState } from "react";
import Image from "next/image";
import bundledLogo from "@/imports/eldo-logo.png";
import type { VisualSettings } from "@/components/public/publicContent";
import { useVisualSettings } from "@/lib/siteSettings/VisualSettingsProvider";

interface BrandLogoProps {
  logo?: VisualSettings["logo"];
  size?: number;
  subtitle?: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
  onClick?: () => void;
  bare?: boolean;
}

export default function BrandLogo({
  logo,
  size = 38,
  subtitle = "PINTURA ELETROSTÁTICA",
  className = "",
  imageClassName = "",
  textClassName = "text-[13px] tracking-[2.1px] leading-tight",
  taglineClassName = "text-site-text/50 text-[8px] tracking-[2.2px] leading-tight",
  onClick,
  bare = false,
}: BrandLogoProps) {
  const { visualSettings } = useVisualSettings();
  const activeLogo = logo ?? visualSettings.logo;
  const brandName = activeLogo.text.trim() || "ELDO";
  const trimmedUrl = activeLogo.imageUrl?.trim() || null;
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const customImageUrl = trimmedUrl && failedImageUrl !== trimmedUrl ? trimmedUrl : null;

  const boxStyle = imageClassName ? undefined : { width: size, height: size };

  const content = (
    <>
      <div
        className={`relative flex-shrink-0 overflow-hidden ${imageClassName}`}
        style={boxStyle}
      >
        {customImageUrl ? (
          <Image
            src={customImageUrl}
            alt={brandName}
            fill
            sizes={`${size}px`}
            unoptimized
            onError={() => setFailedImageUrl(customImageUrl)}
            className="object-contain"
          />
        ) : (
          <Image
            src={bundledLogo}
            alt={brandName}
            fill
            sizes={`${size}px`}
            className="object-contain"
          />
        )}
      </div>
      <div>
        <p className={`text-site-text ${textClassName}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          {brandName}
        </p>
        <p className={taglineClassName} style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          {subtitle}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`flex items-center gap-3 text-left ${className}`}>
        {content}
      </button>
    );
  }

  if (bare) {
    return content;
  }

  return <div className={`flex items-center gap-3 ${className}`}>{content}</div>;
}

