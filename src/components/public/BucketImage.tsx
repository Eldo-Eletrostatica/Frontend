import Image, { type ImageProps } from "next/image";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]);

// Next refuses to optimize images whose host resolves to a private IP (SSRF
// guard), and inside the container "localhost" is not the host running the
// development bucket. Those images skip the optimizer and load straight from
// the bucket; the public bucket of production is still optimized.
function isLocalBucketUrl(src: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

// next/image for the images uploaded to the bucket (ADR 0006).
export default function BucketImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={isLocalBucketUrl(src)} {...props} />;
}
