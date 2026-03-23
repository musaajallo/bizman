"use server";

import { prisma } from "@/lib/prisma";

export async function getCrossProjectDashboard(tenantId: string) {
  const projects = await prisma.project.findMany({
    where: { tenantId, archivedAt: null },
    include: {
      clientTenant: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get task stats per project
  const projectStats = await Promise.all(
    projects.map(async (project) => {
      const [totalTasks, doneTasks, overdueTasks, totalTimeMinutes] = await Promise.all([
        prisma.task.count({ where: { projectId: project.id } }),
        prisma.task.count({ where: { projectId: project.id, completedAt: { not: null } } }),
        prisma.task.count({
          where: { projectId: project.id, dueDate: { lt: new Date() }, completedAt: null },
        }),
        prisma.timeEntry.aggregate({
          where: { task: { projectId: project.id } },
          _sum: { minutes: true },
        }),
      ]);

      return {
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        status: project.status,
        priority: project.priority,
        client: project.clientTenant?.name ?? project.orgName ?? project.contactName ?? null,
        progress: project.progress,
        totalTasks,
        doneTasks,
        overdueTasks,
        totalTimeMinutes: totalTimeMinutes._sum.minutes ?? 0,
        budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : null,
        hourlyRate: project.hourlyRate ? Number(project.hourlyRate) : null,
        billingType: project.billingType,
        budgetCurrency: project.budgetCurrency,
        memberCount: project.members.length,
        startDate: project.startDate,
        endDate: project.endDate,
      };
    })
  );

  // Summary stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalAllTasks = projectStats.reduce((sum, p) => sum + p.totalTasks, 0);
  const totalDoneTasks = projectStats.reduce((sum, p) => sum + p.doneTasks, 0);
  const totalOverdue = projectStats.reduce((sum, p) => sum + p.overdueTasks, 0);
  const totalTrackedMinutes = projectStats.reduce((sum, p) => sum + p.totalTimeMinutes, 0);

  // Revenue calculation for hourly projects
  const estimatedRevenue = projectStats.reduce((sum, p) => {
    if (p.billingType === "hourly" && p.hourlyRate && p.totalTimeMinutes > 0) {
      return sum + (p.totalTimeMinutes / 60) * p.hourlyRate;
    }
    if (p.billingType === "fixed" && p.budgetAmount) {
      return sum + p.budgetAmount;
    }
    return sum;
  }, 0);

  return {
    projects: projectStats,
    summary: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalAllTasks,
      totalDoneTasks,
      totalOverdue,
      totalTrackedMinutes,
      estimatedRevenue,
    },
  };
}

export async function getProjectProfitability(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      budgetAmount: true,
      hourlyRate: true,
      billingType: true,
      budgetCurrency: true,
    },
  });
  if (!project) return null;

  const totalTime = await prisma.timeEntry.aggregate({
    where: { task: { projectId } },
    _sum: { minutes: true },
  });

  const totalMinutes = totalTime._sum.minutes ?? 0;
  const totalHours = totalMinutes / 60;

  let revenue = 0;
  let cost = 0;
  if (project.billingType === "hourly" && project.hourlyRate) {
    revenue = totalHours * Number(project.hourlyRate);
  } else if (project.billingType === "fixed" && project.budgetAmount) {
    revenue = Number(project.budgetAmount);
  }

  // Time by user
  const timeByUser = await prisma.timeEntry.groupBy({
    by: ["userId"],
    where: { task: { projectId } },
    _sum: { minutes: true },
  });

  return {
    budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : null,
    hourlyRate: project.hourlyRate ? Number(project.hourlyRate) : null,
    billingType: project.billingType,
    budgetCurrency: project.budgetCurrency,
    totalMinutes,
    totalHours,
    revenue,
    cost,
    profit: revenue - cost,
    teamTime: timeByUser,
  };
}
