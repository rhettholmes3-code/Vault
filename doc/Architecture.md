# Vault - 跨平台应用架构设计

> **技术栈**: React Native (Expo SDK 54) + TypeScript + SQLite
> **目标平台**: Android + iOS
> **设计原则**: 小而美、隐私优先、完全离线
> **最后更新**: 2026-05-17

---

## 1. 技术选型总览

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| **框架** | React Native (Expo SDK 54) | 原生渲染体验、Expo 简化构建发布流程 |
| **语言** | TypeScript | 类型安全，适合长期维护 |
| **本地数据库** | expo-sqlite (SQLite) | 系统自带引擎，0 额外体积，支持 SQL 高效查询 |
| **状态管理** | Zustand | 极轻量（< 1KB），API 简洁，适合小型应用 |
| **导航** | Expo Router (文件路由) | 与 Expo 深度集成，类 Next.js 文件路由范式 |
| **图表** | react-native-chart-kit + react-native-svg | 原生性能图表渲染 |
| **图标** | @expo/vector-icons (MaterialIcons) | 与现有 Material Symbols 设计语言一致 |
| **动画** | React Native Reanimated | 60fps 原生线程动画，实现毛玻璃和微动效 |
| **字体** | Manrope + JetBrains Mono | 通过 expo-font 加载自定义字体 |

---

## 2. 目录结构规划

```
Vault/
├── app/                          # Expo Router 文件路由（页面）
│   ├── _layout.tsx               # 根布局（全局 Provider + 字体加载 + DB 初始化）
│   ├── (tabs)/                   # Tab 导航组
│   │   ├── _layout.tsx           # TabBar 配置（3 Tab + FAB）
│   │   ├── index.tsx             # 概览页（账本 + 统计模式切换）
│   │   └── settings.tsx          # 更多/设置页
│   ├── add-entry.tsx             # 记账页（全屏 Modal）
│   └── edit-entry/[id].tsx       # 编辑页（动态路由）
│
├── src/
│   ├── components/               # 可复用 UI 组件
│   │   ├── common/               # 通用基础组件
│   │   │   ├── GlassCard.tsx     # 毛玻璃卡片（iOS BlurView / Android 半透明降级）
│   │   │   ├── SegmentedControl.tsx  # 分段选择器
│   │   │   ├── BottomDrawer.tsx  # 底部抽屉（预算/导出复用）
│   │   │   └── ConfirmModal.tsx  # 确认弹窗
│   │   ├── overview/             # 概览页专用组件
│   │   │   ├── AssetBentoGrid.tsx    # 资产卡片网格（净资产/收入/支出 + Sparkline）
│   │   │   ├── TransactionList.tsx   # 交易列表（SectionList 按日期分组）
│   │   │   └── TransactionItem.tsx   # 单条交易（含滑动删除）
│   │   ├── statistics/           # 统计页专用组件
│   │   │   ├── StatisticsView.tsx    # 统计视图容器（协调子组件）
│   │   │   ├── SummaryBentoGrid.tsx  # 统计汇总网格
│   │   │   ├── TrendChart.tsx        # 趋势折线图（双线 + 预算虚线）
│   │   │   ├── StructureChart.tsx    # 结构柱状图
│   │   │   ├── BudgetRing.tsx        # 预算进度环
│   │   │   └── CategoryRanking.tsx   # 分类排行（含手风琴穿透）
│   │   ├── add-entry/            # 记账页专用组件
│   │   │   ├── EntryForm.tsx     # 记账/编辑表单（统一容器）
│   │   │   ├── CategoryGrid.tsx  # 类别网格选择器
│   │   │   ├── AmountDisplay.tsx # 金额动画展示
│   │   │   ├── NumericKeypad.tsx # 数字键盘 + 运算符
│   │   │   └── SmartChips.tsx    # 备注推荐 Chips
│   │   └── settings/             # 设置页专用组件
│   │       ├── BudgetDrawer.tsx  # 预算设置底部抽屉
│   │       └── ExportDrawer.tsx  # CSV 导出底部抽屉
│   │
│   ├── services/                 # 核心业务逻辑（纯函数，无 UI 依赖）
│   │   ├── TransactionService.ts # 交易 CRUD 操作
│   │   ├── StatisticsService.ts  # 统计计算（从原型提取）
│   │   ├── ExportService.ts      # CSV 导出逻辑
│   │   ├── MockDataService.ts    # 测试数据生成（仅开发环境）
│   │   └── BudgetService.ts      # 预算管理
│   │
│   ├── database/                 # 数据库层
│   │   ├── schema.ts             # 表结构定义 & 迁移
│   │   ├── connection.ts         # SQLite 连接管理（单例）
│   │   └── queries.ts            # 预编译 SQL 查询语句
│   │
│   ├── stores/                   # Zustand 状态管理
│   │   ├── useTransactionStore.ts  # 交易数据 + CRUD 操作
│   │   ├── useStatsStore.ts        # 统计视图状态（周期/图表模式/筛选）
│   │   └── useSettingsStore.ts     # 设置项（预算/主题偏好）
│   │
│   ├── constants/                # 全局常量
│   │   ├── categories.ts         # 分类配置（图标/颜色/名称）
│   │   ├── Colors.ts             # 设计色彩系统（明暗主题 Token）
│   │   ├── config.ts             # App 全局配置
│   │   ├── locales/              # 多语言本地化字典 (zh.json, en.json)
│   │   └── i18n.ts               # 国际化配置 (i18n-js + expo-localization)
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useDatabase.ts        # 数据库初始化 Hook
│   │   └── useTheme.ts           # 主题切换 Hook（系统跟随 + 手动切换）
│   │
│   ├── utils/                    # 工具函数
│   │   ├── dateUtils.ts          # 日期格式化/比较（isToday/isYesterday/formatDate）
│   │   ├── numberUtils.ts        # 金额格式化/计算器求值
│   │   └── csvUtils.ts           # CSV 生成工具
│   │
│   └── types/                    # TypeScript 类型定义
│       ├── transaction.ts        # Transaction / TransactionType
│       └── statistics.ts         # PeriodStats / TrendData / StructureData
│
├── assets/                       # 静态资源
│   ├── fonts/                    # 自定义字体 (Manrope, JetBrains Mono)
│   └── images/                   # App 图标、启动屏
│
├── Prototype/                    # [保留] 原始 HTML 原型（仅供参考）
│   ├── Overview.html             # 概览页面原型
│   ├── AddEntry.html             # 记账页面原型
│   └── Settings.html             # 设置页面原型
│
├── doc/                          # 设计文档
│   ├── Vault.md                  # 项目总览 + 版本历史
│   ├── UX.md                     # 交互设计规范
│   ├── Statistics_Design.md      # 统计模块详设
│   ├── Architecture.md           # 本文档：架构设计
│   └── Migration_Plan.md         # 迁移任务拆分计划
│
├── app.json                      # Expo 应用配置
├── tsconfig.json                 # TypeScript 配置（含 @/ 路径别名）
└── package.json                  # 依赖管理
```

