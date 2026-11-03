"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";

import AuthLayout from "@/components/shell/AuthLayout";
import DemoRoleSelectorModal from "@/components/demo/DemoRoleSelectorModal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { InlineAlert } from "@/components/ui/states";
import { authApi } from "@/lib/api-client";
import { errorMessages, getApiError } from "@/lib/api-envelope";
import { validateLogin } from "@/lib/auth-form";
import { HOME_BY_ROLE, normalizeRole } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverMessages, setServerMessages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const set = (field: "email" | "password") => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const found = validateLogin(values);
    setErrors(found);
    setServerMessages(null);
    const first = (["email", "password"] as const).find((k) => found[k]);
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(values.email.trim(), values.password);
      const { user, token } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      const role = normalizeRole(user.role);
      router.push(role ? HOME_BY_ROLE[role] : "/");
    } catch (err) {
      setServerMessages(errorMessages(getApiError(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" description="Welcome back. Pick up where you left off.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {serverMessages ? (
          <InlineAlert tone="error" title="We couldn't sign you in" focusOnMount>
            {serverMessages.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </InlineAlert>
        ) : null}
        <Field label="Email" required error={errors.email}>
          {(c) => (
            <Input
              {...c}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={set("email")}
            />
          )}
        </Field>
        <Field label="Password" required error={errors.password}>
          {(c) => (
            <PasswordInput
              {...c}
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={set("password")}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <div data-ui="divider" className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" /> {/* taste-skill-ignore */}
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-semibold">
            Or Presentation Demo
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Explore Interactive Demo
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Experience the platform using preconfigured demonstration accounts. No registration required.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3.5 w-full border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setDemoModalOpen(true)}
        >
          Select Demo Role
        </Button>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        New to FoodShare?{" "}
        <Link href="/" className="font-semibold text-primary underline underline-offset-2">
          Create an account
        </Link>
      </p>

      <DemoRoleSelectorModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </AuthLayout>
  );
}
