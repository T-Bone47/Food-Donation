"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronRight,
  RotateCcw,
  X,
  CheckCircle2,
  Soup,
  Truck,
  Building,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoApi } from "@/lib/api-client";
import { USER_CHANGED_EVENT } from "@/lib/session";

interface Step {
  step: number;
  title: string;
  role: "donor" | "volunteer" | "ngo" | "admin";
  targetRoute: string;
  objective: string;
  presentationNote: string;
}

const PRESENTATION_STEPS: Step[] = [
  {
    step: 1,
    title: "Introduce Platform Architecture",
    role: "donor",
    targetRoute: "/donordash",
    objective: "Explain the four-role ecosystem connecting Donors, Volunteers, NGOs, and Admins to eradicate food waste.",
    presentationNote: "Highlight that all actions are tracked through a deterministic state machine.",
  },
  {
    step: 2,
    title: "Conceptual Donor Onboarding",
    role: "donor",
    targetRoute: "/donordash",
    objective: "Walk through food donor verification, pickup address mapping, and organization details.",
    presentationNote: "Demonstrate that donor accounts can be corporate kitchens, banquet halls, or individuals.",
  },
  {
    step: 3,
    title: "Create Surplus Food Listing",
    role: "donor",
    targetRoute: "/donate",
    objective: "Fill out food category, quantity, food prep instant, and pickup expiration deadlines.",
    presentationNote: "Explain timezone-aware expiry sweeping and immediate notification dispatch.",
  },
  {
    step: 4,
    title: "Switch to Volunteer View",
    role: "volunteer",
    targetRoute: "/volunteerdash",
    objective: "Show nearby surplus listings available for food rescue in real-time.",
    presentationNote: "Point out distance filtering and food safety packaging requirements.",
  },
  {
    step: 5,
    title: "Claim & Record Pickup",
    role: "volunteer",
    targetRoute: "/volunteer/tasks",
    objective: "Atomically claim the available donation and log the physical pickup.",
    presentationNote: "Emphasize atomic row locking preventing race conditions between multiple volunteers.",
  },
  {
    step: 6,
    title: "Transport & Complete Delivery",
    role: "volunteer",
    targetRoute: "/volunteer/tasks",
    objective: "Drive to Hope Shelter Foundation and mark the donation as DELIVERED.",
    presentationNote: "Lifecycle transitions to DELIVERED; receiving NGO gets immediate intake alert.",
  },
  {
    step: 7,
    title: "Switch to NGO View",
    role: "ngo",
    targetRoute: "/ngodash",
    objective: "Inspect incoming delivery queue and review food quality/temperature.",
    presentationNote: "Demonstrate that unapproved NGOs cannot confirm receipt.",
  },
  {
    step: 8,
    title: "Confirm Receipt & Digital Handover",
    role: "ngo",
    targetRoute: "/ngodash",
    objective: "Click 'Confirm Receipt' to complete donation and update impact statistics.",
    presentationNote: "Lifecycle reaches terminal status COMPLETED. Donor and volunteer receive confirmation notifications.",
  },
  {
    step: 9,
    title: "Switch to Admin Console",
    role: "admin",
    targetRoute: "/adminpage",
    objective: "Inspect live platform metrics, aggregate impact (meals served), and audit logs.",
    presentationNote: "Metrics are dynamically calculated from the isolated demo records.",
  },
  {
    step: 10,
    title: "Show Audit Trail & Lifecycle Completion",
    role: "admin",
    targetRoute: "/adminpage",
    objective: "Review complete audit history proving non-repudiation across all four roles.",
    presentationNote: "Conclude presentation: zero food waste, verified handover, complete auditability.",
  },
];

interface GuidedDemoAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuidedDemoAssistant({
  isOpen,
  onClose,
}: GuidedDemoAssistantProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStep = PRESENTATION_STEPS[currentStepIndex];

  async function handleSwitchToStep(step: Step) {
    setIsSwitching(true);
    setResetMessage(null);
    try {
      const res = await demoApi.createSession(step.role);
      const { user, token, isDemo } = res.data;

      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify({ ...user, isDemo: isDemo ?? true }));
      window.dispatchEvent(new Event(USER_CHANGED_EVENT));

      router.push(step.targetRoute);
    } catch {
      // Keep on current page if error
    } finally {
      setIsSwitching(false);
    }
  }

  async function handleResetDemo() {
    if (!confirm("Are you sure you want to reset demo data back to the initial seed state?")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await demoApi.reset();
      setResetMessage(res.data?.message || "Demo data reset successfully.");
      setTimeout(() => setResetMessage(null), 4000);
      window.dispatchEvent(new Event(USER_CHANGED_EVENT));
      router.refresh();
    } catch {
      setResetMessage("Reset failed. Please retry.");
    } finally {
      setIsResetting(false);
    }
  }

  const roleIcons = {
    donor: Soup,
    volunteer: Truck,
    ngo: Building,
    admin: ShieldCheck,
  };
  const StepIcon = roleIcons[currentStep.role];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-demo-title"
      data-ui="drawer"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200" /* taste-skill-ignore */
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-primary/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 id="guided-demo-title" className="text-base font-bold text-foreground">
              Presentation Guide
            </h2>
            <p className="text-xs text-muted-foreground">
              Step {currentStep.step} of {PRESENTATION_STEPS.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {resetMessage ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary font-medium">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        ) : null}

        {/* Current Step Card */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary uppercase">
              Step {currentStep.step}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground capitalize">
              <StepIcon className="size-3.5 text-primary" />
              <span>{currentStep.role} Role</span>
            </div>
          </div>

          <h3 className="font-bold text-base text-foreground leading-snug">
            {currentStep.title}
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <strong>Objective:</strong> {currentStep.objective}
          </p>

          <div className="mt-3 rounded-lg border border-border bg-card p-3 text-xs text-ink-soft">
            <p className="font-semibold text-foreground mb-1">Presenter Script Note:</p>
            <p className="italic">{currentStep.presentationNote}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              size="sm"
              loading={isSwitching}
              className="flex-1 justify-center gap-2"
              onClick={() => handleSwitchToStep(currentStep)}
            >
              <span>Switch to {currentStep.role.toUpperCase()} View</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Between Steps */}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            {currentStepIndex + 1} / {PRESENTATION_STEPS.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentStepIndex === PRESENTATION_STEPS.length - 1}
            onClick={() => setCurrentStepIndex((i) => Math.min(PRESENTATION_STEPS.length - 1, i + 1))}
          >
            Next
          </Button>
        </div>

        {/* Complete Step List */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            All Presentation Stages
          </h4>
          <div data-ui="step-list" className="divide-y divide-border rounded-xl border border-border bg-card">
            {PRESENTATION_STEPS.map((s, idx) => {
              const active = idx === currentStepIndex;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex w-full items-center justify-between p-3 text-left transition-colors text-xs ${
                    active ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {s.step}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </div>
                  <span className="shrink-0 text-[11px] capitalize text-muted-foreground">
                    {s.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with Reset Button */}
      <div className="border-t border-border bg-muted/20 p-4"> {/* taste-skill-ignore */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={isResetting}
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleResetDemo}
        >
          <RotateCcw className="size-4 mr-2" />
          Reset Demo to Initial Seed Data
        </Button>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Restores all sample listings without affecting production databases.
        </p>
      </div>
    </div>
  );
}
