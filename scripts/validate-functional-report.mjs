#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const reportPathArg = args.find((arg) => !arg.startsWith('--'));
const reportPath =
  reportPathArg ??
  path.join(process.cwd(), 'docs', 'MOXE_FUNCTIONAL_VERIFICATION_REPORT_2026-04-07.json');

function fail(message) {
  console.error(`[functional-report] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) {
  fail(`Report not found: ${reportPath}`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (error) {
  fail(`Invalid JSON in report: ${error instanceof Error ? error.message : String(error)}`);
}

if (!Array.isArray(report?.domains) || report.domains.length === 0) {
  fail('Missing or empty "domains" array.');
}

const allowedDomainStatuses = new Set([
  'working',
  'working_with_role_gating',
  'working_with_expected_gating',
  'working_with_config_and_validation_dependencies',
]);

const allowedCheckResults = new Set([
  'pass',
  'expected_gating',
  'expected_validation',
  'config_dependent',
]);

const badDomainStatuses = [];
const badChecks = [];
const nonPassChecks = [];

for (const domain of report.domains) {
  if (!allowedDomainStatuses.has(domain.status)) {
    badDomainStatuses.push(`${domain.name ?? 'unknown'}=${String(domain.status)}`);
  }
  if (!Array.isArray(domain.checks) || domain.checks.length === 0) {
    badChecks.push(`${domain.name ?? 'unknown'} has no checks`);
    continue;
  }
  for (const check of domain.checks) {
    if (!allowedCheckResults.has(check.result)) {
      badChecks.push(
        `${domain.name ?? 'unknown'} ${check.method ?? 'METHOD'} ${check.endpoint ?? 'endpoint'} result=${String(check.result)}`
      );
    }
    if (check.result !== 'pass') {
      nonPassChecks.push(
        `${domain.name ?? 'unknown'} ${check.method ?? 'METHOD'} ${check.endpoint ?? 'endpoint'} result=${String(check.result)}`
      );
    }
  }
}

if (badDomainStatuses.length > 0) {
  fail(`Disallowed domain statuses found: ${badDomainStatuses.join(', ')}`);
}

if (badChecks.length > 0) {
  fail(`Disallowed check results found: ${badChecks.join(' | ')}`);
}

if (isStrict && nonPassChecks.length > 0) {
  fail(`Strict mode failed: non-pass checks found: ${nonPassChecks.join(' | ')}`);
}

console.log(
  `[functional-report] OK${isStrict ? ' (strict)' : ''}: ${report.domains.length} domains validated in ${path.relative(process.cwd(), reportPath)}`
);
