import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.VIRTION_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.resolve('review/screenshots/phase50-patient-pool');
const VIEWPORT = { width: 1440, height: 900 };

const TARGET_AVATARS = [
  'phase49-mpho-mixamo-sitting-talking',
  'patient-pool-female-black',
  'patient-pool-male-black',
  'patient-pool-female-white',
  'patient-pool-male-white',
  'patient-pool-female-indian',
  'patient-pool-male-indian',
  'patient-pool-female-asian',
  'patient-pool-male-asian',
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${BASE_URL}/encounter?case=im-001`, { waitUntil: 'domcontentloaded' });
  const identities = await page.evaluate(async () => {
    const mod = await import('/src/data/cases.ts');
    return mod.PATIENT_IDENTITIES.map((identity) => ({
      caseId: identity.caseId,
      displayName: identity.displayName,
      gender: identity.gender,
      southAfricanGroup: identity.southAfricanGroup,
      culturalNamePool: identity.culturalNamePool,
      avatarRace: identity.avatarRace,
      avatarId: identity.avatarId,
    }));
  });

  const receipts = [];
  for (const avatarId of TARGET_AVATARS) {
    const identity = identities.find((candidate) => candidate.avatarId === avatarId);
    if (!identity) {
      receipts.push({ avatarId, status: 'missing-case' });
      continue;
    }

    const url = `${BASE_URL}/encounter?case=${identity.caseId}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 20000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Loading patient'), null, { timeout: 30000 }).catch(() => undefined);
    await page.evaluate(() => {
      window.__setEncounterConversationStatus?.('speaking');
    });
    await page.waitForTimeout(2500);

    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    const expectedPath = avatarId === 'phase49-mpho-mixamo-sitting-talking'
      ? '/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking.glb'
      : `/assets/medical-suite/patients/patient-pool/${avatarId}.glb`;
    const loaded = resources.some((resource) => resource.includes(expectedPath));
    const screenshotName = `${slug(avatarId)}-${identity.caseId}-1440x900.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotName), fullPage: false });

    receipts.push({
      avatarId,
      caseId: identity.caseId,
      displayName: identity.displayName,
      gender: identity.gender,
      southAfricanGroup: identity.southAfricanGroup,
      culturalNamePool: identity.culturalNamePool,
      avatarRace: identity.avatarRace,
      expectedPath,
      expectedAssetLoaded: loaded,
      screenshot: screenshotName,
      url,
    });
  }

  const health = await fetch('http://127.0.0.1:8787/health').then((response) => response.json()).catch((error) => ({ error: String(error) }));
  const summary = {
    phase: 'PHASE50_PatientPoolMixamo',
    baseUrl: BASE_URL,
    viewport: VIEWPORT,
    receipts,
    consoleMessages,
    pageErrors,
    health,
  };
  await fs.writeFile(path.join(OUTPUT_DIR, 'phase50-patient-pool-review.json'), JSON.stringify(summary, null, 2));
  await browser.close();

  const failed = receipts.filter((receipt) => receipt.status === 'missing-case' || receipt.expectedAssetLoaded === false);
  if (failed.length > 0 || pageErrors.length > 0) {
    console.error(JSON.stringify({ failed, pageErrors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
