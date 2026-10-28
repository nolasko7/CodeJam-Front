import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "6d93a005ece548efa7de48c051ace6fb",
  worker: {
    name: "codejam-front",
    compatibilityDate: "2026-10-28",
    observability: {
      enabled: true,
      headSamplingRate: 0.1,
      logs: { enabled: true, headSamplingRate: 0.1 },
      traces: { enabled: true, headSamplingRate: 0.1 },
    },
  },
});
