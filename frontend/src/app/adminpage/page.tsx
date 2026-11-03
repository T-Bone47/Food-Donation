"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import AppShell from "@/components/shell/AppShell";
import { ListSkeleton, PageHeader } from "@/components/ui/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DonationsPanel from "@/components/admin/DonationsPanel";
import ActivityPanel from "@/components/admin/ActivityPanel";
import OverviewPanel from "@/components/admin/OverviewPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import VerificationsPanel from "@/components/admin/VerificationsPanel";

export default function AdminPage() {
  return (
    <AppShell roles={["Admin"]}>
      <Suspense fallback={<ListSkeleton count={3} />}>
        <Console />
      </Suspense>
    </AppShell>
  );
}

function Console() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    function readTabFromUrl() {
      const urlTab = searchParams.get("tab");
      const validTabs = ["overview", "donations", "verifications", "users", "activity"];
      if (urlTab && validTabs.includes(urlTab)) {
        setTab(urlTab);
      } else if (!urlTab) {
        setTab("overview");
      }
    }
    readTabFromUrl();
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = newTab === "overview" ? "/adminpage" : `/adminpage?tab=${newTab}`;
      window.history.pushState(null, "", url);
    }
  };

  // On narrow screens the tab strip scrolls sideways: keep the selected tab visible (e.g. after "Review now").
  useEffect(() => {
    document.querySelector('[role="tab"][data-state="active"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  return (
    <>
      <PageHeader title="Admin console" description="Platform activity, every donation, NGO verification requests, user accounts and the admin action log." />
      <Tabs value={tab} onValueChange={handleTabChange} className="gap-6">
        <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="h-11 px-3">
            Overview
          </TabsTrigger>
          <TabsTrigger value="donations" className="h-11 px-3">
            Donations
          </TabsTrigger>
          <TabsTrigger value="verifications" className="h-11 px-3">
            Verifications
          </TabsTrigger>
          <TabsTrigger value="users" className="h-11 px-3">
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="h-11 px-3">
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewPanel onOpenVerifications={() => setTab("verifications")} />
        </TabsContent>
        <TabsContent value="donations">
          <DonationsPanel />
        </TabsContent>
        <TabsContent value="verifications">
          <VerificationsPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}
