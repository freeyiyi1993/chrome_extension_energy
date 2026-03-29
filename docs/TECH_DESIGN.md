# 精力管理可视化 - 技术设计文档

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │   Chrome Extension   │     │         Web App              │  │
│  │  ┌────────────────┐  │     │  ┌────────────────────────┐  │  │
│  │  │ PopupApp.tsx   │  │     │  │ WebApp.tsx             │  │  │
│  │  │ (弹窗入口)     │  │     │  │ (网页入口)             │  │  │
│  │  └────────────────┘  │     │  └────────────────────────┘  │  │
│  │  ┌────────────────┐  │     │  ┌────────────────────────┐  │  │
│  │  │ FinishApp.tsx  │  │     │  │ AuthPanel.tsx          │  │  │
│  │  │ (全屏提醒)     │  │     │  │ (登录面板)             │  │  │
│  │  └────────────────┘  │     │  └────────────────────────┘  │  │
│  │  ┌────────────────┐  │     │                              │  │
│  │  │ SyncPanel.tsx  │  │     │                              │  │
│  │  │ (同步面板)     │  │     │                              │  │
│  │  └────────────────┘  │     │                              │  │
│  └──────────────────────┘     └──────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        共享组件层 (shared/components/)           │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │MainDashboard │ │ StatsPage│ │RulesPage │ │SettingsPage  │   │
│  │(主面板)      │ │(统计页)  │ │(精力规则 │ │(设置页)      │   │
│  │              │ │          │ │+同步规则)│ │              │   │
│  └──────────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────────┐                                               │
│  │  MenuPanel   │                                               │
│  │ (侧边导航)   │                                               │
│  └──────────────┘                                               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        存储抽象层                                │
│  ┌─────────────────────────────┴──────────────────────────┐     │
│  │              StorageInterface (shared/storage.ts)       │     │
│  │              get(keys) / set(data)                      │     │
│  └──────────┬──────────────────────────────┬──────────────┘     │
│             │                              │                     │
│  ┌──────────┴──────────┐     ┌─────────────┴───────────┐       │
│  │ chrome.storage.local│     │     localStorage         │       │
│  │ (extension/storage) │     │   (web/storage.ts)       │       │
│  └─────────────────────┘     └─────────────────────────┘       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        后台引擎层                                │
│  ┌─────────────────────┐     ┌─────────────────────────┐       │
│  │ Service Worker       │     │ web-ticker.ts            │       │
│  │ (chrome.alarms)      │     │ (setInterval 60s)        │       │
│  │ - 精力衰减           │     │ - 精力衰减               │       │
│  │ - 日期翻转           │     │ - 日期翻转               │       │
│  │ - 番茄倒计时         │     │ - 番茄倒计时             │       │
│  │ - 低精力提醒(新标签) │     │ - 低精力提醒(当前页覆盖) │       │
│  │                      │     │ - 自动云推送             │       │
│  └─────────────────────┘     └─────────────────────────┘       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                       Firebase 云服务                            │
│  ┌─────────────────────┐     ┌─────────────────────────┐       │
│  │ Firebase Auth        │  │ Firestore            │  │ Hosting            │  │
│  │ - Google OAuth       │  │ - 用户数据存储        │  │ - Web 版静态托管    │  │
│  │ - 用户身份管理       │  │ - 跨设备同步          │  │ - SPA 路由重写      │  │
│  └─────────────────────┘  └──────────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 技术栈选型

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 19 | 组件化开发，双端复用 UI 逻辑 |
| TypeScript | 5.9 | 严格类型检查，减少运行时错误 |
| Vite | 8 | 快速构建，支持多入口配置，Chrome 扩展友好 |
| Tailwind CSS | 3 | 原子类 CSS，组件内样式不冲突，构建体积小 |
| Firebase Auth | 12.x | Google 登录开箱即用，免服务端 |
| Firestore | 12.x | NoSQL 文档数据库，实时同步，免运维 |
| Chart.js | 4.x | 轻量图表库，满足折线图需求 |
| Lucide React | 1.x | 图标库，tree-shakable，体积小 |
| Chrome MV3 | - | 最新扩展标准，Service Worker 后台 |

