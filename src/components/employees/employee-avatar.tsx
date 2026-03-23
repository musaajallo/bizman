import { cn } from "@/lib/utils";

interface Props {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string | null;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export function EmployeeAvatar({ firstName, lastName, photoUrl, size = "md", color }: Props) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const bg = color || "#4F6EF7";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover shrink-0", sizeClasses[size])}
      />
    );
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizeClasses[size])}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}
