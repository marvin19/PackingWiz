"use client"

import { StoreProvider, useStore } from "@/lib/store"
import { BottomNav } from "@/components/bottom-nav"
import { HomeScreen } from "@/components/screens/home-screen"
import { CreateTripScreen } from "@/components/screens/create-trip-screen"
import { SummaryScreen } from "@/components/screens/summary-screen"
import { GeneratingScreen } from "@/components/screens/generating-screen"
import { PackingScreen } from "@/components/screens/packing-screen"
import { OverviewScreen } from "@/components/screens/overview-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"

function ScreenRouter() {
  const { screen } = useStore()

  switch (screen) {
    case "home":
      return <HomeScreen />
    case "create":
      return <CreateTripScreen />
    case "summary":
      return <SummaryScreen />
    case "generating":
      return <GeneratingScreen />
    case "packing":
      return <PackingScreen />
    case "overview":
      return <OverviewScreen />
    case "profile":
      return <ProfileScreen />
    default:
      return <HomeScreen />
  }
}

function ShellInner() {
  const { screen } = useStore()
  const showNav = screen === "home" || screen === "packing" || screen === "profile"

  return (
    <div className="flex min-h-[100dvh] w-full items-stretch justify-center bg-muted sm:items-center sm:py-8">
      <div className="relative flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-background shadow-sm sm:h-[900px] sm:max-h-[92dvh] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScreenRouter />
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <StoreProvider>
      <ShellInner />
    </StoreProvider>
  )
}