## 3. 数据结构设计

### 3.1 本地存储结构 (StorageData)

```typescript
interface StorageData {
  config: Config
  taskDefs: CustomTaskDef[]
  state: AppState
  tasks: Tasks
  logs: CompactLog[]
  statsHistory: StatsSnapshot[]
}
```

### 3.2 核心类型定义

```typescript
// 系统配置
interface Config {
  maxEnergy: number       // 精力上限 (默认 100)
  minEnergy: number       // 精力下限 (默认 0)
  smallHeal: number       // 小恢复量 (默认 3)
  midHeal: number         // 中恢复量 (默认 8)
  bigHealRatio: number    // 大恢复比例 (默认 1.0, 按睡眠时长缩放)
  decayRate: number       // 每小时衰减量 (默认 5)
  penaltyMultiplier: number // 惩罚倍数 (默认 1.5)
  perfectDayBonus: number // 完美一天奖励 (默认 1)
  badDayPenalty: number   // 糟糕一天惩罚 (默认 1)
}

// 每日状态
interface AppState {
  logicalDate: string     // 逻辑日期 "YYYY-MM-DD"
  energy: number          // 当前精力值
  maxEnergy: number       // 当日精力上限
  lastUpdateTime: number  // 最后更新时间戳
  lowEnergyReminded: boolean
  energyConsumed: number  // 当日总消耗
  pomodoro: PomodoroState
}

// 番茄钟状态
interface PomodoroState {
  running: boolean
  timeLeft: number        // 剩余秒数
  count: number           // 今日完成数
  perfectCount: number    // 今日完美数
  consecutiveCount: number // 连续完成数
}

// 任务记录 (动态键值)
interface Tasks {
  [key: string]: number | boolean | null
}

// 自定义任务定义
interface CustomTaskDef {
  id: string              // 唯一标识 (内置: sleep/exercise/... 自定义: 自动生成)
  name: string            // 显示名称
  icon: string            // emoji 图标
  type: 'counter' | 'boolean' | 'number'
  healLevel: 'none' | 'small' | 'mid' | 'big'
  maxCount?: number       // counter 类型的上限
  unit?: string           // number 类型的单位
  placeholder?: string    // number 类型的占位文本
  builtin: boolean        // 是否内置任务
  enabled: boolean        // 是否启用
  countsForPerfectDay: boolean  // 是否计入完美一天
}

// 紧凑日志 [时间戳, 动作类型, 值, 精力变化]
type CompactLog = [number, number, number, number]

// 统计快照 (每日结算时记录)
interface StatsSnapshot {
  date: string
  maxEnergy: number
  energyConsumed: number
  pomoCount: number
  perfectCount: number
}
```

### 3.3 Firestore Schema

```
Firestore Root
└── users (collection)
    └── {userId} (document)
        ├── config: Config
        ├── taskDefs: CustomTaskDef[]
        ├── state: AppState
        ├── tasks: Tasks
        ├── logs: string           // JSON.stringify(CompactLog[])
        │                          // Firestore 不支持嵌套数组，序列化存储
        └── statsHistory: StatsSnapshot[]
```

**注意**: `logs` 字段在 Firestore 中以 JSON 字符串存储，因为 Firestore 不原生支持嵌套数组。读写时通过 `logsToFirestore()` / `logsFromFirestore()` 转换。

## 4. 跨端同步方案

### 4.1 同步策略

```
┌──────────────────────────────────────────────────┐
│                  同步时机                         │
├──────────────────────────────────────────────────┤
│ 登录成功     → 自动拉取 (pullAndMerge)           │
│ 每 60 秒     → 自动推送 (syncToCloud)            │
│ 登出前       → 自动推送 (syncToCloud)            │
│ 手动拉取     → 智能合并 (pullAndMerge)           │
│ 强制拉取     → 云端覆盖 (forcePull)              │
│ 手动推送     → 本地覆盖云端 (syncToCloud)        │
└──────────────────────────────────────────────────┘
```

