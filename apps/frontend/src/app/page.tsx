import type { HealthStatus } from "@vastra/shared";
import { Activity, Database, Server } from "lucide-react";
import { ErrorState } from "@/components/states/ErrorState";

export const dynamic = "force-dynamic";

async function getHealth(): Promise<HealthStatus> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiBaseUrl}/health`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthStatus>;
}

export default async function HomePage() {
  try {
    const health = await getHealth();

    return (
      <section className="mx-auto flex min-h-[calc(100vh-144px)] w-full max-w-6xl flex-col justify-center px-5 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Phase 1 Foundation
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            The Vastra House
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Frontend and backend are connected through the versioned API foundation.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StatusCard
            icon={<Server aria-hidden="true" size={22} />}
            label="API Service"
            value={health.service}
          />
          <StatusCard
            icon={<Activity aria-hidden="true" size={22} />}
            label="API Status"
            value={health.status}
          />
          <StatusCard
            icon={<Database aria-hidden="true" size={22} />}
            label="Database"
            value={health.database}
          />
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-5">
        <ErrorState
          title="Backend health check failed"
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </section>
    );
  }
}

function StatusCard({
  icon,
  label,
  value,
}: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-4 text-xl font-semibold capitalize">{value}</p>
    </div>
  );
}
