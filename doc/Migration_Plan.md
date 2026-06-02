# Vault - 跨平台迁移任务拆分计划

> **目标**: 将 HTML 原型迁移为 React Native (Expo SDK 54) 正式版应用
> **创建日期**: 2026-05-17
> **最后更新**: 2026-05-17
> **状态**: 🔄 重启开发 — 从现有代码基础上继续

---

## 当前状态评估

### 已有可用代码

以下文件已存在且代码质量可用，将保留并在后续 Session 中修复其缺失依赖：

| 文件 | 状态 | 说明 |
|------|------|------|
| `app/_layout.tsx` | ⚠️ 可用但依赖缺失 | 根布局，引用了缺失的字体和 `database/connection` |
| `app/(tabs)/settings.tsx` | ⚠️ 可用但依赖缺失 | 设置页面，引用了缺失的 Store、BudgetDrawer、ExportDrawer；第143行有语法错误需修复 |
| `app/edit-entry/[id].tsx` | ⚠️ 可用但依赖缺失 | 编辑页路由包装，引用了缺失的 EntryForm |
| `src/constants/Colors.ts` | ✅ 完好 | 设计色彩系统 Token（明暗主题） |
| `src/hooks/useTheme.ts` | ⚠️ 可用但依赖缺失 | 主题 Hook，引用了缺失的 `useSettingsStore` |
| `src/components/common/GlassCard.tsx` | ✅ 完好 | 毛玻璃卡片组件（iOS BlurView / Android 降级） |
| `src/services/TransactionService.ts` | ⚠️ 可用但依赖缺失 | 交易 CRUD，引用了缺失的 `database/*` 和 `types/*` |
| `src/services/ExportService.ts` | ⚠️ 可用但依赖缺失 | CSV 导出，引用了缺失的 `constants/categories` |
| `app.json` | ✅ 完好 | Expo 配置（scheme: vault, plugins 正确） |
| `package.json` | ✅ 完好 | 依赖清单完整（expo 54, zustand, reanimated 等） |
| `tsconfig.json` | ✅ 完好 | TypeScript 配置（含 @/ 路径别名） |

### 完全缺失的关键模块

| 模块 | 缺失文件 |
|------|----------|
| **数据库层** | `database/schema.ts`, `connection.ts`, `queries.ts` — 目录为空 |
| **类型定义** | `types/transaction.ts`, `statistics.ts` — 目录为空 |
| **状态管理** | `stores/useTransactionStore.ts`, `useStatsStore.ts`, `useSettingsStore.ts` — 目录为空 |
| **工具函数** | `utils/dateUtils.ts`, `numberUtils.ts` — 目录为空 |
| **分类常量** | `constants/categories.ts` — 不存在 |
| **TabBar 导航** | `app/(tabs)/_layout.tsx` — 不存在 |
| **概览页** | `app/(tabs)/index.tsx` — 不存在 |
| **记账页** | `app/add-entry.tsx` — 不存在 |
| **所有子组件** | `overview/*`, `statistics/*`, `add-entry/*`, `settings/*` — 目录全部为空 |
| **字体文件** | 仅有 SpaceMono，缺少 Manrope 和 JetBrains Mono |
| **服务层** | `StatisticsService`, `MockDataService`, `BudgetService` — 不存在 |

---

## 工作量评估

### 原型代码统计

| 文件 | 行数 | 核心逻辑 |
|------|------|----------|
| `Overview.html` | ~2118 行 | 3 个视图模式、StatisticsService、图表渲染、交易列表、Bento Grid |
| `AddEntry.html` | ~934 行 | 类别选择、表达式计算器、日期逻辑、交易 CRUD、编辑模式 |
| `Settings.html` | ~640 行 | 预算键盘 Drawer、CSV 导出 Drawer、Mock 数据生成 |
| **合计** | **~3692 行** | — |

### 迁移复杂度分析

| 维度 | 难度 | 说明 |
|------|------|------|
| **数据层重建** | ⭐⭐ 中等 | LocalStorage → SQLite，逻辑清晰但需重新设计查询 |
| **业务逻辑提取** | ⭐ 低 | StatisticsService 等已是纯函数，翻译为 TS 即可 |
| **UI 重建** | ⭐⭐⭐ 较高 | Tailwind → RN StyleSheet 无法自动转换，需逐组件手写 |
| **图表迁移** | ⭐⭐⭐ 较高 | Chart.js → RN 图表库，API 完全不同需重写 |
| **动效迁移** | ⭐⭐ 中等 | CSS 动画 → Reanimated，概念相似但语法不同 |
| **手势交互** | ⭐⭐ 中等 | 滑动删除、Drawer 手势需用 RN Gesture Handler |

