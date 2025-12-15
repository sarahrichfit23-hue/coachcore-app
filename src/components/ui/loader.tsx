import Image from "next/image";
import { Loader2 } from "lucide-react";

export function CoachCoreLoader({ loadingText = "Loading your workspace..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/coach-core-logo-new.png"
          alt="Coach Core"
          width={120}
          height={120}
          priority
        />
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-medium text-gray-900">{loadingText}</p>
          <Loader2 className="h-6 w-6 animate-spin text-[#f0b43c]" />
        </div>
      </div>
    </div>
  );
}
