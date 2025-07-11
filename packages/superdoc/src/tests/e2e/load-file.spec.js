import { test, expect } from '@playwright/test';

test.describe('load file', () => {
  test('should load a simple file in less than 2s', async ({ page }) => {
    test.setTimeout(2000);
    await page.goto('http://localhost:4173/');
    // Select the "simple.docx" file
    await page.locator('input[type="file"]').setInputFiles('./src/tests/e2e/documents/simple-docx.docx');
    // Wait for the file to be loaded
    await page.waitForSelector('div.super-editor');
    // Assert that the file is loaded
    await expect(page.locator('div.super-editor')).toBeVisible();
    
    // Assert the content of the document is displayed
    await expect(page.locator('div.super-editor')).toContainText('This is a simple docx file');
  });
});