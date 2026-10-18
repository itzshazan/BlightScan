"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Profile } from "@/lib/types";
import { toast } from "sonner";
import { TriangleAlert, Upload } from "lucide-react";
import { Avatar } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { FormField, Input, PasswordInput, Select, Switch } from "@/components/ui/field";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { LineTabsList, LineTabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { compressImage } from "@/lib/predict";
import { deleteAccount, updateProfile, useDB } from "@/lib/store";

const STATES = ["Andhra Pradesh", "Bihar", "Gujarat", "Haryana", "Himachal Pradesh", "Karnataka", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];

function ProfileTab({ profile }: { profile: Profile }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [v, setV] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));

  return (
    <form
      noValidate
      className="max-w-2xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!v.full_name?.trim()) errs.full_name = "Enter your name.";
        if (v.phone && !/^[+\d][\d\s-]{7,14}$/.test(v.phone)) errs.phone = "Enter a valid phone number.";
        setErr(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        await updateProfile({ full_name: v.full_name.trim(), phone: v.phone, state: v.state, district: v.district, language: v.language, avatar_url: v.avatar_url });
        setBusy(false);
        toast.success("Profile saved");
      }}
    >
      <div className="flex items-center gap-5">
        <Avatar name={v.full_name} src={v.avatar_url} className="h-20 w-20 text-2xl" />
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload Avatar
          </Button>
          {v.avatar_url && (
            <button type="button" className="ml-3 text-sm text-muted hover:underline" onClick={() => setV((x) => ({ ...x, avatar_url: null }))}>
              Remove
            </button>
          )}
          <p className="mt-2 text-sm text-muted">JPG or PNG, square works best.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload avatar"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5 * 1048576) return toast.error("Avatar must be under 5 MB");
              const url = await compressImage(f, 256, 0.85); // avatars/{user_id}/avatar.jpg
              setV((x) => ({ ...x, avatar_url: url }));
            }}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="full_name" error={err.full_name} className="sm:col-span-2">
          <Input id="full_name" value={v.full_name ?? ""} onChange={set("full_name")} invalid={!!err.full_name} />
        </FormField>
        <FormField label="Phone" optional htmlFor="phone" error={err.phone}>
          <Input id="phone" type="tel" placeholder="+91 98765 43210" value={v.phone ?? ""} onChange={set("phone")} invalid={!!err.phone} />
        </FormField>
        <FormField label="Preferred language" htmlFor="language">
          <Select id="language" value={v.language ?? "en"} onChange={set("language")}>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </Select>
        </FormField>
        <FormField label="State" htmlFor="state">
          <Select id="state" value={v.state ?? ""} onChange={set("state")}>
            <option value="">Select state</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="District" htmlFor="district">
          <Input id="district" value={v.district ?? ""} onChange={set("district")} />
        </FormField>
      </div>
      <Button type="submit" variant="accent" loading={busy}>
        Save Changes
      </Button>
    </form>
  );
}