---

## 3. 分层架构

```
┌─────────────────────────────────────────────┐
│                  页面层 (app/)               │
│         Expo Router 文件路由 + 页面组合       │
├─────────────────────────────────────────────┤
│               组件层 (components/)            │
│      可复用 UI 组件，仅负责渲染和用户交互      │
├─────────────────────────────────────────────┤
│            状态层 (stores/ + hooks/)          │
│       Zustand Store + 自定义 Hooks           │
├─────────────────────────────────────────────┤
│             服务层 (services/)               │
│    纯业务逻辑函数，与 UI 框架完全解耦          │
│    （可直接从原型 JS 迁移的核心算法）          │
├─────────────────────────────────────────────┤
│            数据层 (database/)                │
│         SQLite 表结构 + 查询 + 迁移          │
└─────────────────────────────────────────────┘
```

**核心原则**：
- **服务层是纯函数**，不依赖任何 React/RN API，可独立测试
- **组件不直接访问数据库**，必须通过 Store 或 Service
- **Store 是唯一的状态来源**，组件通过 Hook 订阅

---

## 4. 数据库设计 (SQLite)

### 4.1 表结构

```sql
-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,           -- UUID (expo-crypto)
  type        TEXT NOT NULL,              -- 'expense' | 'income'
  amount      REAL NOT NULL,              -- 金额（浮点数）
  category    TEXT NOT NULL,              -- 分类 ID (如 'food', 'salary')
  date        TEXT NOT NULL,              -- ISO 8601 日期字符串
  note        TEXT DEFAULT '',            -- 备注
  created_at  INTEGER NOT NULL,           -- 创建时间戳 (ms)
  updated_at  INTEGER NOT NULL            -- 最后修改时间戳 (ms)
);

-- 索引：按日期查询优化（统计核心查询路径）
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 设置表（键值对存储，替代 LocalStorage）
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Categories table to support custom expenses/incomes categories, drag-and-drop ordering, and toggling active status
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT NOT NULL,              -- Category ID (e.g., 'food', 'custom_123')
  type        TEXT NOT NULL,              -- 'expense' | 'income'
  name        TEXT NOT NULL,              -- Display name (custom string or preset translation key)
  icon        TEXT NOT NULL,              -- MaterialIcons name
  color       TEXT NOT NULL,              -- HEX primary color
  bg          TEXT NOT NULL,              -- HEX light-mode background tint
  is_active   INTEGER NOT NULL DEFAULT 1, -- 1 = active (shown in grid), 0 = candidate (hidden)
  is_custom   INTEGER NOT NULL DEFAULT 0, -- 1 = user custom, 0 = system preset
  sort_order  INTEGER NOT NULL DEFAULT 0, -- sorting order rank
  created_at  INTEGER NOT NULL,           -- creation millisecond timestamp
  PRIMARY KEY (id, type)
);
```

