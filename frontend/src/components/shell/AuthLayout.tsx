import Link from "next/link";
import type { ReactNode } from "react";
import { Soup } from "lucide-react";

// The real lifecycle in plain words (AVAILABLE → ASSIGNED/PICKED_UP → DELIVERED → COMPLETED). No figures, no claims.
const STEPS = [
  "A donor lists surplus food with a pickup window.",
  "A volunteer claims it and collects it.",
  "They deliver it to a verified NGO.",
  "The NGO confirms receipt, and the donation is complete.",
];

/** Two-panel frame for sign-in and sign-up: the mission on the left (top band on phones), the form on the right. */
export default function AuthLayout({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside aria-label="About FoodShare" className="bg-primary px-5 py-5 text-primary-foreground sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <Link href="/" className="flex min-h-11 w-fit items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-md bg-primary-foreground text-primary">
            <Soup aria-hidden className="size-5" />
          </span>
          FoodShare
        </Link>
        <div className="mt-4 max-w-md lg:mt-0">
          <p className="font-display text-heading font-semibold tracking-tight text-balance lg:text-display">
            Surplus food, on its way to the people who need it.
          </p>
          <ol className="mt-8 hidden flex-col gap-4 lg:flex">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-primary-soft">
                <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-primary-soft text-sm font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="hidden text-meta text-primary-soft lg:block">Every handover is confirmed by the receiving NGO before it counts as complete.</p>
      </aside>
      <main id="main-content" className="flex items-start px-4 py-8 sm:px-8 lg:items-center lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <h1 className="break-words font-display text-title font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-2 text-ink-soft">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
