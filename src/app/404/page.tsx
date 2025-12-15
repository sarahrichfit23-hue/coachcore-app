import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-16 text-center text-gray-800">
      <div className="max-w-lg space-y-6">
        <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">
          404
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Page not found</h1>
        <p className="text-base text-gray-600">
          You don&apos;t have access to this page. Please return to the login
          screen to continue.
        </p>
        <div className="flex justify-center">
          <Button asChild className="px-6">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
