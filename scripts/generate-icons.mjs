import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];

const html = (size) => `
<html>
<body style="margin:0;padding:0;width:${size}px;height:${size}px;">
<div style="
  width:${size}px;height:${size}px;
  background:#10b981;
  border-radius:${Math.round(size * 0.2)}px;
  display:flex;align-items:center;justify-content:center;
  font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;
  font-size:${Math.round(size * 0.65)}px;
  font-weight:700;
  color:white;
  line-height:1;
">精</div>
</body>
</html>`;

async function main() {
  const outDir = path.resolve(__dirname, '../extension/public/icons');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const size of sizes) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html(size));
    await page.screenshot({ path: path.join(outDir, `icon${size}.png`), omitBackground: true });
    console.log(`Generated icon${size}.png`);
  }

  // Also generate a 32px favicon for web
  await page.setViewport({ width: 32, height: 32, deviceScaleFactor: 1 });
  await page.setContent(html(32));
  await page.screenshot({ path: path.resolve(__dirname, '../web/favicon.png'), omitBackground: true });
  console.log('Generated web/favicon.png');

  await browser.close();
}

main();
