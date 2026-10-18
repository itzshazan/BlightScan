"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Drawer } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";
import { deleteMessage, updateMessage, useDB } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [subject, setSubject] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const rows = useMemo(() => {
    if (!db) return [];
    return db.contact_messages
      .filter((m) => `${m.name} ${m.email} ${m.subject}`.toLowerCase().includes(q.toLowerCase()))
      .filter((m) => status === "all" || (status === "unread" ? !m.is_read : m.is_read))
      .filter((m) => subject === "all" || m.subject === subject)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [db, q, status, subject]);

  if (!db) return <Skeleton className="h-96 rounded-card" />;
  const open = db.contact_messages.find((m) => m.id === openId);

  return (
    <>
      <PageHeader title="Contact messages" description="Questions, feedback, and bug reports from the contact form." />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search sender or subject" placeholder="Search sender or subject" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </Select>
        <Select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="all">All subjects</option>
          {["General", "Bug report", "Feedback", "Collaboration"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead className="border-b border-line/10 text-sm text-muted">
            <tr>
              {["Sender", "Email", "Subject", "Received", "Status", ""].map((h) => (
                <th key={h} className="p-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/10">
            {rows.map((m) => (
              <tr key={m.id} className={cn("hover:bg-ink/[0.02]", !m.is_read && "font-medium")}>
                <td className="p-4">{m.name}</td>
                <td className="p-4 text-muted">{m.email}</td>
                <td className="p-4">{m.subject}</td>
                <td className="p-4 text-muted">{formatDateTime(m.created_at)}</td>
                <td className="p-4">
                  <Badge dot tone={m.is_read ? "bg-ink/5 text-muted" : "bg-accent-soft text-accent"}>{m.is_read ? "Read" : "Unread"}</Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => setOpenId(m.id)}>
                    Open
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted">
                  No messages.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        title="Message"
        footer={
          open && (
            <>
              <Button variant="danger-outline" onClick={() => setConfirmDel(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              {!open.is_read && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await updateMessage(open.id, { is_read: true });
                    toast.success("Marked as read");
                  }}
                >
                  <MailOpen className="h-4 w-4" /> Mark as Read
                </Button>
              )}
              <Button href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} external variant="accent">
                <Reply className="h-4 w-4" /> Reply
              </Button>
            </>
          )
        }
      >
        {open && (
          <dl className="space-y-5 text-[15px]">
            <div>
              <dt className="text-sm text-muted">From</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-muted" /> {open.name} &lt;{open.email}&gt;
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Subject</dt>
              <dd className="mt-1 font-medium">{open.subject}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Received</dt>
              <dd className="mt-1">{formatDateTime(open.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Message</dt>
              <dd className="mt-2 whitespace-pre-wrap rounded-2xl bg-sunken p-4 leading-relaxed">{open.message}</dd>
            </div>
          </dl>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Delete this message?"
        description="It will be permanently removed."
        onConfirm={async () => {
          if (!open) return;
          await deleteMessage(open.id);
          toast.success("Message deleted");
          setOpenId(null);
        }}
      />
    </>
  );
}
