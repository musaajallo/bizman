"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityIndicator } from "./priority-indicator";
import { ProjectProgress } from "./project-progress";
import { MemberAvatarGroup } from "./member-avatar-group";
import Link from "next/link";

interface ProjectBoardCardProps {
  project: {
    slug: string;
    name: string;
    priority: string;
    type: string;
    progress: number;
    clientTenant?: { name: string; slug: string } | null;
    contactName?: string | null;
    category?: { id: string; name: string } | null;
    members: { user: { id: string; name: string | null; image: string | null } }[];
    _count: { tasks: number };
    endDate?: Date | string | null;
    isRolling?: boolean;
  };
  baseUrl: string;
}

export function ProjectBoardCard({ project, baseUrl }: ProjectBoardCardProps) {
  return (
    <Link href={`${baseUrl}/${project.slug}`}>
      <Card className="transition-colors hover:border-primary/50 cursor-pointer">
        <CardContent className="pt-4 pb-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-snug line-clamp-2">
              {project.name}
            </h4>
            <PriorityIndicator priority={project.priority} />
          </div>

          {(project.clientTenant || project.contactName) && (
            <p className="text-xs text-muted-foreground truncate">
              {project.clientTenant?.name ?? project.contactName}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {project.type}
            </Badge>
            {project.category && (
              <Badge variant="outline" className="text-[10px]">
                {project.category.name}
              </Badge>
            )}
          </div>

          <ProjectProgress value={project.progress} />

          <div className="flex items-center justify-between">
            <MemberAvatarGroup members={project.members} />
            <span className="text-[10px] text-muted-foreground">
              {project._count.tasks} tasks
            </span>
          </div>

          {project.endDate && !project.isRolling && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Due {new Date(project.endDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
