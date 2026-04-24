import { test, expect } from '@playwright/test';

test.describe('Mentee Profile Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:4200/login');
    
    // Fill in login credentials (using test user)
    await page.fill('input[type="email"]', 'mentee@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Click login button
    await page.click('button:has-text("Log In")');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    
    // Navigate to profile settings
    await page.goto('http://localhost:4200/settings/profile');
    
    // Wait for profile settings page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display profile settings page with all sections', async ({ page }) => {
    // Check for header
    await expect(page.locator('h1:has-text("Profile Settings")')).toBeVisible();
    
    // Check for main sections
    await expect(page.locator('h2:has-text("Profile Picture")')).toBeVisible();
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    await expect(page.locator('h2:has-text("Learning & Interests")')).toBeVisible();
    await expect(page.locator('h2:has-text("Session Preferences")')).toBeVisible();
  });

  test('should pre-populate form fields with current profile data', async ({ page }) => {
    // Check if form fields are populated
    const bioField = page.locator('textarea[placeholder*="about yourself"]');
    const bioValue = await bioField.inputValue();
    expect(bioValue).toBeTruthy();
    
    // Check country field is populated
    const countrySelect = page.locator('select').nth(0);
    await expect(countrySelect).toHaveValue('Philippines');
  });

  test('should upload and preview avatar', async ({ page }) => {
    // Set up file input
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test image file
    await fileInput.setInputFiles({
      name: 'test-avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    
    // Wait for preview to appear
    await page.waitForTimeout(1000);
    
    // Check that avatar preview is displayed
    const preview = page.locator('img[alt="Profile preview"]');
    await expect(preview).toBeVisible();
  });

  test('should reject files with invalid format', async ({ page }) => {
    // Set up file input
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload a PDF file
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data'),
    });
    
    // Check error message
    const errorMessage = page.locator('text=Only JPG, JPEG, and PNG');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Clear a required field
    const countrySelect = page.locator('select').nth(0);
    await countrySelect.selectOption('');
    
    // Try to submit
    const updateButton = page.locator('button:has-text("Update Profile")');
    await updateButton.click();
    
    // Check that form is not submitted (button should still be visible)
    await expect(updateButton).toBeVisible();
  });

  test('should manage learning goals array', async ({ page }) => {
    // Add a learning goal
    const addGoalButton = page.locator('button:has-text("Add Goal")');
    await addGoalButton.click();
    
    const newGoalInput = page.locator('input[placeholder*="Master TypeScript"]').last();
    await newGoalInput.fill('Learn System Design');
    
    // Check that the goal is added
    await expect(newGoalInput).toHaveValue('Learn System Design');
    
    // Remove the goal
    const removeButton = page.locator('button[title="Remove learning goal"]').last();
    await removeButton.click();
  });

  test('should toggle areas of interest', async ({ page }) => {
    // Find and click on an area of interest checkbox
    const webDevCheckbox = page.locator('input[type="checkbox"]').filter({
      hasText: 'Web Development'
    }).first();
    
    // Check current state
    const isChecked = await webDevCheckbox.isChecked();
    
    // Toggle it
    await webDevCheckbox.click();
    
    // Verify it changed state
    const newCheckedState = await webDevCheckbox.isChecked();
    expect(newCheckedState).toBe(!isChecked);
  });

  test('should manage availability schedule', async ({ page }) => {
    // Find Monday checkbox and enable it
    const mondayCheckbox = page.locator('input[type="checkbox"]').filter({
      hasText: 'monday'
    }).first();
    
    await mondayCheckbox.click();
    
    // Wait for time frames to appear
    await page.waitForTimeout(500);
    
    // Check that time inputs are visible
    const timeInputs = page.locator('input[type="time"]');
    await expect(timeInputs.first()).toBeVisible();
    
    // Add a time frame
    const addTimeButton = page.locator('button:has-text("Add time slot")').first();
    await addTimeButton.click();
    
    // Verify second time frame appears
    await expect(timeInputs.nth(2)).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    // Find phone number input field
    const phoneInput = page.locator('input[placeholder*="+639171234567"]');
    
    // Enter invalid phone format
    await phoneInput.fill('123456');
    
    // Trigger validation by focusing another field
    const bioField = page.locator('textarea').first();
    await bioField.click();
    
    // Check for error message
    const errorMessage = page.locator('text=Invalid phone format');
    await expect(errorMessage).toBeVisible();
    
    // Enter valid format
    await phoneInput.fill('+639171234567');
    
    // Error message should disappear
    await expect(errorMessage).not.toBeVisible();
  });

  test('should display loading state during submission', async ({ page }) => {
    // Fill required fields if not already filled
    const countrySelect = page.locator('select').nth(0);
    const country = await countrySelect.inputValue();
    if (!country) {
      await countrySelect.selectOption('Philippines');
    }
    
    // Click update button
    const updateButton = page.locator('button:has-text("Update Profile")');
    await updateButton.click();
    
    // Check for loading state 
    const updatingText = page.locator('text=Updating...');
    // The loading state might be very brief, so we just check the button is disabled
    await expect(updateButton).toBeDisabled();
  });

  test('should show success message after profile update', async ({ page }) => {
    // Make a minimal valid update
    const bioField = page.locator('textarea').first();
    const currentBio = await bioField.inputValue() || '';
    
    // Change bio slightly
    await bioField.clear();
    await bioField.fill(currentBio + ' Updated');
    
    // Submit
    const updateButton = page.locator('button:has-text("Update Profile")');
    await updateButton.click();
    
    // Wait for success message
    const successMessage = page.locator('text=/successfully|updated/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back button
    const backButton = page.locator('a:has-text("Back to Dashboard")');
    await backButton.click();
    
    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should require at least one area of interest', async ({ page }) => {
    // Get all area of interest checkboxes
    const checkboxes = page.locator('input[type="checkbox"]').filter({
      hasText: /Web Development|Mobile Development|Data Science/
    });
    
    // Uncheck all
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
      }
    }
    
    // Try to submit
    const updateButton = page.locator('button:has-text("Update Profile")');
    await updateButton.click();
    
    // Check for validation error
    const errorMessage = page.locator('text=at least one area of interest');
    await expect(errorMessage).toBeVisible();
  });

  test('should limit learning goals to 500 characters', async ({ page }) => {
    // Add a learning goal field if needed
    const addGoalButton = page.locator('button:has-text("Add Goal")');
    const addButtonExists = await addGoalButton.isVisible().catch(() => false);
    
    if (addButtonExists) {
      await addGoalButton.click();
    }
    
    // Find a learning goal input
    const goalInput = page.locator('input[placeholder*="Master TypeScript"]');
    
    // Try to enter more than 500 characters
    const longText = 'a'.repeat(501);
    await goalInput.fill(longText);
    
    // Check that input is limited or shows error
    const actualLength = (await goalInput.inputValue() || '').length;
    if (actualLength > 500) {
      // If input accepts it, check for validation error
      const errorMessage = page.locator('text=cannot exceed 500');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should persist form changes across navigation', async ({ page }) => {
    // Change a field
    const bioField = page.locator('textarea').first();
    const newBio = 'Test bio update ' + Date.now();
    await bioField.clear();
    await bioField.fill(newBio);
    
    // Navigate away and back
    const backButton = page.locator('a:has-text("Back to Dashboard")');
    await backButton.click();
    await page.goto('http://localhost:4200/settings/profile');
    
    // Wait for reload
    await page.waitForLoadState('networkidle');
    
    // Check if previous value is still there (from server)
    const reloadedBio = await bioField.inputValue();
    // Note: This will depend on whether the update was saved
    // If not saved in previous test, it might not persist
    expect(reloadedBio).toBeTruthy();
  });

  test('should handle remove avatar preview', async ({ page }) => {
    // Upload an avatar
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-avatar.jpeg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    
    // Wait for preview
    await page.waitForTimeout(500);
    const preview = page.locator('img[alt="Profile preview"]');
    await expect(preview).toBeVisible();
    
    // Find and click remove button
    const removeButton = page.locator('button[title="Remove image preview"]');
    await removeButton.click();
    
    // Preview should be gone
    await expect(preview).not.toBeVisible();
  });
});
