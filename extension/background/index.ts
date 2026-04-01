import { type StorageData } from '../../shared/types';
import { initAppData } from '../../shared/ticker';
import { handleTick } from './tickHandler';

const storageSet = (data: Partial<StorageData>) =>
  chrome.storage.local.set(data);

chrome.runtime.onInstalled.addListener(async () => {
  const data = (await chrome.storage.local.get(null)) as StorageData;
  await initAppData(data, storageSet);
  chrome.alarms.create("tick", { periodInMinutes: 1 });
});

// Google OAuth: 使用 chrome.identity.getAuthToken，
// Chrome 内部处理 OAuth 流程，无需 redirect URI
// 先清除缓存 token 再获取，避免拿到过期 token 导致需要点两次
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GOOGLE_LOGIN') {
    // 先尝试获取（可能是缓存的），拿到后清除再重新获取一个新鲜 token
    chrome.identity.getAuthToken({ interactive: false })
      .then(result => {
        const cached = typeof result === 'string' ? result : result.token;
        if (cached) {
          return chrome.identity.removeCachedAuthToken({ token: cached });
        }
      })
      .catch(() => { /* 无缓存 token，忽略 */ })
      .then(() => chrome.identity.getAuthToken({ interactive: true }))
      .then(result => {
        const token = typeof result === 'string' ? result : result.token;
        if (!token) {
          sendResponse({ error: '未获取到 token' });
          return;
        }
        sendResponse({ accessToken: token });
      })
      .catch(err => {
        sendResponse({ error: err.message ?? String(err) });
      });
    return true;
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    const data = (await chrome.storage.local.get(null)) as StorageData;
    const finishUrl = chrome.runtime.getURL("extension/pages/finish/finish.html");
    const action = handleTick(data, Date.now(), finishUrl);

    if (Object.keys(action.toWrite).length > 0) {
      await storageSet(action.toWrite);
    }

    // 必须 await tabs.create，否则 MV3 Service Worker 可能在 tab 创建前终止
    for (const url of action.openTabs) {
      await chrome.tabs.create({ url });
    }
  }
});
