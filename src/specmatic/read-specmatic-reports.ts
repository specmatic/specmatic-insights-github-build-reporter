import type { ZodType } from "zod";
import * as yaml from "yaml";
import { safelyReadFile, logInfoStep, logErrorStep } from "../utils";
import {
  specmaticCentralRepoReportValidator,
  specmaticCoverageReportValidator,
  specmaticStubUsageReportValidator,
} from "./types";

// Read specmatic config - parses the file based on extension (YAML or JSON)
const readSpecmaticConfig = (configPath?: string): Record<string, never> | undefined => {
  if (!configPath) {
    logInfoStep("No specmatic config path provided");
    return undefined;
  }

  // Read the file content
  const content = safelyReadFile("specmatic configuration", configPath);
  if (!content) {
    logInfoStep(`Could not read specmatic config from ${configPath}`);
    return undefined;
  }

  // Parse based on file extension
  try {
    // Prefer YAML parsing for .yaml/.yml files
    if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
      const yamlResult = yaml.parse(content);
      logInfoStep(`Parsed YAML config from ${configPath}`);
      return yamlResult;
    }
    // For .json or any other extension, try JSON first
    const jsonResult = JSON.parse(content);
    logInfoStep(`Parsed JSON config from ${configPath}`);
    return jsonResult;
  } catch (e) {
    logErrorStep(`Failed to parse specmatic config from ${configPath} as either YAML or JSON:`, e);
    return undefined;
  }
};

const parseFile = <T>(
  name: string,
  path: string | undefined,
  validator: ZodType<T>
) => {
  const json = safelyReadFile(name, path);
  if (!json) return undefined;

  try {
    return validator.parse(JSON.parse(json));
  } catch (e) {
    throw new Error(`Failed to parse ${name} as valid JSON: ${e}`);
  }
};

// Read and parse JSON file content
const parseJsonFile = (name: string, path: string | undefined) => {
  const content = safelyReadFile(name, path);
  if (!content) return undefined;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse ${name} as valid JSON: ${e}`);
  }
};

export const specmaticProperties = ({
  specmaticCoverage,
  specmaticStubUsage,
  specmaticCentralRepoReport,
  specmaticTestData,
  specmaticConfig,
}: {
  specmaticCoverage?: string;
  specmaticStubUsage?: string;
  specmaticCentralRepoReport?: string;
  specmaticTestData?: string;
  specmaticConfig?: string;
}) => ({
  specmaticCoverage: parseFile(
    "specmatic coverage report",
    specmaticCoverage,
    specmaticCoverageReportValidator
  ),
  specmaticStubUsage: parseFile(
    "specmatic stub usage report",
    specmaticStubUsage,
    specmaticStubUsageReportValidator
  ),
  specmaticCentralRepoReport: parseFile(
    "specmatic central repository report",
    specmaticCentralRepoReport,
    specmaticCentralRepoReportValidator
  ),
  // Parse JSON for test data instead of returning raw string
  specmaticTestData: parseJsonFile(
    "specmatic test data",
    specmaticTestData
  ),
  specmaticConfig: readSpecmaticConfig(specmaticConfig),
});
