import Image from "next/image";
import BucketImage from "./BucketImage";
import bundledLogo from "@/imports/image.png";
import type { VisualSettings } from "./publicContent";

interface SiteLogoProps {
  logo: VisualSettings["logo"];
  // Side of the square box, in pixels.
  size: number;
  textClassName: string;
  taglineClassName: string;
}

// Without a published image the site shows the logo bundled in the Frontend,
// which is black on transparent and needs inverting on the dark background.
export default function SiteLogo({ logo, size, textClassName, taglineClassName }: SiteLogoProps) {
  return (
    <>
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: size, height: size }}>
        {logo.imageUrl ? (
          <BucketImage src={logo.imageUrl} alt={logo.text} fill sizes={`${size}px`} className="object-contain" />
        ) : (
          <Image
            src={bundledLogo}
            alt={logo.text}
            fill
            sizes={`${size}px`}
            className="object-contain"
            style={{ filter: "invert(1)", mixBlendMode: "screen" }}
          />
        )}
      </div>
      <div>
        <p className={`text-site-text ${textClassName}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{logo.text}</p>
        <p className={taglineClassName} style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PINTURA ELETROSTÁTICA</p>
      </div>
    </>
  );
}
