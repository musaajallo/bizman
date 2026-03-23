"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Download, FileOutput } from "lucide-react";

// Placeholder data
const profiles = [
  { id: "1", name: "John Smith", position: "Software Engineer", department: "Engineering", status: "submitted" as const, dateJoined: "2024-01-15" },
  { id: "2", name: "Sarah Johnson", position: "Product Manager", department: "Product", status: "reviewed" as const, dateJoined: "2024-02-20" },
  { id: "3", name: "Michael Chen", position: "Designer", department: "Design", status: "filed" as const, dateJoined: "2024-03-10" },
  { id: "4", name: "Emily Davis", position: "HR Specialist", department: "Human Resources", status: "submitted" as const, dateJoined: "2024-04-05" },
  { id: "5", name: "James Wilson", position: "Data Analyst", department: "Engineering", status: "reviewed" as const, dateJoined: "2024-05-12" },
];

const statusStyles = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  filed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function HRPage() {
  return (
    <div>
      <TopBar
        title="HR & Staff Profiles"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Profile
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID, or email..." className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profiles Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id} className="cursor-pointer">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {profile.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile.position}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile.department}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[profile.status]}>
                        {profile.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {profile.dateJoined}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <FileOutput className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
