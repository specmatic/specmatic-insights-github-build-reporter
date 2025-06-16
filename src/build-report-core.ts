import { z } from "zod";
import {
  coverageValidator,
  specmaticCentralRepoReportSpecForProtocol,
  stubUsageValidator,
} from "./specmatic/types";

export const buildReportCoreValidator = z.object({
  orgId: z.string(),
  repo: z.string(),
  repoId: z.string(),
  repoUrl: z.string(),
  branchName: z.string(),
  createdAt: z.date(),
  specmaticConfigPath: z.string().optional(),
  specmaticCoverage: coverageValidator.optional(),
  specmaticStubUsage: stubUsageValidator.optional(),
  specmaticCentralRepoReport: z
    .array(
      specmaticCentralRepoReportSpecForProtocol.extend({
        specification: z.string(),
      })
    )
    .optional(),
  // Enhanced build reports with test data and configuration
  specmaticTestData: z.record(z.any()).optional(),
  specmaticConfig: z.record(z.any()).optional(),
});

export type BuildReportCore = z.infer<typeof buildReportCoreValidator>;
