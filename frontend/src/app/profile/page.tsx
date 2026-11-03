"use client";

import { useState, type FormEvent } from "react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ErrorState, InlineAlert, PageHeader, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/lib/api-client";
import { errorMessages, getApiError, type ApiError } from "@/lib/api-envelope";
import { validateProfile, type Errors, type ProfileValues } from "@/lib/auth-form";
import { formatDate } from "@/lib/format";
import { USER_CHANGED_EVENT } from "@/lib/session";
import { useResource } from "@/lib/use-resource";
import type { ProfileUser } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}

const toValues = (u: ProfileUser): ProfileValues => ({
  name: u.name ?? "",
  organization: u.organization ?? "",
  phonenumber: u.phonenumber ?? "",
  area: u.area ?? "",
  pincode: u.pincode ?? "",
  state: u.state ?? "",
  country: u.country ?? "",
});

function Profile() {
  const me = useResource(async () => (await authApi.getMe()).data.user, "auth:me");
  const [editing, setEditing] = useState(false);

  if (me.loading && !me.data) {
    return (
      <>
        <PageHeader title="Your profile" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }
  if (me.error && !me.data) {
    return (
      <>
        <PageHeader title="Your profile" />
        <ErrorState error={me.error} onRetry={() => me.reload()} title="We couldn't load your profile" />
      </>
    );
  }
  const u = me.data;
  if (!u) return null;

  return (
    <>
      <PageHeader
        title="Your profile"
        description="How you appear to the people you work with."
        actions={!editing ? <Button onClick={() => setEditing(true)}>Edit profile</Button> : undefined}
      />
      {editing ? (
        <ProfileForm
          user={u}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await me.reload(true);
          }}
        />
      ) : (
        <section aria-labelledby="account" className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
          <h2 id="account" className="sr-only">
            Account details
          </h2>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {(
              [
                ["Name", u.name],
                ["Email", u.email],
                ["Role", u.role],
                ["Account status", u.accountStatus ? u.accountStatus.charAt(0).toUpperCase() + u.accountStatus.slice(1) : "—"],
                ["Organisation", u.organization || "—"],
                ["Phone", u.phonenumber || "—"],
                ["Location", [u.area, u.state, u.pincode, u.country].filter(Boolean).join(", ") || "—"],
                ["Member since", formatDate(u.createdAt)],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 break-words text-ink-soft">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}

function ProfileForm({ user, onCancel, onSaved }: { user: ProfileUser; onCancel: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [values, setValues] = useState<ProfileValues>(() => toValues(user));
  const [errors, setErrors] = useState<Errors<keyof ProfileValues>>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProfileValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const fieldError = (field: keyof ProfileValues) => errors[field] ?? serverError?.fieldErrors[field] ?? null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const found = validateProfile(values);
    setErrors(found);
    setServerError(null);
    const first = (Object.keys(found) as (keyof ProfileValues)[])[0];
    if (first) {
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setSaving(true);
    try {
      // Only the editable fields: never the id, role, email or account status the old form echoed back.
      const res = await authApi.updateMe({
        name: values.name.trim(),
        organization: values.organization.trim(),
        phonenumber: values.phonenumber.trim(),
        area: values.area.trim(),
        pincode: values.pincode.trim(),
        state: values.state.trim(),
        country: values.country.trim(),
      });
      // Keep the session's copy in step (the nav shows the name) without replacing it with a differently-shaped object.
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const { name, organization, phonenumber } = res.data.user;
        localStorage.setItem("user", JSON.stringify({ ...stored, name, organization, phonenumber }));
        window.dispatchEvent(new Event(USER_CHANGED_EVENT));
      } catch {
        // The saved profile is the source of truth; a stale nav label is not worth failing the save.
      }
      toast.show("Profile updated.");
      await onSaved();
    } catch (err) {
      setServerError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-card sm:p-6">
      {serverError ? (
        <InlineAlert tone="error" title="We couldn't save your profile" focusOnMount>
          {errorMessages(serverError).map((m) => (
            <p key={m}>{m}</p>
          ))}
        </InlineAlert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={fieldError("name")}>
          {(c) => <Input {...c} name="name" autoComplete="name" value={values.name} onChange={set("name")} />}
        </Field>
        <Field label="Organisation" error={fieldError("organization")}>
          {(c) => <Input {...c} name="organization" autoComplete="organization" value={values.organization} onChange={set("organization")} />}
        </Field>
        <Field label="Email" hint="Your email is your sign-in and can't be changed here.">
          {(c) => <Input {...c} value={user.email} readOnly disabled />}
        </Field>
        <Field label="Phone" error={fieldError("phonenumber")}>
          {(c) => <Input {...c} name="phonenumber" type="tel" autoComplete="tel" value={values.phonenumber} onChange={set("phonenumber")} />}
        </Field>
        <Field label="Pincode" error={fieldError("pincode")} hint="Volunteers see donations that match your pincode, area or state.">
          {(c) => <Input {...c} name="pincode" inputMode="numeric" autoComplete="postal-code" value={values.pincode} onChange={set("pincode")} />}
        </Field>
        <Field label="Area" error={fieldError("area")}>
          {(c) => <Input {...c} name="area" autoComplete="address-level2" value={values.area} onChange={set("area")} />}
        </Field>
        <Field label="State" error={fieldError("state")}>
          {(c) => <Input {...c} name="state" autoComplete="address-level1" value={values.state} onChange={set("state")} />}
        </Field>
        <Field label="Country" error={fieldError("country")}>
          {(c) => <Input {...c} name="country" autoComplete="country-name" value={values.country} onChange={set("country")} />}
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
