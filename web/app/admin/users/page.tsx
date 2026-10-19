"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/field";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { updateUser, useDB } from "@/lib/store";
import type { AppUser, UserRole } from "@/lib/types";

const PER_PAGE = 10;
const roleTone = { farmer: "bg-ink/5 text-ink", expert: "bg-info-soft text-info", admin: "bg-accent-soft text-accent" };

export default function UsersPage() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AppUser | null>(null);

  const rows = useMemo(() => (db ? db.users.filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) : []), [db, q]);
  if (!db) return <Skeleton className="h-96 rounded-card" />;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // PATCH /api/admin/users/[id]
  const setRole = async (u: AppUser, role: UserRole) => {
    await updateUser(u.id, { role });
    toast.success(`${u.full_name} is now ${role}`);
  };

  return (
    <>
      <PageHeader title="User management" description="Search accounts and manage access." />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          aria-label="Search by name or email"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>
      <div className="card overflow-x-auto">
        {/* Fixed layout so columns keep the same widths whatever the content; long names/emails truncate */}
        <table className="w-full min-w-[760px] table-fixed text-left text-[15px]">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[28%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-16" />
          </colgroup>
          <thead className="border-b border-line/10 text-sm text-muted">
            <tr>
              {[
                ["Name", ""],
                ["Email", ""],
                ["Role", ""],
                ["Scans", "text-center"],
                ["Joined", ""],
                ["Status", ""],
                ["", ""],
              ].map(([h, align], i) => (
                <th key={i} className={`p-4 font-medium ${align}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/10">
            {pageRows.map((u) => (
              <tr key={u.id}>
                <td className="p-4">
                  <span className="flex min-w-0 items-center gap-3 font-medium">
                    <Avatar name={u.full_name} className="h-9 w-9 shrink-0 text-xs" />
                    <span className="truncate" title={u.full_name}>
                      {u.full_name}
                    </span>
                  </span>
                </td>
                <td className="truncate p-4 text-muted" title={u.email}>
                  {u.email}
                </td>
                <td className="p-4">
                  <Badge tone={roleTone[u.role]} className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="p-4 text-center tabular-nums">{u.id === db.profile.id && !db.staff ? db.scans.length : u.scans}</td>
                <td className="whitespace-nowrap p-4 text-muted">{formatDate(u.created_at)}</td>
                <td className="p-4">
                  <Badge dot tone={u.status === "active" ? "bg-healthy-soft text-healthy" : "bg-ink/5 text-muted"} className="capitalize">
                    {u.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Menu>
                    <MenuTrigger className="ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5" aria-label={`Actions for ${u.full_name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuLabel>Change role</MenuLabel>
                      {(["farmer", "expert", "admin"] as const).map((r) => (
                        <MenuItem key={r} disabled={u.role === r} onSelect={() => setRole(u, r)} className="capitalize data-[disabled]:opacity-40">
                          <ShieldCheck className="h-4 w-4" /> {r}
                          {u.role === r && <span className="ml-auto text-xs text-muted">current</span>}
                        </MenuItem>
                      ))}
                      <MenuSeparator />
                      {u.status === "active" ? (
                        <MenuItem danger onSelect={() => setTarget(u)}>
                          <UserX className="h-4 w-4" /> Deactivate
                        </MenuItem>
                      ) : (
                        <MenuItem
                          onSelect={async () => {
                            await updateUser(u.id, { status: "active" });
                            toast.success(`${u.full_name} reactivated`);
                          }}
                        >
                          <UserCheck className="h-4 w-4" /> Reactivate
                        </MenuItem>
                      )}
                    </MenuContent>
                  </Menu>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted">
                  No users match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-muted">
          Page {page} of {pages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Deactivate ${target?.full_name}?`}
        description="They won't be able to log in until reactivated. Their data is kept."
        confirmLabel="Deactivate"
        onConfirm={async () => {
          if (!target) return;
          await updateUser(target.id, { status: "deactivated" });
          toast.success(`${target.full_name} deactivated`);
          setTarget(null);
        }}
      />
    </>
  );
}
