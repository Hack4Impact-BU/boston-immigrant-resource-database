import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BirdLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  href?: string;
};

export default function BirdLogo({
  variant = "dark",
  className,
  href = "/",
}: BirdLogoProps) {
  const content = (
    <Image
      src="/icons/full_logo.png"
      alt="Boston Immigrant Resource Dashboard"
      width={88}
      height={55}
      className={cn(
        "h-10 w-auto",
        variant === "light" && "brightness-0 invert",
        className,
      )}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
