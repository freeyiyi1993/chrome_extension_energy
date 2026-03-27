import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.resolve(__dirname, '../dist');

async function runTest() {
  console.log('启动浏览器加载插件...');
  const browser = await puppeteer.launch({
    headless: false, // 必须非无头模式才能加载插件
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    // 等待插件加载并获取 background target 从而拿到 extension id
    const backgroundPageTarget = await browser.waitForTarget(
      target => target.type() === 'service_worker' && target.url().endsWith('background.js')
    );
    const extensionUrl = backgroundPageTarget.url();
    const [, , extensionId] = extensionUrl.split('/');

    console.log(`插件已加载，ID: ${extensionId}`);

    const page = await browser.newPage();
    const popupUrl = `chrome-extension://${extensionId}/src/pages/popup/index.html`;
    console.log(`正在访问 Popup: ${popupUrl}`);
    
    await page.goto(popupUrl);
    
    // 等待 React 渲染完成
    await page.waitForSelector('#root > div', { timeout: 5000 });
    console.log('Popup 页面加载成功');

    // 简单交互：打开菜单
    console.log('测试打开菜单...');
    const menuBtn = await page.waitForSelector('.lucide-menu', { timeout: 5000 });
    if (menuBtn) {
      // 找到上层的 div 并点击
      const btn = await menuBtn.evaluateHandle(el => el.closest('div'));
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('菜单交互测试通过');
    }

    console.log('UI 测试全部通过 ✅');
  } catch (error) {
    console.error('UI 测试失败 ❌', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();