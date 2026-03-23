import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Member {
  user: { id: string; name: string | null; image: string | null };
}

export function MemberAvatarGroup({ members, max = 4 }: { members: Member[]; max?: number }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((m) => {
        const initials = (m.user.name ?? "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Avatar key={m.user.id} className="h-7 w-7 border-2 border-background">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        );
      })}
      {overflow > 0 && (
        <Avatar className="h-7 w-7 border-2 border-background">
          <AvatarFallback className="text-[10px] bg-muted">+{overflow}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
