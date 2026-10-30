import { defineConfig, triggers } from "cf/config";

export default defineConfig(({ mode }) => ({
  accountId: mode === "staging" ? "6d93a005ece548efa7de48c051ace6fb" : "9983b00182c2b1f7101394e060af1f0e",
  worker: {
    name: mode === "staging" ? "codejam-front-push-test" : "codejam-front",
    compatibilityDate: "2026-10-28",
    domains: mode === "staging" ? [] : ["codejam.citax.com.ar"],
    // The zone's `*.citax.com.ar/*` route sends every subdomain to citax-router;
    // this more specific route takes precedence for codejam.
    triggers: mode === "staging" ? [] : [
      triggers.fetch({ pattern: "codejam.citax.com.ar/*", zone: "citax.com.ar" }),
    ],
    observability: {
      enabled: true,
      headSamplingRate: 0.1,
      logs: { enabled: true, headSamplingRate: 0.1 },
      traces: { enabled: true, headSamplingRate: 0.1 },
    },
  },
}));