### 4.2 智能合并逻辑 (pullAndMerge)

```
本地 lastUpdateTime  vs  云端 lastUpdateTime
         │                        │
         ├── 本地更新 → 保留本地   │
         ├── 云端更新 → 使用云端   │
         └── 相同 → 无操作        │
```

### 4.3 冲突处理

采用 **Last-Write-Wins** 策略：
- 以 `state.lastUpdateTime` 为判据
- 更新时间更晚的一方胜出
- 不做字段级合并，整体替换

### 4.4 数据流

```
  本地操作 (打卡/番茄/衰减)
       │
       ▼
  更新本地存储 + 更新 lastUpdateTime
       │
       ▼ (每 60s)
  syncToCloud() ──→ Firestore users/{uid}
       │
       ▼
  其他设备 pullAndMerge() ←── Firestore users/{uid}
       │
       ▼
  比较 lastUpdateTime → 取更新的一方
       │
       ▼
  更新本地存储 + 刷新 UI
```

## 5. Firebase Auth 流程

### 5.1 Web 端登录

```
用户点击「Google 登录」
       │
       ▼
signInWithPopup(auth, googleProvider)
       │
       ▼
Firebase 返回 UserCredential
       │
       ▼
保存 user.uid → 拉取云端数据
       │
       ▼
启动自动推送定时器 (60s)
```

### 5.2 Chrome 扩展登录

```
用户点击「Google 登录」
       │
       ▼
构造 Google OAuth URL (client_id, redirect_uri, scopes)
       │
       ▼
chrome.identity.launchWebAuthFlow({ url, interactive: true })
       │
       ▼
回调拿到 redirect URL → 解析 access_token
       │
       ▼
GoogleAuthProvider.credential(null, accessToken)
       │
       ▼
signInWithCredential(auth, credential)
       │
       ▼
Firebase 返回 UserCredential
       │
       ▼
保存 user.uid → 拉取云端数据
       │
       ▼
启动自动推送定时器 (60s)
```

**为什么扩展不用 signInWithPopup?**
MV3 的 CSP 禁止加载外部脚本（`apis.google.com`），`signInWithPopup` 依赖该脚本，因此改用 `chrome.identity` 原生 OAuth 流程。

## 6. 关键接口定义

### 6.1 StorageInterface

```typescript
interface StorageInterface {
  get(keys: string[] | null): Promise<Partial<StorageData>>
  set(data: Partial<StorageData>): Promise<void>
}
```

所有业务组件通过 props 接收 `storage: StorageInterface`，不直接依赖 chrome.storage 或 localStorage。

### 6.2 云同步函数

```typescript
// 推送到云端 (本地 → Firestore)
async function syncToCloud(storage: StorageInterface): Promise<void>

// 智能拉取 (Firestore → 本地，比较时间戳)
async function pullAndMerge(storage: StorageInterface): Promise<void>

// 强制拉取 (Firestore → 本地，直接覆盖)
async function forcePull(storage: StorageInterface): Promise<void>
```

### 6.3 组件 Props 接口

```typescript
// MainDashboard
interface MainDashboardProps {
  data: StorageData
  storage: StorageInterface
  onOpenMenu: () => void
  onDataChange: () => void
  flat?: boolean           // true = 平铺样式 (Web), false = 卡片样式 (扩展)
}

// SettingsPage
interface SettingsPageProps {
  storage: StorageInterface
  onBack: () => void
}

// StatsPage
interface StatsPageProps {
  storage: StorageInterface
  onBack: () => void
}

// RulesPage
interface RulesPageProps {
  storage: StorageInterface
  onBack: () => void
}

// MenuPanel
interface MenuPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: PageType) => void
}
```

### 6.4 后台 Tick 逻辑接口

