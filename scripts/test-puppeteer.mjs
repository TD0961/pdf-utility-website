import puppeteer from 'puppeteer-core';
import { join } from 'node:path';
import { readdirSync, mkdirSync } from 'node:fs';

const downloadsDir = join(process.cwd(), 'tests', 'fixtures', 'browser', 'downloads');
mkdirSync(downloadsDir, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadsDir,
    eventsEnabled: true
  });

  console.log('Navigating to http://127.0.0.1:3456/pdf-tools/merge-pdf...');
  await page.goto('http://127.0.0.1:3456/pdf-tools/merge-pdf', { waitUntil: 'networkidle0' });
  console.log('Page loaded! Title:', await page.title());

  const fileInput = await page.$('input[type="file"]');
  console.log('Found input element:', Boolean(fileInput));

  const fixture1 = join(process.cwd(), 'tests', 'fixtures', 'browser', 'sample-doc.pdf');
  const fixture2 = join(process.cwd(), 'tests', 'fixtures', 'browser', 'sample-doc-2.pdf');
  await fileInput.uploadFile(fixture1, fixture2);
  console.log('Uploaded files!');

  // Wait for button
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent && b.textContent.includes('Merge PDFs'));
  }, { timeout: 5000 });

  console.log('Merge button visible! Clicking...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Merge PDFs'));
    btn.click();
  });

  console.log('Waiting for download link...');
  await page.waitForSelector('a[download]', { timeout: 10000 });
  const downloadLink = await page.$('a[download]');
  const fileName = await page.evaluate(el => el.getAttribute('download'), downloadLink);
  console.log('Download link ready! Filename:', fileName);

  await downloadLink.click();
  console.log('Clicked download link!');

  await new Promise(r => setTimeout(r, 1000));
  const files = readdirSync(downloadsDir);
  console.log('Downloaded files:', files);

  await browser.close();
  console.log('Puppeteer test SUCCESS!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
