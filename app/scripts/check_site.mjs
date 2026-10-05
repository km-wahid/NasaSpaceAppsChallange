import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

// Run against a running development or built app. All farm data is test-only;
// this check does not create accounts, write records, or call NASA/Nominatim.
const base = process.env.BASE_URL || 'http://127.0.0.1:3333'
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-webgl'],
})
const district = {
  district_id: '8001',
  district_name: 'Dhaka',
  division_id: '8001',
  latitude: '23.8',
  longitude: '90.4',
}
const catalog = {
  districts: [district],
  district,
  divisions: [{ division_id: '8001', division_name: 'Dhaka' }],
  crops: [],
  seasons: [],
  thresholds: [],
  statistics: [],
  climate: [],
  soil: null,
  risk: null,
  source: null,
  readiness: { requirements: 0, calendars: 0, economics: 0, nutrient_thresholds: 0 },
}
const fixturePlans = [0, 1, 2].map((index) => ({
  id: `fixture-${index}`,
  runId: '99',
  rank: index + 1,
  label: `Plan ${String.fromCharCode(65 + index)}`,
  waterDemand: ['medium', 'low', 'high'][index],
  fit: 'Fixture fit',
  soilHealth: 'Fixture soil comparison',
  crops: [
    {
      id: 1,
      name: 'Fixture Rice',
      plantingDate: '2026-07-10',
      harvestDate: '2026-11-05',
      waterNeed: 'high',
      condition: 'Fixture fit',
      reason: 'Test fixture: seasonal checks passed.',
      nextCrop: index === 1 ? 'Fixture Mustard' : 'Fixture Lentil',
      soilContribution: 'Fixture soil contribution',
    },
    {
      id: 2,
      name: index === 1 ? 'Fixture Mustard' : 'Fixture Lentil',
      plantingDate: '2026-11-20',
      harvestDate: '2027-02-20',
      waterNeed: 'low',
      condition: 'Fixture fit',
      reason: 'Test fixture: lower relative water demand.',
      nextCrop: 'Fixture Aus',
    },
    {
      id: 3,
      name: 'Fixture Aus',
      plantingDate: '2027-04-10',
      harvestDate: '2027-06-20',
      waterNeed: 'medium',
      condition: 'Fixture fit',
      reason: 'Test fixture: growing window fits.',
      nextCrop: 'Fixture Rice',
    },
  ],
  reasons: [
    { kind: 'water', title: 'Fixture water fit', text: 'Test fixture explanation.' },
    { kind: 'soil', title: 'Fixture soil fit', text: 'Test fixture explanation.' },
  ],
  tradeoffs: [{ kind: 'warning', text: 'Test fixture trade-off.' }],
}))

