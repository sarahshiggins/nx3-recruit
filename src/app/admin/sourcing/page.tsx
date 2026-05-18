"use client";

import { useState } from "react";
import GitHubSearch from "./GitHubSearch";
import SourcedPipeline from "./SourcedPipeline";

export default function SourcingPage() {
  const [pipelineRefreshKey, setPipelineRefreshKey] = useState(0);

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Sourcing</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Find developers on GitHub and build an outbound pipeline.
        </p>
      </div>

      <GitHubSearch onAdded={() => setPipelineRefreshKey((k) => k + 1)} />
      <div className="h-12" />
      <SourcedPipeline refreshKey={pipelineRefreshKey} />
    </div>
  );
}
