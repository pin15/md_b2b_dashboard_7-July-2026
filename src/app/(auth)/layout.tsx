import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The B2C page gradient is painted globally on <body> (globals.css); keep this
  // wrapper transparent so it shows through, matching the B2C auth surface.
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* B2C logo lockup — raster PNG via next/image (doc §3), not a wordmark. */}
          <Link href="/" className="inline-flex">
            <Image
              src="/images/moodscale_logo1.png"
              alt="MoodScale"
              width={140}
              height={35}
              priority
              className="h-8 w-auto md:h-9"
            />
          </Link>
          <p className="mt-2 text-sm text-brand-muted">Employer Dashboard</p>
        </div>
        {children}
      </div>
    </div>
  );
}