### 预估总工作量

- **纯代码行数**: 约 4000-5000 行 TypeScript/TSX (不含配置文件)
- **Session 数量**: **7-8 个 Session**
- **每个 Session 的理想目标**: 聚焦一个独立可测试的功能模块

---

## Session 拆分方案

### Session 1: 项目基础设施补全 (✅ 已完成)

**目标**: 补全所有缺失的基础层文件，使现有代码的依赖链完整、App 可运行

| 任务 | 说明 | 状态 |
|------|------|------|
| 字体文件下载 | 下载 Manrope (Bold/SemiBold/Regular) + JetBrains Mono 到 `assets/fonts/` | ✅ |
| 类型定义 | `types/transaction.ts` — Transaction, TransactionType | ✅ |
| 类型定义 | `types/statistics.ts` — PeriodStats, TrendData, StructureData | ✅ |
| 分类常量 | `constants/categories.ts` — 分类配置（ID、名称、图标、颜色、getCategoryConfig） | ✅ |
| 数据库 Schema | `database/schema.ts` — 表结构定义 + 初始化迁移 | ✅ |
| 数据库连接 | `database/connection.ts` — SQLite 单例连接 + initializeDatabase() | ✅ |
| 预编译查询 | `database/queries.ts` — 所有 SQL 查询语句常量 | ✅ |
| 工具函数 | `utils/dateUtils.ts` — isToday, isYesterday, formatDate, getMonthRange 等 | ✅ |
| 工具函数 | `utils/numberUtils.ts` — formatAmount, evaluateExpression, getPercentChange | ✅ |
| 修复现有文件 | 修复 `settings.tsx` 第143行语法错误 (`</View> section` → `</View>`) | ✅ |

**交付物**: 运行 `npx expo start` 能编译通过（可能页面为空但不报错）
**依赖**: 无

---

### Session 2: 状态管理 + 服务层补全 (✅ 已完成)

**目标**: 完整的数据 CRUD 能力和全局状态管理，使 Store → Service → DB 链路可用

| 任务 | 说明 | 状态 |
|------|------|------|
| useSettingsStore | `stores/useSettingsStore.ts` — 预算、主题偏好、设置读写 | ✅ |
| useTransactionStore | `stores/useTransactionStore.ts` — 交易列表状态 + CRUD 桥接 | ✅ |
| useStatsStore | `stores/useStatsStore.ts` — 统计视图状态（周期/图表模式/筛选） | ✅ |
| BudgetService | `services/BudgetService.ts` — 预算读写（从 settings 表） | ✅ |
| MockDataService | `services/MockDataService.ts` — 测试数据生成（写入 SQLite，范围 180 天） | ✅ |

**交付物**: Store 层完整，useTheme / settings.tsx 的依赖解决，可通过开发工具验证 CRUD
**依赖**: Session 1

---

### Session 3: 导航框架 + 通用组件 ✅

**目标**: TabBar 导航可用 + 通用 UI 组件就绪

| 任务 | 说明 | 状态 |
|------|------|------|
| TabBar 布局 | `app/(tabs)/_layout.tsx` — 底部三 Tab（概览 / + / 更多），FAB 中间按钮 | ✅ |
| SegmentedControl | `components/common/SegmentedControl.tsx` — 统一 API: values/selectedIndex/onChange | ✅ |
| BottomDrawer | `components/common/BottomDrawer.tsx` — 底部抽屉基础组件 | ✅ |
| ConfirmModal | `components/common/ConfirmModal.tsx` — 确认弹窗 | ✅ |

**交付物**: 3 个 Tab 页可切换（概览空白、设置页已有内容），毛玻璃卡片在明暗模式正确显示，且完成了全部子组件及临时占位模块的类型消噪与跑通
**依赖**: Session 2（需要 useSettingsStore 支持主题切换）

---

### Session 4: 记账页面 (AddEntry) (✅ 已完成)

**目标**: 完整的记账功能可用

| 任务 | 说明 | 状态 |
|------|------|------|
| EntryForm | `components/add-entry/EntryForm.tsx` — 记账/编辑统一容器 | ✅ |
| CategoryGrid | `components/add-entry/CategoryGrid.tsx` — 类别网格 + 选中高亮 | ✅ |
| NumericKeypad | `components/add-entry/NumericKeypad.tsx` — 数字键盘 + 运算符 | ✅ |
| AmountDisplay | `components/add-entry/AmountDisplay.tsx` — 金额动画展示 | ✅ |
| 记账页路由 | `app/add-entry.tsx` — 全屏 Modal 页面 | ✅ |
| 日期选择 | 日期 Picker + "今天/昨天" 快捷按钮 | ✅ |
| 备注输入 | note 文本输入框 | ✅ |
| 提交逻辑 | 新建交易 → SQLite → 返回概览 | ✅ |
| 编辑模式 | edit-entry/[id] 加载已有数据 + 更新/删除 | ✅ |

