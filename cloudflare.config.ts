import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "9983b00182c2b1f7101394e060af1f0e",
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
