"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTaskComments(taskId: string) {
  return prisma.taskComment.findMany({
    where: { taskId, parentId: null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTaskComment(taskId: string, content: string, parentId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!content.trim()) return { error: "Comment cannot be empty" };

  await prisma.taskComment.create({
    data: {
      taskId,
      authorId: session.user.id,
      content: content.trim(),
      parentId: parentId || undefined,
    },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function updateTaskComment(commentId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== session.user.id) return { error: "Not allowed" };

  await prisma.taskComment.update({
    where: { id: commentId },
    data: { content: content.trim() },
  });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function deleteTaskComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== session.user.id) return { error: "Not allowed" };

  await prisma.taskComment.delete({ where: { id: commentId } });

  revalidatePath("/africs/projects");
  return { success: true };
}