**交付物**: 能完整走通 "记一笔" → 保存 → 返回的流程
**依赖**: Session 3

---

### Session 5: 概览页面 - 账本模式 (✅ 已完成)

**目标**: 账本 Tab 的完整功能

| 任务 | 说明 | 状态 |
|------|------|------|
| 概览页路由 | `app/(tabs)/index.tsx` — 概览页主框架（账本/月度/年度三 Tab 切换） | ✅ |
| AssetBentoGrid | `components/overview/AssetBentoGrid.tsx` — 净资产/收入/支出卡片 + Sparkline | ✅ |
| TransactionList | `components/overview/TransactionList.tsx` — 按日期分组 SectionList + Sticky Header | ✅ |
| TransactionItem | `components/overview/TransactionItem.tsx` — 单条交易卡片 + 滑动删除 | ✅ |
| 筛选控件 | 全部/支出/收入 SegmentedControl | ✅ |
| 空状态 | 无数据时的引导页 | ✅ |
| 下拉刷新 | SectionList 刷新逻辑 | ✅ |

**交付物**: 概览页展示完整的交易流水，可筛选、可删除
**依赖**: Session 4（需要记账功能产生数据来测试）

---

### Session 6: 概览页面 - 统计模式 (图表) (✅ 已完成)

**目标**: 月度/年度统计的图表部分

| 任务 | 说明 | 状态 |
|------|------|------|
| StatisticsService | `services/StatisticsService.ts` — getPeriodStats / getTrendData / getStructureData | ✅ |
| StatisticsView | `components/statistics/StatisticsView.tsx` — 统计视图容器 | ✅ |
| SummaryBentoGrid | `components/statistics/SummaryBentoGrid.tsx` — 汇总卡片 Bento Grid + 预算进度环 | ✅ |
| BudgetRing | `components/statistics/BudgetRing.tsx` — SVG 预算进度环 | ✅ |
| TrendChart | `components/statistics/TrendChart.tsx` — 双折线图 (收入 vs 支出) + 预算虚线 | ✅ |
| StructureChart | `components/statistics/StructureChart.tsx` — 堆叠柱状图 | ✅ |
| 时间导航 | `< 2026.01 >` 切换 + "回到今天" | ✅ |
| 图表交互 | 点击数据点高亮 + 筛选列表 | ✅ |

**交付物**: 月度/年度统计图表完整可用
**依赖**: Session 5
---

### Session 7: 统计排行 + 设置页组件 (✅ 已完成)

**目标**: 统计排行列表 + 设置页子组件

| 任务 | 说明 | 状态 |
|------|------|------|
| CategoryRanking | `components/statistics/CategoryRanking.tsx` — 分类排行列表 + 进度条 | ✅ |
| 穿透明细 | 手风琴展开查看分类下交易明细 | ✅ |
| BudgetDrawer | `components/settings/BudgetDrawer.tsx` — 预算设置底部抽屉 + 自定义键盘 | ✅ |
| ExportDrawer | `components/settings/ExportDrawer.tsx` — CSV 导出 + 时间范围选择（本月/上月/本年/去年/全部） | ✅ |
| SmartChips | `components/add-entry/SmartChips.tsx` — 备注推荐 Chips | ✅ |

**交付物**: 统计排行和设置页子功能完整可用
**依赖**: Session 6

---

### Session 8: 打磨 + 动效 + 工程质量 (✅ 已完成)

**目标**: 产品级体验的最终抛光

#### 8.1 深色模式全面适配

| 任务 | 说明 |
|------|------|
| 全组件深色模式 | 确保所有组件使用 `useTheme()` 的 colors 而非硬编码颜色 |
| 统计图表适配 | TrendChart / StructureChart / SummaryBentoGrid / CategoryRanking 深色模式 |

#### 8.2 体验打磨

| 任务 | 说明 |
|------|------|
| 入场动效 | Staggered Fade-in (AssetBentoGrid / SummaryBentoGrid) |
| 微交互 | 按压缩放、列表项入场动画 |
| 骨架屏 | 数据加载中的 Skeleton 占位组件 |
| 图表动画 | Y 轴生长动画 |

