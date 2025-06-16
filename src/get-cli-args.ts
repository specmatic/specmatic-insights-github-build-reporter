import yargs from "yargs/yargs";
import { URL } from "url";
import fs from "fs";
import path from "path";

const ensureValidUrl = (url: string, key: string) => {
  try {
    new URL(url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error(`Invalid URL for "${key}": "${url}"`);
  }
};

const ensureNonEmptyValue = (value: string, key: string) => {
  if (!value) {
    throw new Error(`The "${key}" cannot be empty`);
  }
};


const parseCliArgs = async (cliArgs: string[]) => {
  const parsed = await yargs(cliArgs)
    .option("sih", {
      alias: "specmatic-insights-host",
      type: "string",
      description: "Specmatic Insights host",
      group: "Specmatic Insights",
      default: "https://insights.specmatic.io",
    })
    .option("srd", {
      alias: "specmatic-reports-dir",
      type: "string",
      description: "The path to the Specmatic reports directory",
      group: "Specmatic",
      default: "./build/reports/specmatic",
    })
    .option("dr", {
      alias: "dry-run",
      type: "boolean",
      description: "Do not post to Specmatic Insights",
      group: "Specmatic Insights",
      default: false,
    })
    .option("nv", {
      alias: "no-verify",
      type: "boolean",
      description: "Do not verify the SSL certificate (not-recommended)",
      group: "Specmatic Insights",
      default: false,
    })
    .option("oi", {
      alias: "org-id",
      type: "string",
      description: "Specmatic Insights Org ID",
      group: "Specmatic Insights",
      demandOption: true,
    })
    .option("bn", {
      alias: "branch-name",
      type: "string",
      description:
        "The short branch name that triggered the build. In Github this maps to github.ref_name environment variable.",
      group: "Specmatic Insights",
      demandOption: true,
    })
    .option("rn", {
      alias: "repo-name",
      type: "string",
      description:
        "Name of the GIT repository. The repo should not include the repo owner name. In Github github.repository env variable also contains the repo owner. So you need to subtract github.repository_owner from github.repository to just get the repo name.",
      group: "Specmatic Insights",
      demandOption: true,
    })
    .option("ri", {
      alias: "repo-id",
      type: "string",
      description:
        "Unique ID of the GIT repository. In Github this maps to github.repository_id environment variable.",
      group: "Specmatic Insights",
      demandOption: true,
    })
    .option("ru", {
      alias: "repo-url",
      type: "string",
      description:
        "Fully qualified GIT repository URL. In Github, we can use github.server_url + / + github.repository environment variables.",
      group: "Specmatic Insights",
      demandOption: true,
    })
    .example([
      [
        "npx specmatic-insights-github-build-reporter" +
          " --specmatic-insights-host=https://insights.specmatic.io" +
          " --specmatic-reports-dir=./build/reports/specmatic" +
          " --org-id=<YOUR_SPECMATIC_INSIGHTS_ORG_ID>" +
          " --branch-name=main" +
          " --repo-name=specmatic-order-bff-java" +
          " --repo-id=636154288" +
          " --repo-url=https://github.com/znsio/specmatic-order-bff-java",
      ],
      [
        "npx specmatic-insights-github-build-reporter" +
          " --org-id=<YOUR_SPECMATIC_INSIGHTS_ORG_ID>" +
          " --branch-name=main" +
          " --repo-name=specmatic-order-bff-java" +
          " --repo-id=636154288" +
          " --repo-url=https://github.com/znsio/specmatic-order-bff-java",
      ],
      [
        "npx specmatic-insights-github-build-reporter --dry-run=true" +
          " --org-id=<YOUR_SPECMATIC_INSIGHTS_ORG_ID>" +
          " --branch-name=main" +
          " --repo-name=specmatic-order-bff-java" +
          " --repo-id=636154288" +
          " --repo-url=https://github.com/znsio/specmatic-order-bff-java",
      ],
    ])
    .check((parsedArgs) => {
      ensureValidUrl(parsedArgs.sih, "specmatic-insights-host");
      ensureValidUrl(parsedArgs.ru, "repo-url");
      ensureNonEmptyValue(parsedArgs.oi, "org-id");
      ensureNonEmptyValue(parsedArgs.bn, "branch-name");
      ensureNonEmptyValue(parsedArgs.rn, "repo-name");
      ensureNonEmptyValue(parsedArgs.ri, "repo-id");
      return true;
    }).argv;

  const reportsDir = parsed.srd;
  const files = fs.readdirSync(reportsDir);
  const coverageReport = files.find((file) =>
    file.includes("coverage_report.json")
  );
  const stubUsageReport = files.find((file) =>
    file.includes("stub_usage_report.json")
  );
  const centralRepoReport = files.find((file) =>
    file.includes("central_contract_repo_report.json")
  );

  // Look for test data in the HTML assets directory
  const htmlAssetsDir = path.join(reportsDir, "html", "assets");
  
  // Find test data file if the directory exists
  const testDataFile = fs.existsSync(htmlAssetsDir) 
    ? fs.readdirSync(htmlAssetsDir).find(file => file === "test_data.json")
    : undefined;

  // Look for specmatic config in common locations
  const specmaticConfigFile = ["specmatic.yaml", "specmatic.yml", "specmatic.json"]
      .flatMap((file) => [
        path.join(process.cwd(), file),
        path.join(process.cwd(), "src", "test", "resources", file),
      ])
      .find((location) => fs.existsSync(location));

  return {
    specmaticInsightsHost: parsed.sih,
    ...(coverageReport
      ? { specmaticCoverage: path.join(reportsDir, coverageReport) }
      : {}),
    ...(stubUsageReport
      ? { specmaticStubUsage: path.join(reportsDir, stubUsageReport) }
      : {}),
    ...(centralRepoReport
      ? { specmaticCentralRepoReport: path.join(reportsDir, centralRepoReport) }
      : {}),
    ...(testDataFile
      ? { specmaticTestData: path.join(htmlAssetsDir, testDataFile) }
      : {}),
    ...(specmaticConfigFile
      ? { specmaticConfig: specmaticConfigFile }
      : {}),
    dryRun: parsed.dr,
    noVerify: parsed.nv,
    buildMetaData: {
      org_id: parsed.oi,
      branch_name: parsed.bn,
      repo_name: parsed.rn,
      repo_id: parsed.ri,
      repo_url: parsed.ru,
    },
  } as const;
};

export default () => parseCliArgs(process.argv);
