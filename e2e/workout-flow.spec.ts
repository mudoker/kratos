import { test, expect } from '@playwright/test';

test.describe('Kratos E2E Gym Plan & Workout Flow (Mobile View)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Disable service worker registration in the test environment to avoid route intercepting issues
    await context.addInitScript(() => {
      delete (navigator as Navigator & { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    });

    // Start at `/` which redirects to `/dashboard`
    await page.goto('/dashboard', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Coherent User Flow: Create Plan -> Start Workout from Plan -> Log Session -> View in History & Stats', async ({ page }) => {
    const planName = `Kratos Strength ${Date.now()}`;

    // ----------------------------------------------------
    // STEP 1: CREATE A NEW GYM PLAN TEMPLATE
    // ----------------------------------------------------
    
    // Navigate to Train section
    const bottomNav = page.locator('nav.lg\\:hidden');
    await bottomNav.locator('a[href="/train"]').click();
    await expect(page).toHaveURL(/\/train/);

    // Wait for client hydration to complete and loading spinner to disappear
    await page.locator('.animate-spin').waitFor({ state: 'detached' });

    // Switch to the 'Plans' tab in the workout hub
    const plansTabBtn = page.getByRole('button', { name: 'Plans' });
    await expect(plansTabBtn).toBeVisible();
    await plansTabBtn.click();

    // Click 'New plan' button at the top to configure a new split plan template
    const newPlanBtn = page.getByRole('button', { name: 'New plan' });
    await expect(newPlanBtn).toBeVisible();
    await newPlanBtn.click();

    // Verify template editor loaded
    await expect(page.getByText('Edit plan')).toBeVisible();

    // Fill in the Plan details
    const planNameInput = page.getByPlaceholder('e.g. Upper Body Hypertrophy');
    await planNameInput.fill(planName);
    
    const planDescTextarea = page.getByPlaceholder('Primary hypertrophy targets, tempos...');
    await planDescTextarea.fill('E2E Test template - Focus on heavy compound movements');

    // Click 'Add Exercise Template' for Day 1
    const addExerciseTemplateBtn = page.getByRole('button', { name: 'Add Exercise Template' });
    await addExerciseTemplateBtn.click();

    // Search and select 'Barbell Bench Press' from Picker dialog
    const pickerSearchInput = page.getByPlaceholder('Fuzzy search movement...');
    await expect(pickerSearchInput).toBeVisible();
    await pickerSearchInput.fill('Bench Press');

    const barbellBenchPressOption = page.locator('h4', { hasText: 'Barbell Bench Press' }).first();
    await expect(barbellBenchPressOption).toBeVisible();
    await barbellBenchPressOption.click();

    // Save the plan template
    const savePlanBtn = page.getByRole('button', { name: 'Save plan template' });
    await expect(savePlanBtn).toBeVisible();
    await savePlanBtn.click();

    // Verify it exits the editor and the new template is available to start.
    await expect(page.getByText('Edit plan')).not.toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Plans' })).toBeVisible();

    // Switch back to the 'Session' tab to verify and start a workout
    const sessionTabBtn = page.getByRole('button', { name: 'Session' });
    await sessionTabBtn.click();

    await expect(page.getByRole('heading', { name: `${planName} • Day 1` })).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: RECORD A WORKOUT SESSION USING THIS PLAN
    // ----------------------------------------------------

    // Find the Day 1 template item and click to start.
    const startPlanWorkoutBtn = page.locator('button', { hasText: planName }).first();
    await expect(startPlanWorkoutBtn).toBeVisible();
    await startPlanWorkoutBtn.click();

    // Verify the Active Workout logger is visible
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();

    // Fill in set weight & reps in the logger set row
    // Inside the logger row, locate input fields for weight (Kg) and reps
    const setRow = page.locator('div.grid-cols-\\[26px_1fr_1fr_40px\\], div.grid-cols-\\[32px_1fr_1fr_44px\\]').nth(1); // Row 0 is header, Row 1 is Set 1
    const weightInput = setRow.locator('input[type="number"]').first();
    const repsInput = setRow.locator('input[type="number"]').nth(1);

    await weightInput.fill('100');
    await repsInput.fill('5');

    // Click checkmark button to mark the set as complete
    const checkBtn = setRow.getByRole('button');
    await checkBtn.click();

    // Click 'Finish' in the workout header to trigger finish dialog
    const finishBtn = page.getByRole('button', { name: 'Finish' });
    await finishBtn.click();

    // Verify Finish Workout dialog is visible
    await expect(page.getByText('Rate fatigue and save historic session log')).toBeVisible();

    // Select RPE / effort level.
    const strongEffortBtn = page.getByRole('button', { name: 'Challenging' });
    await strongEffortBtn.click();

    // Enter session feedback notes
    const feedbackNotesTextarea = page.getByPlaceholder('Notes about specific weights, minor fatigue levels...');
    await feedbackNotesTextarea.fill('Felt solid, hit 100kg for E2E validation!');

    // Save/log the session
    const logWorkoutBtn = page.getByRole('button', { name: 'Log workout session' });
    await logWorkoutBtn.click();
    await expect(page.getByRole('dialog', { name: 'Finish Workout' })).not.toBeVisible({ timeout: 60000 });

    // ----------------------------------------------------
    // STEP 3: VERIFY IN HISTORY TAB
    // ----------------------------------------------------

    // Saving redirects to the 'History' tab of Train section
    const historyTabBtn = page.getByRole('button', { name: 'History' });
    await expect(historyTabBtn).toBeVisible();
    
    // Verify our logged session is listed under the history records
    await expect(page.locator('h3', { hasText: planName }).first()).toBeVisible();

    // ----------------------------------------------------
    // STEP 4: VERIFY ON ADMIN/USER DASHBOARD STATS
    // ----------------------------------------------------

    // Navigate to the Dashboard (Home) using bottom navigation bar
    await bottomNav.locator('a[href="/dashboard"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Switch to Dashboard 'History' tab to check recent sessions
    const dashHistoryTabBtn = page.getByRole('button', { name: 'History' });
    await dashHistoryTabBtn.click();

    // Check recent sessions list contains the plan workout.
    await expect(page.getByText(planName).first()).toBeVisible();

    // Switch to Dashboard 'Charts' tab to verify the statistics progress graphs
    const dashChartsTabBtn = page.getByRole('button', { name: 'Charts' });
    await dashChartsTabBtn.click();

    // Verify that the charts and volume statistics are visible
    await expect(page.getByText('Weekly Volume')).toBeVisible();
  });
});