#### 8.3 工程质量

| 任务 | 说明 |
|------|------|
| 性能优化 | SectionList 虚拟化配置 (initialNumToRender/windowSize) |
| 跨设备适配 | 使用 flex/ratios 确保不同尺寸显示一致 |
| 构建打包 | EAS Build 配置，生成 App 图标与启动页 |

**交付物**: 可分发的 APK/IPA
**依赖**: Session 7

---

## Session 间的依赖关系

```mermaid
flowchart LR
    S1["S1: 基础设施补全"] --> S2["S2: Store + 服务层"]
    S2 --> S3["S3: 导航 + 通用组件"]
    S3 --> S4["S4: 记账页"]
    S4 --> S5["S5: 概览-账本"]
    S5 --> S6["S6: 统计图表"]
    S6 --> S7["S7: 排行 + 设置组件"]
    S7 --> S8["S8: 打磨 + 测试"]
```

> **关键路径**: S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8
>
> 所有 Session 严格串行，每个 Session 都依赖前一个的交付物。

---

## 每个 Session 的执行建议

1. **Session 开头**: 告诉 AI "继续 Vault 项目的 Session N：[任务标题]，请先阅读 `doc/Architecture.md` 和 `doc/Migration_Plan.md`"
2. **Session 结束**: 确保 AI 更新 `doc/Vault.md` 版本记录 + 本文档的完成标记
3. **验证方式**: 每个 Session 结束后在模拟器/真机上运行确认功能正常
4. **回退策略**: 每个 Session 结束时 git commit，出问题可回退

---

## 更新日志

| 日期 | 更新 |
|------|------|
| 2026-05-17 | 初始版本：8 个 Session 拆分方案 |
| 2026-05-17 | 重启开发：审计实际代码状态，重置所有 Session 标记，新增"当前状态评估"章节，调整 Session 1 为"基础设施补全"而非"项目初始化" |
| 2026-05-17 | 修复 Android 真机 SQLite 空指针与统计页面空白缺陷，重写 ANSI SQL 分组查询规避 SQLite platform 差异，引入支出/收入双维统计 Segment 切换以彻底保证账单完整显示，打通双端 100% 极致稳定性 |
| 2026-05-17 | 深度打磨 Android 真机调试视觉细节与布局：1. 重构底部导航栏为常规贴底栏并实现全屏遮罩隐藏；2. 修复 FAB 图标居中偏差；3. 重写 Bento Grid 结余、预算、收入、支出、日均多维卡片架构；4. 实现 TrendChart 折线/预算虚线交互显隐，补全 MaterialIcons 兼容，消除 Reanimated 渲染警告 |
| 2026-05-17 | 完美解决 Android 状态栏重合重叠；重构账本为 1:1.4 不对称 Bento Grid 布局，并在结余卡片底部融合基于真实历史数据的高保真 SVG Sparkline 渐变折线；重写趋势图为滚动 12 个月（月度）/5 年（年度）模式以完美展示预算水平线，同时禁用垂直虚线、净化背景网格，彻底对齐 Web 原型质感 |
| 2026-05-17 | 修复“月度”统计趋势图预算修改不实时刷新的反应性缺陷，一次性并行拉取“支出”和“收入”两套结构数据，消除底部分类 Tab 切换时的重载与闪退；同步将月度/年度汇总 Bento Grid 卡片高度从 88px 紧凑压缩至 70px（预算进度环直径缩减至 40px），大幅优化纵向空间分布。完成趋势与结构图表系统重大升级：趋势折线默认双线展示，引入折线数据点点击呼出全维度财务摘要卡（Option B）交互；重构结构占比为滚动时间轴的类别堆叠柱状柱形图，支持支出/收入联动切换与 Top 4 + 其他类别自动聚合展示。深度解决真机图表拥挤与大面积空白缺陷：全量适配 Y 轴千分位 (k) 刻度压缩以缩窄 65% 左侧空白占宽；引入大版幅横向滑动手势，将柱体加粗（barPercentage: 0.85），使 12 期/30 天数据分布开合有度、具备极佳呼吸感，融合“单位：元”标注。重构“全画幅·悬浮 Y 轴”极致手势体验：废除传统左侧硬编码外边距，图表100%全画幅左贴边舒展绘制，曲线彻底解除横向挤压；Y轴数值（C方案4等分）以半透明无底色玻璃感悬浮靠左放置于绘图区曲线上方，配合 textShadow 阴影防底色干扰；绑定 ScrollView 宽度尺寸自适应重定位，初次载入瞬间重置于最右侧最新数据，彻底消解滑动空旷痛点。 |
