import { z } from "zod";

const specmaticSourceGit = z.object({
  type: z.literal("git"),
  repository: z.string().optional(),
  specification: z.string(),
  branch: z.string().nullable().optional(),
});

const specmaticSource = specmaticSourceGit; // Add more here

const specmaticHTTPOperationBase = z.object({
  path: z.string(),
  method: z.string(),
  responseCode: z.number(),
});

const specmaticHTTPOperation = specmaticHTTPOperationBase.extend({
  count: z.number().nullable().optional(),
});

const specmaticCoverageReportForHTTP = z.object({
  serviceType: z.literal("HTTP"),
  operations: z.array(
    specmaticHTTPOperation.extend({
      coverageStatus: z.enum(["covered", "missing in spec", "not implemented"]),
    })
  ),
});

const specmaticCoverageForProtocol =
  specmaticCoverageReportForHTTP; /* Add more here */

export const coverageValidator = z.array(
  specmaticSource.merge(specmaticCoverageForProtocol)
);

export const specmaticCoverageReport = z.object({
  specmaticConfigPath: z.string(),
  apiCoverage: coverageValidator,
});

export const specmaticCoverageReportValidator = specmaticCoverageReport;

export type SpecmaticCoverageReport = z.infer<typeof specmaticCoverageReport>;

const specmaticStubUsageForHTTP = z.object({
  serviceType: z.string(),
  operations: z.array(specmaticHTTPOperation),
});

const specmaticStubUsageForProtocol =
  specmaticStubUsageForHTTP; /* Add more here */

export const stubUsageValidator = z.array(
  specmaticSource.merge(specmaticStubUsageForProtocol)
);

export const specmaticStubUsageReport = z.object({
  specmaticConfigPath: z.string(),
  stubUsage: stubUsageValidator,
});

export const specmaticStubUsageReportValidator = specmaticStubUsageReport;

export type SpecmaticStubUsageReport = z.infer<typeof specmaticStubUsageReport>;

const specmaticCentralRepoReportSpecForHTTP = z.object({
  serviceType: z.literal("HTTP"),
  operations: z.array(specmaticHTTPOperationBase),
});

export const specmaticCentralRepoReportSpecForProtocol =
  specmaticCentralRepoReportSpecForHTTP; /* Add more here */

const specmaticCentralRepoReportSpec = z.object({
  specifications: z.array(
    specmaticCentralRepoReportSpecForProtocol.extend({
      specification: z.string(),
    })
  ),
});

export const specmaticCentralRepoReportValidator =
  specmaticCentralRepoReportSpec;

export type SpecmaticCentralRepoReportSpec = z.infer<
  typeof specmaticCentralRepoReportSpec
>;

export const buildMetaData = z.object({
  org_id: z.string(),
  branch_name: z.string(),
  repo_name: z.string(),
  repo_id: z.string(),
  repo_url: z.string()
});

export type BuildMetaData = z.infer<typeof buildMetaData>;