try {
  const context = await browser.newContext()
  // Local image fixture: never fetch community map tiles during automated checks.
  await context.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
        'base64'
      ),
    })
  )
  await context.route('**/api/v1/catalog*', (route) => route.fulfill({ json: catalog }))
  let analysisInput
  let showPlans = false
  const capture = async (page, name) => {
    if (process.env.SCREENSHOT_DIR) {
      await mkdir(process.env.SCREENSHOT_DIR, { recursive: true })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({
        path: join(process.env.SCREENSHOT_DIR, `${name}.png`),
        fullPage: !name.startsWith('water-selection'),
        animations: 'disabled',
      })
    }
  }
  await context.route('**/api/v1/crop-rotation/analyze', (route) => {
    analysisInput = route.request().postDataJSON()
    return route.fulfill({
      json: {
        water: {
          label: 'Moderate',
          source: 'Test fixture',
          chartNote: 'Fixture only.',
          rainfall: 'Not available',
          soil: 'Not available',
          dryPeriodRisk: showPlans ? 'High' : 'Not available',
          heavyRainRisk: showPlans ? 'Low' : 'Not available',
          waterStress: 'Medium',
          soilStress: 'Not available',
          series: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ].map((month, index) => ({
            month,
            index: showPlans && index !== 5 ? index % 3 : null,
            level:
              showPlans && index !== 5 ? ['Low', 'Moderate', 'High'][index % 3] : 'Not available',
            rainfall:
              showPlans && index !== 5 ? ['Low', 'Moderate', 'High'][index % 3] : 'Not available',
            season: 'Fixture season',
          })),
        },
        plans: showPlans ? fixturePlans : [],
        planning: { status: 'needs-farm', message: 'Test fixture: add farm information.' },
        contextNote: 'Fixture only.',
        source: null,
      },
    })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    window.locationRequests = 0
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition(_success, failure) {
          window.locationRequests++
          failure({ code: 1 })
        },
      },
    })
  })
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [path, heading] of [
      ['/', 'A better season'],
      ['/planner', 'Find your next crop rotation.'],
      ['/sources', 'Good decisions start'],
      ['/login', 'Welcome back.'],
      ['/signup', 'Let’s grow together.'],
    ]) {
      const response = await page.goto(`${base}${path}`)
      assert.equal(response.status(), 200, `${path} must load directly`)
      await page
        .getByRole('heading', { name: new RegExp(heading) })
        .first()
        .waitFor()
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} must fit ${width}px`
      )
    }
  }
  assert.equal(await page.evaluate(() => window.locationRequests), 0, 'No automatic GPS prompt')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(base)
  assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), '/favicon.svg')
  const favicon = await context.request.get(`${base}/favicon.svg`)
  assert.equal(favicon.status(), 200)
  assert.ok(favicon.headers()['content-type'].includes('image/svg+xml'))
  if (process.env.SCREENSHOT_DIR) {
    await page.getByRole('heading', { name: /A better season/ }).waitFor()
    await page.locator('.agri-final-cta').waitFor()
    await page.locator('.agri-hero-image').evaluate((image) => image.decode())
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true })
    await page.screenshot({
      path: join(process.env.SCREENSHOT_DIR, 'home-desktop.png'),
      fullPage: true,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: join(process.env.SCREENSHOT_DIR, 'home-mobile.png'),
      fullPage: true,
    })
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  await page.getByRole('link', { name: 'Plan my season', exact: true }).click()
  await page.waitForURL('**/planner')
  await page.getByRole('heading', { name: 'Let’s find your location' }).waitFor()
  await capture(page, 'location-desktop')
  await page.getByRole('button', { name: 'Use my location', exact: true }).click()
  await page.getByRole('heading', { name: 'Location access is off' }).waitFor()
  assert.equal(await page.evaluate(() => window.locationRequests), 1)
  await page.getByRole('button', { name: 'Choose manually', exact: true }).click()
  await page.locator('select[id$="-division"]').selectOption('8001')
  await page.locator('select[id$="-district"]').selectOption('8001')
  await page.setViewportSize({ width: 390, height: 844 })
  await capture(page, 'location-manual-mobile')
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Manual location fits mobile'
  )
  await page.getByRole('button', { name: 'Use this district' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  await dialog.getByRole('radio').nth(1).check()
  await capture(page, 'water-selection-mobile')
  const modalBounds = await dialog.locator('.modal-box').boundingBox()
  assert.ok(
    modalBounds.x >= 0 &&
      modalBounds.y >= 0 &&
      modalBounds.x + modalBounds.width <= 390 &&
      modalBounds.y + modalBounds.height <= 844,
    'Water modal fits the mobile viewport'
  )
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('heading', { name: 'Moderate water availability' }).waitFor()
  const mapPreview = page.getByRole('img', { name: 'Map preview of Dhaka', exact: true })
  await mapPreview.waitFor()
  await mapPreview
    .locator('img')
    .first()
    .evaluate(async (image) => image.decode())
  assert.equal(await page.locator('iframe').count(), 0, 'Map must not embed a WebGL renderer')
  await mapPreview
    .locator('img')
    .first()
    .evaluate((image) => image.dispatchEvent(new Event('error')))
  await page.getByRole('img', { name: 'Map preview unavailable for Dhaka' }).waitFor()
  await page.getByRole('link', { name: 'Open larger map' }).waitFor()
  assert.deepEqual(analysisInput, { districtId: '8001', waterAvailability: 'medium' })
  await page.getByRole('heading', { name: 'Let’s prepare your crop plan' }).waitFor()
  await page.getByText('Sample plan', { exact: true }).waitFor()
  assert.equal(await page.getByText('Preview sample crop rotations', { exact: true }).count(), 0)
  assert.equal(
    await page.getByRole('button', { name: 'Sample only · cannot apply' }).isDisabled(),
    true
  )
  await page.getByRole('button', { name: /Sample Plan B/ }).click()
  await page.getByRole('heading', { name: 'Sample Plan B · Crop rotation' }).waitFor()
  await page.getByRole('button', { name: 'Jan: No data water availability' }).click()
  assert.ok(
    await page
      .locator('.water-month-tip')
      .textContent()
      .then((text) => text.includes('Do not treat missing data as low water'))
  )
  assert.equal(await page.locator('.seasonal-signal[data-tone="unknown"]').count(), 3)
  showPlans = true
  await page.getByRole('button', { name: 'Change water availability' }).click()
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('heading', { name: 'Plan A · Crop rotation' }).waitFor()
  assert.ok(
    await page
      .locator('#crop-plans')
      .boundingBox()
      .then(
        async (box) =>
          box.y < (await page.getByRole('region', { name: 'Water outlook' }).boundingBox()).y
      ),
    'Crop recommendations appear before supporting water analytics'
  )
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download planting guide' }).click()
  assert.equal((await download).suggestedFilename(), 'crop-rotation-plan.txt')
  const march = page.getByRole('button', { name: 'Mar: High water availability' })
  await march.click()
  assert.equal(await march.getAttribute('aria-pressed'), 'true')
  await page
    .locator('.water-month-detail')
    .getByRole('heading', { name: 'Mar · Fixture season' })
    .waitFor()
  assert.equal(await page.locator('.seasonal-signal[data-tone="success"]').count(), 1)
  assert.equal(await page.locator('.seasonal-signal[data-tone="warning"]').count(), 1)
  assert.equal(await page.locator('.seasonal-signal[data-tone="error"]').count(), 1)
  assert.equal(
    await page.getByRole('button', { name: 'Jun: No data water availability' }).count(),
    1
  )
  await capture(page, 'water-analytics-mobile')
  if (process.env.SCREENSHOT_DIR) {
    await page.locator('.seasonal-water-chart').screenshot({
      path: join(process.env.SCREENSHOT_DIR, 'water-outlook-mobile.png'),
      animations: 'disabled',
    })
    await page.locator('.seasonal-risks').screenshot({
      path: join(process.env.SCREENSHOT_DIR, 'seasonal-signals-mobile.png'),
      animations: 'disabled',
    })
  }
  await page
    .getByRole('button', { name: 'Fixture Lentil, Nov 2026 to Feb 2027', exact: true })
    .click()
  await page.getByRole('heading', { name: 'Fixture Lentil', exact: true }).waitFor()
  await page.getByRole('button', { name: /Plan B/ }).click()
  await page.getByRole('heading', { name: 'Plan B · Crop rotation' }).waitFor()
  assert.ok(
    (await page.locator('#rotation-alternatives').textContent()).includes('Jul 2026 → Nov 2026'),
    'Alternative listing includes actual growing months'
  )
  assert.ok(
    (await page.locator('#rotation-alternatives').textContent()).includes(
      'Fixture soil contribution'
    ),
    'Alternative listing includes crop soil contribution'
  )
  assert.ok(
    (await page.locator('#rotation-alternatives').textContent()).includes(
      'Soil: Fixture soil comparison'
    ),
    'Alternative listing includes rotation soil comparison'
  )
  assert.ok(
    await page
      .getByRole('button', { name: 'Fixture Mustard, Nov 2026 to Feb 2027', exact: true })
      .count()
  )
  await capture(page, 'crop-plans-mobile')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await capture(page, 'crop-plans-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Water dashboard fits mobile'
  )
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Our data' })
    .click()
  await page.waitForURL('**/sources')
  await page.getByRole('navigation', { name: 'Mobile navigation' }).waitFor({ state: 'hidden' })
  await capture(page, 'sources-mobile')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await capture(page, 'sources-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'My farms' })
    .click()
  await page.waitForURL('**/login')
  await page.reload()
  await page.getByLabel('Email', { exact: true }).waitFor()
  // Presentation fixture only: the real guest /farms guard was verified above.
  const inertiaResponse = await context.request.get(`${base}/planner`, {
    headers: { 'X-Inertia': 'true' },
  })
  const inertiaPage = await inertiaResponse.json()
  await context.route('**/farms', (route) =>
    route.fulfill({
      json: {
        ...inertiaPage,
        component: 'farms',
        url: '/farms',
        props: { ...inertiaPage.props, user: { id: 1, initials: 'TF' } },
      },
      headers: { 'X-Inertia': 'true' },
    })
  )
  await context.route('**/api/v1/farms', (route) =>
    route.fulfill({ json: [{ farm_id: '1', name: 'Fixture farm', district_id: '8001' }] })
  )
  await context.route('**/api/v1/farms/1/inputs', (route) =>
    route.fulfill({ json: { soil: null, measurements: [], history: [], preferences: null } })
  )
  await context.route('**/api/v1/farms/1/environment', (route) =>
    route.fulfill({ status: 503, json: { error: 'ENVIRONMENT_PROFILE_MISSING' } })
  )
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'My farms' })
    .click()
  await page.getByRole('heading', { name: 'Your farm workspace' }).waitFor()
  await page.getByRole('heading', { name: 'Your priorities', exact: true }).waitFor()
  assert.equal(
    await page.getByRole('button', { name: /Crop history/ }).isVisible(),
    false,
    'Extra farm details are optional and collapsed'
  )
  await page.locator('summary').filter({ hasText: 'Add extra details (optional)' }).last().click()
  await page.getByRole('button', { name: /Crop history/ }).click()
  await page.getByRole('heading', { name: '2. Previous crops' }).waitFor()
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Farm controls fit mobile'
  )
  await capture(page, 'farm-details-mobile')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await capture(page, 'farm-details-desktop')
  await page.getByRole('button', { name: /Priorities/ }).click()
  await page.getByRole('heading', { name: '4. Farmer priorities' }).waitFor()
  // Signed-in presentation fixture: verify selection writes, restoration and failures.
  let savedChoice = null
  let rejectChoice = false
  await context.route('**/api/v1/location', (route) =>
    route.fulfill({
      json: {
        latitude: null,
        longitude: null,
        district: 'Dhaka',
        districtId: '8001',
        division: 'Dhaka',
        country: 'Bangladesh',
        countryCode: 'bd',
        waterAvailability: 'medium',
      },
    })
  )
  await context.route('**/api/v1/farms/1/rotation-choice', (route) => {
    if (route.request().method() === 'PUT') {
      if (rejectChoice)
        return route.fulfill({ status: 500, json: { error: 'Fixture save failure' } })
      const choice = route.request().postDataJSON()
      assert.equal(choice.runId, '99')
      savedChoice = {
        ...choice,
        selectedAt: new Date().toISOString(),
        crops: fixturePlans[choice.rank - 1].crops,
      }
    }
    return route.fulfill({ json: savedChoice })
  })
  await context.route('**/planner', (route) =>
    route.fulfill({
      json: {
        ...inertiaPage,
        component: 'planner',
        url: '/planner',
        props: { ...inertiaPage.props, user: { id: 1, initials: 'TF' } },
      },
      headers: { 'X-Inertia': 'true' },
    })
  )
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Crop planner' })
    .click()
  await page.getByRole('button', { name: 'Generate crop rotations' }).click()
  await page.getByRole('heading', { name: 'Plan A · Crop rotation' }).waitFor()
  assert.equal(analysisInput.farmId, 1)
  await page.getByRole('button', { name: 'Use this rotation · Plan A' }).click()
  await page.getByRole('button', { name: 'Rotation saved to your farm' }).waitFor()
  assert.equal(savedChoice.rank, 1)
  await page.getByRole('button', { name: /Plan B/ }).click()
  rejectChoice = true
  await page.getByRole('button', { name: 'Use this rotation · Plan B' }).click()
  await page.getByText('Fixture save failure', { exact: true }).waitFor()
  assert.equal(savedChoice.rank, 1, 'Failed save must preserve the previous choice')
  rejectChoice = false
  await page.getByRole('button', { name: 'Use this rotation · Plan B' }).click()
  await page.getByRole('button', { name: 'Rotation saved to your farm' }).waitFor()
  assert.equal(savedChoice.rank, 2)
  await page.getByRole('button', { name: 'Generate crop rotations' }).click()
  await page.getByText(/Your saved rotation:.*Fixture Mustard/).waitFor()
  await capture(page, 'recommendation-first-desktop')
  await page.goto(`${base}/this-page-does-not-exist`)
  await page.getByRole('heading', { name: 'This page isn’t on the map.' }).waitFor()
  await page.getByRole('link', { name: 'Back to home' }).click()
  await page.waitForURL(base + '/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior),
    'auto'
  )
  assert.deepEqual(errors, [], 'No browser runtime errors')
  console.log(
    'PASS: direct routes, responsive navigation, 320–1440px layouts, location fallback, water dialog/API, cross-year crop calendar, crop details, alternative plans, farm tabs, auth guard, 404 recovery and reduced motion.'
  )
} finally {
  await browser.close()
}