```typescript
// 每分钟执行一次
async function tick(storage: StorageInterface): Promise<void>
// 内部逻辑:
// 1. 检测日期翻转 → 结算完美/糟糕一天（无日志则节假日豁免，不扣精力上限）
// 2. 精力衰减 → 计算 decay + 分时段餐食惩罚
//    (10:00 后未吃 1 餐 / 14:00 后未吃 2 餐 / 19:00 后未吃 3 餐 → 乘 penaltyMultiplier)
// 3. 番茄倒计时 → 检测完成/强制休息
// 4. 低精力检测 → 触发提醒
```

## 7. 构建架构

### 7.1 项目根目录总览

```
项目根目录
├── extension/                 # Chrome 扩展端
│   ├── vite.config.ts         #   扩展 Vite 构建配置
│   ├── background/            #   Service Worker
│   ├── pages/popup/           #   弹窗入口
│   ├── pages/finish/          #   全屏提醒入口
│   ├── pages/login/           #   登录页入口
│   ├── components/            #   SyncPanel 等扩展专属组件
│   ├── storage.ts             #   chrome.storage.local 实现
│   └── public/manifest.json   #   Manifest V3
│
├── web/                       # Web 端
│   ├── vite.config.ts         #   Web Vite 构建配置
│   ├── WebApp.tsx             #   Web 版主组件
│   ├── main.tsx               #   React 入口
│   ├── index.html             #   HTML 模板
│   ├── storage.ts             #   localStorage 实现
│   ├── web-ticker.ts          #   setInterval 替代 chrome.alarms
│   └── components/            #   AuthPanel 等 Web 专属组件
│
├── shared/                    # 双端共享
│   ├── types/index.ts         #   TypeScript 类型定义
│   ├── firebase.ts            #   Firebase 初始化
│   ├── storage.ts             #   StorageInterface 抽象 + 云同步函数
│   ├── utils/time.ts          #   时间工具
│   ├── components/            #   MainDashboard, StatsPage, RulesPage, SettingsPage, MenuPanel
│   └── public/                #   共享静态资源 (图标等)
│
├── tests/                     # 单元测试 + UI 自动化测试
├── docs/                      # 项目文档
├── dist/                      # Chrome 扩展构建产物
├── dist-web/                  # Web 版构建产物
│
├── tsconfig.json              # TypeScript 根配置 (引用 app + node)
├── tsconfig.app.json          # 应用代码 (ES2023, strict, include: extension/ web/ shared/)
├── tsconfig.node.json         # Node 工具 (vite config 等)
├── tailwind.config.js         # Tailwind (扫描 extension/ web/ shared/)
├── postcss.config.js          # PostCSS
├── eslint.config.js           # ESLint
├── vitest.config.ts           # Vitest 测试
├── package.json               # 依赖 + 脚本
└── firebase.json              # Firebase Hosting 配置
```

### 7.2 Chrome 扩展构建

```
Vite (extension/vite.config.ts)
├── 入口:
│   ├── extension/pages/popup/index.html  → popup 页面
│   ├── extension/pages/login/index.html  → login 页面
│   ├── extension/pages/finish/finish.html → finish 页面
│   └── extension/background/index.ts     → background.js
├── 输出: dist/
│   ├── background.js          (Service Worker)
│   ├── extension/pages/popup/index.html
│   ├── extension/pages/finish/finish.html
│   ├── assets/                (JS/CSS bundles)
│   └── manifest.json          (从 extension/public/ 复制)
└── 特殊处理:
    └── background 入口 → 不拆分 chunk，单文件输出
```

### 7.3 Web 版构建

```
Vite (web/vite.config.ts)
├── 入口: web/index.html
├── 输出: dist-web/
│   ├── index.html
│   └── assets/ (JS/CSS bundles)
└── 开发服务器: localhost:3000
```

### 7.4 npm 脚本

```bash
npm run build             # tsc + vite build --config extension/vite.config.ts → dist/
npm run build:web         # tsc + vite build --config web/vite.config.ts → dist-web/
npm run dev:web           # vite --config web/vite.config.ts (localhost:3000)
npm run deploy:web        # build:web + firebase deploy
npm run test              # vitest
npm run lint              # eslint
```
