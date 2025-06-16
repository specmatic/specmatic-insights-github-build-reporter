#!/usr/bin/env node
import fs from "fs";
import https from "https";
import { join } from "path";
import { URL } from "url";
import getCliArgs from "./get-cli-args";
import packageJSON from "../package.json";
import { logInfoStep } from "./utils";
import { specmaticProperties } from "./specmatic/read-specmatic-reports";
import generateReport from "./generate-report";
import type { BuildReportCore } from "./build-report-core";

const postToSpecmaticInsights = async (
  url: URL,
  report: BuildReportCore,
  noVerify = false
) => {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: !noVerify,
  });

  const response = await fetch(`${url.origin}/api/github-build-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    ...(url.protocol === "https:" && noVerify ? { agent: httpsAgent } : {}),
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to post build report to Specmatic Insights: ${
        response.status
      } ${JSON.stringify(await response.text())}`
    );
  }

  console.log("Successfully posted build report to Specmatic Insights");
};

(async () => {
  logInfoStep(`specmatic-insights-build-reporter@${packageJSON.version}`);
  const { dryRun, noVerify, specmaticInsightsHost, buildMetaData, ...cliArgs } = await getCliArgs();

  const report = await generateReport({
    ...(cliArgs as unknown as Record<string, string | undefined>),
    ...specmaticProperties(cliArgs),
    buildMetaData
  });

  fs.writeFileSync(
    join(process.cwd(), "build-report.html"),
    JSON.stringify(report)
  );
  if (!dryRun)
    await postToSpecmaticInsights(
      new URL(specmaticInsightsHost),
      report,
      noVerify
    );
})();
