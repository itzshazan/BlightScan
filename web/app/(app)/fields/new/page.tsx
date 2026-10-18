"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { FieldForm } from "@/components/app/field-form";
import { Crumbs, PageHeader } from "@/components/ui/misc";
import { createField } from "@/lib/store";
import { safeRedirect } from "@/lib/utils";

function NewField() {
  const router = useRouter();
  const params = useSearchParams();
  const back = safeRedirect(params.get("return"), "/fields");
  return (
    <>
      <PageHeader crumbs={<Crumbs items={[{ label: "My Fields", href: "/fields" }, { label: "Add a field" }]} />} title="Add a field" description="Save your tomato plot to enable field-level forecasts." />
      <div className="max-w-3xl">
        <FieldForm
          onCancel={() => router.push("/fields")}
          onSubmit={async (data) => {
            const f = await createField(data);
            toast.success(`${f.name} added`);
            router.push(back === "/scan" ? `/scan?field=${f.id}` : back);
          }}
        />
      </div>
    </>
  );
}

export default function NewFieldPage() {
  return (
    <Suspense>
      <NewField />
    </Suspense>
  );
}
