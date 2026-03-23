import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.svg"
            alt="AfricsCore"
            width={140}
            height={67}
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}