### 4.2 常用查询示例

```sql
-- 月度统计（替代原型中 JS 遍历逻辑，性能提升 10x+）
SELECT
  type,
  SUM(amount) as total
FROM transactions
WHERE date >= '2026-05-01' AND date < '2026-06-01'
GROUP BY type;

-- 分类排行
SELECT
  category,
  SUM(amount) as total,
  COUNT(*) as count
FROM transactions
WHERE type = 'expense'
  AND date >= '2026-05-01' AND date < '2026-06-01'
GROUP BY category
ORDER BY total DESC;
```

### 4.3 数据迁移策略

从原型的 `LocalStorage` (JSON) 迁移到 SQLite：

1. App 首次启动时检测 AsyncStorage 中是否有旧数据
2. 如有，批量 INSERT 到 SQLite 表
3. 迁移完成后清除旧数据并标记 `migration_v1_done`

---

## 5. 从原型提取的核心服务模块

以下是需要从 `Prototype/Overview.html` 中提取并重构为独立 TypeScript 模块的业务逻辑：

| 原型中的位置 | 目标模块 | 核心功能 |
|-------------|----------|----------|
| `StatisticsService` (L1216-1349) | `services/StatisticsService.ts` | `getPeriodStats()`, `getTrendData()`, `getStructureData()` |
| `MockDataService` (L1001-1038) | `services/MockDataService.ts` | `generate()` 生成测试数据 |
| `CATEGORIES` (L977-996) | `constants/categories.ts` | 分类配置（ID、名称、图标、颜色） |
| `getCatColorHex()` (L1352-1360) | `constants/categories.ts` | 分类颜色映射 |
| `getPercentChange()` (L1373-1376) | `utils/numberUtils.ts` | 同比/环比计算 |
| `isToday()` / `isYesterday()` / `formatDate()` (L1196-1213) | `utils/dateUtils.ts` | 日期判断和格式化 |
| CSV 导出逻辑 (Settings.html) | `services/ExportService.ts` | CSV 生成和文件保存 |
| 预算逻辑 (Settings.html) | `services/BudgetService.ts` | 预算 CRUD 和健康度计算 |

---

## 6. 原型到正式版的对应关系

| 原型页面 | 正式版路由 | 核心组件 |
|----------|-----------|----------|
| `Overview.html` — 账本 Tab | `app/(tabs)/index.tsx` (默认) | `AssetBentoGrid` + `TransactionList` |
| `Overview.html` — 月度/年度 Tab | `app/(tabs)/index.tsx` (切换) | `StatisticsView` → `SummaryBentoGrid` + `TrendChart` + `CategoryRanking` |
| `AddEntry.html` | `app/add-entry.tsx` (Modal) | `EntryForm` → `CategoryGrid` + `NumericKeypad` |
| `AddEntry.html?id=xxx` | `app/edit-entry/[id].tsx` | 复用 EntryForm 组件 |
| `Settings.html` | `app/(tabs)/settings.tsx` | `BudgetDrawer` + `ExportDrawer` |

---

## 7. 设计系统迁移

原型中的 Tailwind CSS 设计 Token 需要转化为 React Native StyleSheet：

| Tailwind (原型) | React Native (正式版) | 说明 |
|-----------------|----------------------|------|
| `.glass` (backdrop-filter) | `expo-blur` BlurView | 毛玻璃效果 |
| `animate-slide-up` | Reanimated `FadeInDown` | 入场动画 |
| `active:scale-95` | Reanimated `useAnimatedStyle` | 按压缩放反馈 |
| `grid grid-cols-6` | `<View style={{flexDirection, flexWrap}}` | Bento Grid 布局 |
| `dark:bg-xxx` | `useColorScheme()` + 条件样式 | 深色模式 |
| Manrope / JetBrains Mono | `expo-font` 自定义字体加载 | 字体 |

---

## 8. App 体积控制策略

