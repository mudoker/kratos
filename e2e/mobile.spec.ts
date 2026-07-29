import { test, expect } from '@playwright/test';

test.describe('Kratos Mobile Flow E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Disable service worker registration in the test environment to avoid route intercepting issues
    await context.addInitScript(() => {
      delete (navigator as Navigator & { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    });

    // Navigate to the main application page.
    // Auth automatically mocks a logged-in user, which redirects to `/dashboard`.
    await page.goto('/');
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Scenario 1: Layout & Bottom Navigation', async ({ page }) => {
    // 1. Verify Top Sticky Navigation Header Bar (specific to mobile) is visible
    const header = page.locator('header.lg\\:hidden');
    await expect(header).toBeVisible();
    await expect(header.locator('span', { hasText: 'Kratos' })).toBeVisible();

    // 2. Verify Bottom Tab Navigation Bar is visible
    const bottomNav = page.locator('nav.lg\\:hidden');
    await expect(bottomNav).toBeVisible();

    // 3. Verify 'Home' and 'Train' links are present inside bottom navigation using specific href locators
    const homeLink = bottomNav.locator('a[href="/dashboard"]');
    const trainLink = bottomNav.locator('a[href="/train"]');
    await expect(homeLink).toBeVisible();
    await expect(trainLink).toBeVisible();

    // 4. Click 'Train' in bottom navigation, check URL and active header title
    await trainLink.click();
    await expect(page).toHaveURL(/\/train/);
    await expect(header.locator('span', { hasText: 'Train' })).toBeVisible();

    // 5. Click 'Home' in bottom navigation to switch back
    await homeLink.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Scenario 2: Dashboard Tabs (Overview, Charts, History)', async ({ page }) => {
    // Check that we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Get the Segmented Control buttons
    const overviewTabBtn = page.getByRole('button', { name: 'Overview' });
    const chartsTabBtn = page.getByRole('button', { name: 'Charts' });
    const historyTabBtn = page.getByRole('button', { name: 'History' });

    await expect(overviewTabBtn).toBeVisible();
    await expect(chartsTabBtn).toBeVisible();
    await expect(historyTabBtn).toBeVisible();

    // 1. Overview tab shows weekly target and saved splits
    await expect(page.getByText('Weekly target')).toBeVisible();
    await expect(page.getByText('Saved splits')).toBeVisible();

    // 2. Switch to 'Charts'
    await chartsTabBtn.click();
    // Verify that the charts tab component renders
    await expect(page.getByText('Weekly Volume')).toBeVisible();

    // 3. Switch to 'History'
    await historyTabBtn.click();
    await expect(page.getByText('Recent sessions')).toBeVisible();
    await expect(page.getByText('Personal Records (PRs)')).toBeVisible();

    // 4. Switch back to 'Overview'
    await overviewTabBtn.click();
    await expect(page.getByText('Weekly target')).toBeVisible();
  });

  test('Scenario 3: Side Menu Dialog & Exercise Movement Library', async ({ page }) => {
    // 1. Click "More" button on bottom nav to open Dialog sidebar
    const bottomNav = page.locator('nav.lg\\:hidden');
    const moreBtn = bottomNav.getByRole('button', { name: 'More' });
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    // 2. Click "Exercises" in the open dialog menu
    const dialogMenu = page.getByRole('dialog');
    await expect(dialogMenu).toBeVisible();
    
    const exercisesLink = dialogMenu.getByRole('link', { name: 'Exercises' });
    await expect(exercisesLink).toBeVisible();
    await exercisesLink.click();

    // 3. Check we navigated to /exercises and see page title
    await expect(page).toHaveURL(/\/exercises/);
    await expect(page.getByText('Movement Library')).toBeVisible();

    // 4. Search for "Bench Press" in the search input
    const searchInput = page.getByPlaceholder('Search exercises...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Bench Press');

    // 5. Select the exercise card for "Barbell Bench Press"
    const exerciseCard = page.locator('button', { hasText: 'Barbell Bench Press' }).first();
    await expect(exerciseCard).toBeVisible();
    await exerciseCard.click();

    // 6. Verify setup cues are shown on the screen
    await expect(page.getByText('Setup cues', { exact: true })).toBeVisible();
    await expect(page.getByText('Lie flat on your back on a bench.')).toBeVisible();
  });

  test('Scenario 4: AI Coach Config & Message Textbox', async ({ page }) => {
    // 1. Open the mobile menu and go to AI Coach page
    const bottomNav = page.locator('nav.lg\\:hidden');
    await bottomNav.getByRole('button', { name: 'More' }).click();

    const dialogMenu = page.getByRole('dialog');
    await dialogMenu.getByRole('link', { name: 'AI Coach' }).click();

    // 2. Verify we are on /coach and see "Kratos Coach" header
    await expect(page).toHaveURL(/\/coach/);
    await expect(page.getByRole('heading', { name: 'Kratos Coach' })).toBeVisible();

    // 3. Verify config key modal triggers (since key is empty initially)
    const configureBtn = page.getByRole('button', { name: 'Configure credentials' }).or(page.locator('button[title="Configure Coach API"]'));
    await expect(configureBtn).toBeVisible();
    await configureBtn.click();

    // Verify modal elements are visible
    const credentialsTitle = page.getByText('Configure AI Coach credentials');
    await expect(credentialsTitle).toBeVisible();

    const keyInput = page.getByPlaceholder('AIzaSy...');
    await expect(keyInput).toBeVisible();
    await keyInput.fill('AIzaSyMockKeyForTesting');

    // 4. Save credentials and verify modal closes
    const saveBtn = page.getByRole('button', { name: 'Save Credentials' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(credentialsTitle).not.toBeVisible();

    // 5. Verify text input is now ready for typing
    const chatTextarea = page.getByPlaceholder('Ask the coach...');
    await expect(chatTextarea).toBeVisible();
    await expect(chatTextarea).toBeEnabled();
  });

  test('Scenario 5: Active Workout Tracker Session', async ({ page }) => {
    // 1. Navigate to /train using bottom navigation
    const bottomNav = page.locator('nav.lg\\:hidden');
    await bottomNav.locator('a[href="/train"]').click();
    await expect(page).toHaveURL(/\/train/);

    // Wait for the client-side hydration loader to detach
    await page.locator('.animate-spin').waitFor({ state: 'detached' });

    // 2. Click "Start Workout" to launch active blank session
    const startWorkoutCard = page.getByText('Start Workout');
    await expect(startWorkoutCard).toBeVisible();
    await startWorkoutCard.click();

    // 3. Verify active workout logger is open
    // It should display 'Cancel' or 'Discard' button, and 'Finish' or 'Finish Workout'
    const discardBtn = page.getByRole('button', { name: 'Discard' });
    await expect(discardBtn).toBeVisible();

    // 4. Discard the active workout (handling confirm dialog)
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Discard active workout?');
      await dialog.accept();
    });

    await discardBtn.click();

    // 5. Verify we are back to the main Workout hub session select screen
    await expect(startWorkoutCard).toBeVisible();
  });
});