function AccountTab({ profile }: { profile: Profile }) {
  const { updatePassword } = useAuth();
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="max-w-xl space-y-8">
      <FormField label="Email" htmlFor="email" hint="Contact us to change your email address.">
        <Input id="email" value={profile.email} readOnly disabled />
      </FormField>
      <form
        noValidate
        className="space-y-5 border-t border-line/10 pt-8"
        onSubmit={async (e) => {
          e.preventDefault();
          const errs: Record<string, string> = {};
          if (!v.current) errs.current = "Enter your current password.";
          if (v.next.length < 8) errs.next = "Use at least 8 characters.";
          if (v.confirm !== v.next) errs.confirm = "Passwords don't match.";
          setErr(errs);
          if (Object.keys(errs).length) return;
          setBusy(true);
          try {
            await updatePassword(v.next, v.current);
            setV({ current: "", next: "", confirm: "" });
            toast.success("Password changed");
          } catch (e) {
            if (e instanceof Error && /current password/i.test(e.message)) setErr({ current: e.message });
            else toast.error(e instanceof Error ? e.message : "Couldn't change your password");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-lg font-medium">Change password</h2>
        <FormField label="Current password" htmlFor="cur" error={err.current}>
          <PasswordInput id="cur" autoComplete="current-password" value={v.current} onChange={set("current")} invalid={!!err.current} />
        </FormField>
        <FormField label="New password" htmlFor="new" error={err.next}>
          <PasswordInput id="new" autoComplete="new-password" value={v.next} onChange={set("next")} invalid={!!err.next} />
        </FormField>
        <FormField label="Confirm new password" htmlFor="conf" error={err.confirm}>
          <PasswordInput id="conf" autoComplete="new-password" value={v.confirm} onChange={set("confirm")} invalid={!!err.confirm} />
        </FormField>
        <Button type="submit" loading={busy}>
          Change Password
        </Button>
      </form>
    </div>
  );
}

function NotificationsTab({ profile }: { profile: Profile }) {
  const [email, setEmail] = useState(profile.notify_email);
  const [weekly, setWeekly] = useState(profile.notify_weekly);
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-xl">
      <div className="divide-y divide-line/10">
        <Switch checked={email} onChange={setEmail} label="Email me on high-risk alerts" description="When a field's forecast reaches high risk." />
        <Switch checked={weekly} onChange={setWeekly} label="Weekly summary" description="Every Monday: scans, results and risk across your fields." />
      </div>
      <Button
        className="mt-6"
        variant="accent"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          await updateProfile({ notify_email: email, notify_weekly: weekly });
          setBusy(false);
          toast.success("Preferences saved");
        }}
      >
        Save Preferences
      </Button>
    </div>
  );
}

function DangerTab() {
  const router = useRouter();
  const { logout } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-xl rounded-card border border-late/30 bg-late-soft/40 p-6">
      <div className="flex gap-3">
        <TriangleAlert className="h-5 w-5 shrink-0 text-late" />
        <div>
          <h2 className="font-semibold text-late">Delete account</h2>
          <p className="mt-1 text-[15px] text-ink/80">This permanently deletes your profile, fields, scans and photos. It cannot be undone.</p>
        </div>
      </div>
      <FormField label="Type DELETE to confirm" htmlFor="confirm-delete" className="mt-6">
        <Input id="confirm-delete" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </FormField>
      <div className="mt-5 flex gap-2">
        <Button
          variant="danger"
          disabled={text !== "DELETE"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await deleteAccount(); // POST /api/account/delete: photos, then the auth user (data cascades)
              await logout();
              toast.success("Your account has been deleted");
              router.push("/");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't delete your account");
              setBusy(false);
            }
          }}
        >
          Delete Account
        </Button>
        <Button variant="ghost" onClick={() => setText("")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const db = useDB();
  const [tab, setTab] = useState("profile");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (["profile", "account", "notifications", "danger"].includes(h)) setTab(h);
  }, []);
  if (!db) return <Skeleton className="h-96 rounded-card" />;
  return (
    <>
      <PageHeader title="Profile & Settings" description="Manage your details, security, and preferences." />
      <Tabs
        value={tab}
        onValueChange={(t) => {
          setTab(t);
          history.replaceState(null, "", `#${t}`);
        }}
      >
        <LineTabsList>
          <LineTabsTrigger value="profile">Profile</LineTabsTrigger>
          <LineTabsTrigger value="account">Account</LineTabsTrigger>
          <LineTabsTrigger value="notifications">Notifications</LineTabsTrigger>
          <LineTabsTrigger value="danger">Danger Zone</LineTabsTrigger>
        </LineTabsList>
        <div className="pt-8">
          <TabsContent value="profile">
            <ProfileTab profile={db.profile} />
          </TabsContent>
          <TabsContent value="account">
            <AccountTab profile={db.profile} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab profile={db.profile} />
          </TabsContent>
          <TabsContent value="danger">
            <DangerTab />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
