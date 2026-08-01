import { OperationalHeader } from "@/components/dashboard/OperationalHeader";
import { WorkshopFlow } from "@/components/dashboard/WorkshopFlow";
import { CriticalWagons } from "@/components/dashboard/CriticalWagons";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { EmployeeStatus } from "@/components/dashboard/EmployeeStatus";

export default function Dashboard() {

  // Removed all unused metrics logic as they are now encapsulated inside their specific widgets.

  return (
    <div className="flex flex-col gap-[var(--density-spacing-md,1rem)] animate-fade-in pb-12 h-[calc(100vh-4rem)]">
      {/* 1. Operational Header (Context & Time) */}
      <div className="flex-none">
        <OperationalHeader />
      </div>

      {/* 2. Workshop Flow Visualization (Top View) */}
      <div className="flex-none">
        <WorkshopFlow />
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--density-spacing-md,1rem)]">
        
        {/* Left Column: Critical Action Panels */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-[var(--density-spacing-md,1rem)] h-full overflow-hidden">
          {/* Top Half: Critical Wagons */}
          <div className="flex-1 min-h-[300px]">
            <CriticalWagons />
          </div>
          {/* Bottom Half: Employee Status */}
          <div className="flex-1 min-h-[300px]">
            <EmployeeStatus />
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-1 h-full min-h-[600px] lg:min-h-0">
          <LiveActivityFeed />
        </div>

      </div>
    </div>
  );
}
