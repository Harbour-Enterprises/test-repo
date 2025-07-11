import { test, expect,  } from '@playwright/test';

test.describe('simple list', () => {
  test('should look like a list', async ({ page }) => {
    await page.goto('http://localhost:4173/');
    await page.locator('input[type="file"]').setInputFiles('./src/tests/e2e/documents/blank-docx.docx');
    await page.waitForSelector('div.super-editor');
    await expect(page.locator('div.super-editor')).toBeVisible();

    // Locate the first "p" element
    const firstParagraph = page.locator('div.super-editor p').first();
    await firstParagraph.click();
    await page.keyboard.type('1');
    await page.keyboard.type('.')
    await page.keyboard.press('Space')
    await page.keyboard.type('First item');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second item');

    await expect(page).toHaveScreenshot({path: 'lists.png', fullPage: false});
  });
});


// test.describe('nested list', () => {
//   test('should look like a nested list', async ({ page }) => {
//     await page.goto('http://localhost:4173/');
//     await page.locator('input[type="file"]').setInputFiles('./src/tests/e2e/documents/blank-docx.docx');
//     await page.waitForSelector('div.super-editor');
//     // Locate the first "p" element
//     const firstParagraph = page.locator('div.super-editor p').first();
//     await firstParagraph.click();
//     await page.keyboard.type('1.');
//     await page.keyboard.press('Space');
//     await page.keyboard.type('First item');
//     await page.keyboard.press('Enter');
//     await page.keyboard.press('Tab')
//     await page.keyboard.type('Nested item');


//     await expect(page).toHaveScreenshot({ path: 'nested-list.png', fullPage: false });
//   });
// });

// test.describe('doubly nested list', () => {
//   test('should look like a doubly nested list', async ({ page }) => {
//     await page.goto('http://localhost:4173/');
//     await page.locator('input[type="file"]').setInputFiles('./src/tests/e2e/documents/blank-docx.docx');
//     await page.waitForSelector('div.super-editor');

//     await page.locator('div.super-editor').click();
//     await page.keyboard.type('1.');
//     await page.keyboard.press('Space');
//     await page.keyboard.type('First item');
//     await page.keyboard.press('Enter');
//     await page.keyboard.press('Tab');
//     await page.keyboard.type('Nested item');
//     await page.keyboard.press('Enter');
//     await page.keyboard.press('Tab');
//     await page.keyboard.type('Nested item');

//     await expect(page).toHaveScreenshot('doubly-nested-list.png');
//   });
// });
