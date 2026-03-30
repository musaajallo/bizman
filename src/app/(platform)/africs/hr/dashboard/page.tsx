import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  UserCheck,
  CalendarOff,
  Timer,
  AlarmClock,
  Users,
  UserMinus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Building2,
  Plus,
  UserPlus,
  UserRoundPlus,
  Trophy,
  Award,
  Star,
  UsersRound,
} from "lucide-react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeeStats } from "@/lib/actions/employees";
import { getTimesheetStats } from "@/lib/actions/timesheets";
import { getOvertimeDashboardStats } from "@/lib/actions/overtime";
import { getLeaveDashboardStats } from "@/lib/actions/leave";
import { getPayrollStats } from "@/lib/actions/payroll";
import { getRecruitmentStats } from "@/lib/actions/recruitment";
import { getReferralStats } from "@/lib/actions/referrals";
import { getAppraisalStats } from "@/lib/actions/appraisals";
import { getTalentPoolStats } from "@/lib/actions/talent-pool";
import { notFound } from "next/navigation";

function StatCard({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-base font-semibold font-mono">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  icon,
  iconColor,
  title,
  subtitle,
  href,
  extraActions,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        <Link href={href}>
          <Button size="sm" variant="outline" className="gap-2 text-xs">
            View {title}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function HRDashboardPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [empStats, timesheetStats, overtimeStats, leaveStats, payrollStats, recruitmentStats, referralStats, appraisalStats, talentPoolStats] = await Promise.all([
    getEmployeeStats(owner.id),
    getTimesheetStats(),
    getOvertimeDashboardStats(),
    getLeaveDashboardStats(),
    getPayrollStats(),
    getRecruitmentStats(),
    getReferralStats(),
    getAppraisalStats(),
    getTalentPoolStats(),
  ]);

  const topDepts = Object.entries(empStats.byDepartment)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const typeLabels: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    intern: "Intern",
  };

  return (
    <div>
      <TopBar
        title="Human Resources"
        subtitle="HR overview across all modules"
      />
      <div className="p-6 space-y-10">

        {/* ============================================================
            SECTION: Workforce
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<UserCheck className="h-4 w-4 text-primary" />}
            iconColor="bg-primary/10"
            title="Employees"
            subtitle="Headcount, departments, and recent hires"
            href="/africs/hr/employees"
            extraActions={
              <Link href="/africs/hr/employees/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Employee</Button>
              </Link>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              color="bg-primary/10"
              icon={<Users className="h-4 w-4 text-primary" />}
              label="Total Employees"
              value={empStats.total}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
              label="Active"
              value={empStats.active}
            />
            <StatCard
              color="bg-amber-500/10"
              icon={<CalendarOff className="h-4 w-4 text-amber-500" />}
              label="On Leave"
              value={empStats.onLeave}
            />
            <StatCard
              color="bg-muted"
              icon={<UserMinus className="h-4 w-4 text-muted-foreground" />}
              label="Inactive"
              value={empStats.inactive}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Departments */}
            <Card>
              <CardHeader><CardTitle className="text-sm">By Department</CardTitle></CardHeader>
              <CardContent>
                {topDepts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topDepts.map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{dept}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.round((count / empStats.total) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-5 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment type */}
            <Card>
              <CardHeader><CardTitle className="text-sm">By Employment Type</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(empStats.byType).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(empStats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{typeLabels[type] ?? type}</span>
                        </div>
                        <span className="text-sm font-mono">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent hires */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Hires (90 days)</CardTitle></CardHeader>
              <CardContent>
                {empStats.recentHires.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent hires</p>
                ) : (
                  <div className="space-y-3">
                    {empStats.recentHires.map((emp) => (
                      <Link key={emp.id} href={`/africs/hr/employees/${emp.id}`} className="flex items-center gap-3 group">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-primary">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{emp.jobTitle ?? emp.department ?? "—"}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
                          {emp.startDate ? new Date(emp.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================
            SECTION: Leave / Time Off
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<CalendarOff className="h-4 w-4 text-teal-500" />}
            iconColor="bg-teal-500/10"
            title="Time Off"
            subtitle="Leave requests and balances"
            href="/africs/hr/time-off"
            extraActions={
              <Link href="/africs/hr/time-off/requests/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Request</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Pending Requests"
              value={leaveStats.pending}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Approved (This Year)"
              value={leaveStats.approved}
            />
            <StatCard
              color="bg-blue-500/10"
              icon={<CalendarOff className="h-4 w-4 text-blue-500" />}
              label="On Leave Now"
              value={leaveStats.onLeaveNow}
            />
            <StatCard
              color="bg-muted"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              label="Total Requests (YTD)"
              value={leaveStats.totalRequests}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Timesheets
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<Timer className="h-4 w-4 text-violet-500" />}
            iconColor="bg-violet-500/10"
            title="Timesheets"
            subtitle="Hours logged and pending approvals"
            href="/africs/hr/timesheets"
            extraActions={
              <Link href="/africs/hr/timesheets/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Timesheet</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-violet-500/10"
              icon={<Timer className="h-4 w-4 text-violet-500" />}
              label="Submitted This Week"
              value={timesheetStats.totalThisWeek}
            />
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Pending Approval"
              value={timesheetStats.pendingApprovals}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Approved This Week"
              value={timesheetStats.approvedThisWeek}
            />
            <StatCard
              color="bg-muted"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              label="Avg Weekly Hours"
              value={timesheetStats.avgWeeklyHours.toFixed(1)}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Overtime
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<AlarmClock className="h-4 w-4 text-orange-500" />}
            iconColor="bg-orange-500/10"
            title="Overtime"
            subtitle="Overtime requests and approved hours (this year)"
            href="/africs/hr/overtime"
            extraActions={
              <Link href="/africs/hr/overtime/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />Log Overtime</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Pending"
              value={overtimeStats.pending}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Approved (YTD)"
              value={overtimeStats.approved}
            />
            <StatCard
              color="bg-red-500/10"
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label="Rejected (YTD)"
              value={overtimeStats.rejected}
            />
            <StatCard
              color="bg-orange-500/10"
              icon={<AlarmClock className="h-4 w-4 text-orange-500" />}
              label="Total Hours Approved"
              value={`${overtimeStats.totalHoursApproved.toFixed(1)}h`}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Payroll Summary
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
            iconColor="bg-indigo-500/10"
            title="Payroll"
            subtitle="Latest run and total compensation paid"
            href="/africs/accounting/payroll"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              color="bg-indigo-500/10"
              icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
              label="Total Paid (All Time)"
              value={new Intl.NumberFormat("en-US", { style: "currency", currency: "GMD", maximumFractionDigits: 0 }).format(payrollStats.totalPaid)}
            />
            <StatCard
              color="bg-muted"
              icon={<Timer className="h-4 w-4 text-muted-foreground" />}
              label="Total Payroll Runs"
              value={payrollStats.totalRuns}
            />
            {payrollStats.latestRun ? (
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] text-muted-foreground mb-1">Latest Run</p>
                  <Link href={`/africs/accounting/payroll/${payrollStats.latestRun.id}`} className="hover:text-primary transition-colors">
                    <p className="text-sm font-semibold">{payrollStats.latestRun.periodLabel}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{payrollStats.latestRun.employeeCount} employees</span>
                    <span className="text-sm font-mono font-medium">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: payrollStats.latestRun.currency, maximumFractionDigits: 0 }).format(payrollStats.latestRun.totalNet)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{payrollStats.latestRun.status}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <p className="text-sm text-muted-foreground">No payroll runs yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* ============================================================
            SECTION: Recruitment
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<UserPlus className="h-4 w-4 text-sky-500" />}
            iconColor="bg-sky-500/10"
            title="Recruitment"
            subtitle="Open positions and applicant pipeline"
            href="/africs/hr/recruitment"
            extraActions={
              <Link href="/africs/hr/recruitment/postings/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Posting</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard color="bg-sky-500/10" icon={<Briefcase className="h-4 w-4 text-sky-500" />} label="Open Positions" value={recruitmentStats.openPositions} />
            <StatCard color="bg-primary/10" icon={<Users className="h-4 w-4 text-primary" />} label="Total Applications" value={recruitmentStats.totalApplications} />
            <StatCard color="bg-violet-500/10" icon={<TrendingUp className="h-4 w-4 text-violet-500" />} label="Interviewing" value={recruitmentStats.byStage.interview ?? 0} />
            <StatCard color="bg-emerald-500/10" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Hired" value={recruitmentStats.byStage.hired ?? 0} />
          </div>
        </section>

        {/* ============================================================
            SECTION: Talent Pool
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<UsersRound className="h-4 w-4 text-teal-500" />}
            iconColor="bg-teal-500/10"
            title="Talent Pool"
            subtitle="Candidate database and expressions of interest"
            href="/africs/hr/talent-pool"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard color="bg-teal-500/10" icon={<UsersRound className="h-4 w-4 text-teal-500" />} label="Total Candidates" value={talentPoolStats.total} />
            <StatCard color="bg-blue-500/10" icon={<Plus className="h-4 w-4 text-blue-500" />} label="New" value={talentPoolStats.new} />
            <StatCard color="bg-emerald-500/10" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Shortlisted" value={talentPoolStats.shortlisted} />
            <StatCard color="bg-amber-500/10" icon={<Clock className="h-4 w-4 text-amber-500" />} label="Reviewed" value={talentPoolStats.reviewed} />
          </div>
        </section>

        {/* ============================================================
            SECTION: Referrals
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<UserRoundPlus className="h-4 w-4 text-pink-500" />}
            iconColor="bg-pink-500/10"
            title="Referrals"
            subtitle="Employee referral program"
            href="/africs/hr/referrals"
            extraActions={
              <Link href="/africs/hr/referrals/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Referral</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard color="bg-pink-500/10" icon={<UserRoundPlus className="h-4 w-4 text-pink-500" />} label="Total Referrals" value={referralStats.total} />
            <StatCard color="bg-amber-500/10" icon={<Clock className="h-4 w-4 text-amber-500" />} label="Pending Review" value={referralStats.submitted} />
            <StatCard color="bg-violet-500/10" icon={<TrendingUp className="h-4 w-4 text-violet-500" />} label="Interviewing" value={referralStats.interviewing ?? 0} />
            <StatCard color="bg-emerald-500/10" icon={<Trophy className="h-4 w-4 text-emerald-500" />} label="Hired" value={referralStats.hired} />
          </div>
        </section>

        {/* ============================================================
            SECTION: Appraisals
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<Award className="h-4 w-4 text-yellow-500" />}
            iconColor="bg-yellow-500/10"
            title="Appraisals"
            subtitle="Performance review cycles"
            href="/africs/hr/appraisals"
            extraActions={
              <Link href="/africs/hr/appraisals/cycles/new">
                <Button size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />New Cycle</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard color="bg-yellow-500/10" icon={<Award className="h-4 w-4 text-yellow-500" />} label="Active Cycles" value={appraisalStats.activeCycles} />
            <StatCard color="bg-primary/10" icon={<Users className="h-4 w-4 text-primary" />} label="Total Appraisals" value={appraisalStats.totalAppraisals} />
            <StatCard color="bg-amber-500/10" icon={<Clock className="h-4 w-4 text-amber-500" />} label="Pending" value={appraisalStats.pending} />
            <StatCard color="bg-emerald-500/10" icon={<Star className="h-4 w-4 text-emerald-500" />} label="Avg Rating" value={appraisalStats.avgRating > 0 ? `${appraisalStats.avgRating.toFixed(1)}/5` : "—"} />
          </div>
        </section>

      </div>
    </div>
  );
}