| 策略 | 预期效果 |
|------|----------|
| 使用 Expo 托管构建 (EAS Build) | 自动 Tree-shaking，移除未用模块 |
| SQLite 使用系统内置引擎 | 0 额外体积 |
| Zustand 替代 Redux | 节省 ~50KB |
| 按需加载图标 (仅用到的子集) | 节省 ~200KB |
| 字体子集化 (仅中文常用字 + 数字) | 节省 ~500KB |
| **目标安装包体积** | **< 15MB (Android APK)** |

---

## 9. 全局研发指引与多语言 (i18n) 铁律

为保证 Vault 长期版本迭代的**高稳定性、可恢复性、可追溯性与全球化体验**，项目开发必须严格遵守以下工程规范：

### 9.1 多语言 (i18n) 全局铁律
1. **零硬编码字符串**：任何新增的 UI 文案、按钮标签、Toast/Alert 提示、通知栏推送标题与正文、备份/恢复进度与确认弹窗等，严禁直接在代码中编写中文字符串或英文字符串。
2. **双语 100% 同步对齐**：所有新增文案必须同时在 `src/constants/locales/zh.json` 和 `src/constants/locales/en.json` 中声明相同的键（Key）。提测或构建前需通过自动扫描脚本或 TypeScript 校验，杜绝任何缺失或遗漏。
3. **参数化模板支持**：对于带动态数据的文案（如金额、类别名、记账条数、结余等），统一使用 i18n 插值占位符，例如：
   - `notification.weekly_summary`: "上周总支出 ¥%{amount}，其中【%{category}】开销最高。新的一周加油！"
   - `notification.weekly_summary_en`: "Last week's total expense was %{currency}%{amount}, with %{category} being the highest. Have a great week!"

### 9.2 v1.1 架构扩展：通知与数据安全系统

#### A. 本地智能提醒与周期分析系统 (`services/NotificationService.ts`)
- **完全离线调度**：采用 `expo-notifications` 注册本地定时计划通知（Local Scheduled Notifications），设备不联网亦可精准触发，严守隐私底线。
- **调度模块职责**：
  1. `scheduleDailyReminders()`: 每天 12:30（午餐提醒）与 21:30（晚间复盘）。
  2. `checkDailyStatusAndFormat()`: 若当日已记过账，晚间触发温和复盘文案（"今天已记 %{count} 笔账，看看是否还有遗漏的开销 🌙"）。
  3. `scheduleWeeklyReport()`: 每周一 09:00 分析上周 SQLite 数据，汇总金额与 TOP1 类别。
  4. `scheduleMonthlyReport()`: 每月 1 号 09:30 分析上月支出总额与预算结余。
- **权限与状态管理**：配置状态持久化在 `useSettingsStore` 中，初次开启主动请求系统通知权限。

#### B. 可追溯、可恢复的全量数据备份与灾备系统 (`services/BackupService.ts`)
- **可追溯数据协议 (`Schema v1`)**：
  - 结构包含：`schemaVersion: 1`、`metadata`（时间戳、App版本、条数、收支 Checksum）、`settings`（偏好/预算/通知）、`categories`（物理分类定义）、`transactions`（全量流水）。
- **零破坏原子还原流程**：
  1. **安全自动快照 (Safety Auto-Snapshot)**：在执行覆盖导入前，系统自动在本地沙盒持久化一份 `auto_safety_snapshot.json`，用户若误选文件可随时一键安全撤销还原。
  2. **校验与审计预览**：解析拾取的 JSON，核验 Checksum 与 Schema 版本，弹出审计确认框（包含笔数、金额、备份生成时间）。
  3. **SQLite 原子事务写入**：在单个 Database Transaction 中执行数据清理与重新灌装，若中途发生任何异常自动 `ROLLBACK`，旧数据毫发无损。
- **文件交互**：利用 `expo-sharing` 调起原生系统分享，利用 `expo-document-picker` 拾取备份文件。

---

## 10. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.1.0-spec | 2026-10-25 | 确立 v1.1 架构设计规范：建立全局 i18n 铁律、本地离线智能提醒机制、以及带自动快照与原子事务的可追溯数据备份系统。 |
| v1.2 | 2026-06-27 | 新增类别自定义功能支持，包括 SQLite 表结构 categories 设计、useCategoryStore 状态控制及 reorder/active 逻辑。 |
| v1.0 | 2026-05-17 | 初始版本：确立 React Native + Expo + SQLite 技术栈 |
| v1.1 | 2026-05-17 | 重整文档：移除与 Migration_Plan 重复的 Phase 规划，纯化为架构设计文档；更新目录结构反映实际项目布局 |
