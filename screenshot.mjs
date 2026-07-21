import puppeteer from 'puppeteer';

const url = process.argv[2];
const path = process.argv[3];

if (!url || !path) {
  console.error("Usage: node screenshot.mjs <url> <output_path>");
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport based on page type
  if (url.includes('admin')) {
    await page.setViewport({ width: 1280, height: 800 });
  } else {
    await page.setViewport({ width: 390, height: 844, isMobile: true });
  }

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait extra time for React to render
  await new Promise(r => setTimeout(r, 5000));
  
  console.log(`Taking screenshot...`);
  await page.screenshot({ path: path, fullPage: true });

  await browser.close();
  console.log(`Screenshot saved to ${path}`);
})();
