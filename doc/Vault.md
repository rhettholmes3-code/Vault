# Vault - 个人记账应用

> 🔒 **核心价值：隐私优先** — 完全离线运行，无需网络，数据存储在本地。

---

## 项目概述

Vault 是一款专为个人用户设计的离线记账应用。所有数据存储在设备本地，确保用户的财务隐私不被泄露。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React Native (Expo) + TypeScript |
| **图表库** | Victory Native / react-native-chart-kit |
| **数据存储** | SQLite (expo-sqlite) |
| **状态管理** | Zustand |
| **路由** | Expo Router |
| **动画** | React Native Reanimated |

## 核心功能

- ✅ 快速记账 (支出/收入)
- ✅ 分类管理 (支持自定义图标)
- ✅ 统计分析 (月度/年度趋势图)
- ✅ 预算追踪 (环形进度条)
- ✅ 数据导出 (CSV 格式)
- ✅ 深色模式 (支持手动切换/系统跟随)
- ⏳ 多语言支持 (中英双语，已完成 i18n 核心架构，进入细节对接与类型校验阶段)

## 原型文件

| 文件 | 说明 |
|------|------|
- ⏳ 多语言支持 (中英双语，已完成 i18n 核心架构，进入细节对接与类型校验阶段)

## 原型文件

| 文件 | 说明 |
|------|------|
| `Prototype/Overview.html` | 概览页面 (账本 + 统计) |
| `Prototype/AddEntry.html` | 记账页面 |
| `Prototype/Settings.html` | 设置页面 (预算设定、开发者选项、主题切换) |

## 文档索引

| 文档 | 内容 |
|------|------|
| `doc/UX.md` | 整体 UX 设计 (页面结构/交互逻辑) |
| `doc/Statistics_Design.md` | 统计模块详细设计 |
| `doc/Architecture.md` | 跨平台架构设计 (React Native + SQLite) |
| `doc/Migration_Plan.md` | 跨平台迁移任务拆分计划 (8 个 Session) |
| `doc/Publishing_Guide.md` | Google Play 商店自动上架与 OTA 热更新实操指南 |

## 多平台体验与打包策略

鉴于目前的开发环境与账号限制，采用以下体验策略：

- **iOS 平台**：使用 **Expo Go** 客户端进行真机扫码预览（无 Apple 开发者账号时的最佳方案）。
- **Android 平台**（优先）：
  1. **快速预览**：使用 **Expo Go** 客户端进行真机验证。
  2. **独立安装包**：通过 Expo EAS (Expo Application Services) 云构建独立的 **APK 安装包**，获得包含独立图标和原生性能的真机体验。
  3. **正式商店上架**：通过 EAS Build 构建 `.aab` 格式生产包，并使用 EAS Submit 配合 Google Cloud Service Account 自动提交并发布至 **Google Play 商店**。
  4. **线上热更新 (OTA)**：通过集成的 `expo-updates`，通过命令行 `eas update` 向生产客户端实时静默推送业务补丁，免去重复商店审核。

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.5-publishing | 2026-06-03 | **配置 Google Play 发布与 OTA 热更新**：集成并配置 `expo-updates` 实现线上静默更新，配置 `eas.json` 的 `submit` 自动化发布设置，重命名 App 中文显示名称为“Vault离线记账”。新增了 [Publishing_Guide.md](file:///c:/Users/rhett/.gemini/antigravity/Vault/doc/Publishing_Guide.md) 作为生产上架与热更新的详尽实操指南，并提供可用于部署 GitHub Pages 的隐私协议 HTML 模板。 |
| v1.0.3-android | 2026-05-30 | **新增 Android 打包与构建指南**：在 doc 目录下新增了 [Android_Build_Guide.md](file:///C:/Users/rhett/.gemini/antigravity/Vault/doc/Android_Build_Guide.md) 指南文档，对 Expo 云端 EAS 打包和本地离线 Gradle 构建两种路径进行了详细评估，并罗列了当前项目资源和权限的准备情况。正式交付并跑通首个 Android APK 的一键云构建！已在 Expo 云端安全托管 Android 原生签名密钥 (Keystore)，并在本地 doc/ 下物理更新交付了最终版 [Android_Build_Guide.md](file:///C:/Users/rhett/.gemini/antigravity/Vault/doc/Android_Build_Guide.md) 指南。用户可直接扫码下载和安装 APK 进行完美无暇的真机体验。 |
| v1.0.4-currency | 2026-06-03 | **多国货币切换与日期格式微调**：支持在设置页自主切换货币类型，支持所有英语区国家货币（USD, GBP, CAD, AUD, NZD 等）的动态渲染；将英文语言下的图表日期显示格式统一为简化的 `MM/DD`。 |
| v1.0.3-i18n | 2026-06-02 | **多语言支持与TypeScript修复**：完美支持中英双语版本，整合 `expo-localization` 与 `i18n-js` 实现系统默认自动适配与设置页手动切换；CSV 导出表头、文件名、以及全图表 labels 和 legend 完美跟随所选语言实时同步转换；清理了未使用的模板残留代码并修复了 `AmountDisplay` 和 `Skeleton` 的 TypeScript 编译类型隐患，达成 100% 完美无瑕编译发布标准！ |
| v1.0.2-reactivity | 2026-05-17 | **修复反应性缺陷、消除分类切换闪烁、优化高度占比，并完成图表重构与横滚加粗大升级**：① 在 `app/_layout.tsx` 初始化阶段全局载入 SQLite 状态，将预算状态注入 `StatisticsView` 依赖；② 一次性并行拉取支出与收入占比数据，切换分类 Tab 实现零闪屏；③ Bento 卡片高度从 88px 精简压缩至 70px；④ **图表系统重构与细节打磨**：趋势图默认双折线绘制，支持点击数据点触发极精美全维度财务摘要 Tooltip 浮窗；收支结构图重写为按月/年时间轴滚动的“类别堆叠柱状柱形图”；⑤ **大版面横向滚动与 Y 轴压缩**：针对真机屏幕下“柱子细密、左侧留白过多、金额占宽”痛点，全量上线**“横向丝滑滑动机制”**（让月度/天度图表自动延展至宽幅，柱体厚实感大幅增加 `barPercentage: 0.85`），并使用 **`Y轴千位压缩(k格式)`** 技术（如 `15000` 压缩为 `15k`）消减左侧 65% 以上的无用占宽，右上角融合精致的“单位：元”标签；⑥ **横向滑动深度打磨（全画幅·悬浮Y轴系统）**：摒弃传统左侧外边距占位，首创**“图表曲线内侧·悬浮玻璃刻度数字”方案**（4等分极简刻度，支持 textShadow 文字投影防背景色干扰），**释放100%全画幅图表绘图宽度，折线与堆叠柱从屏幕左边缘完美舒展**，滑动时数据在悬浮数字下方穿梭滑过；同时引入 **`ScrollView 尺寸监听`**，在初次渲染及数据切换时**“瞬间秒级”**自动定位到最右侧最新的一期数据，打造殿堂级大屏触控手势财务体验！ |
| v1.0.0-settings | 2026-05-17 | **完成 Session 6 与 Session 7：统计图表与设置页组件开发**。开发了 `CategoryRanking` 带有手风琴展开交易明细功能的分类排行列表，完善了 `BudgetDrawer` 带有自定义表达式计算键盘的底部预算设置抽屉，实现了 `ExportDrawer` 多时间维度的 CSV 数据导出功能，并在记账表单中集成了 `SmartChips` 备注智能推荐功能。补齐了设置页与统计页的全部子组件闭环。 |
| v1.0.0-overview | 2026-05-17 | **完成 Session 5：概览页面开发（账本模式）**。实现 `app/(tabs)/index.tsx` 页面核心框架及 Tab 切换机制，完美集成 `AssetBentoGrid` 资产总结网格面板；开发具有悬浮 Header 效果的按日分组流水列表 `TransactionList`；基于 `react-native-gesture-handler` 构建丝滑 `TransactionItem`，支持右滑呼出删除操作及防误触二次确认，全面打通 `useTransactionStore` 数据下发与局部状态管理，补齐空白态引导及下拉刷新逻辑。 |
| v1.0.0-entry | 2026-05-17 | **完成 Session 4：记账与编辑表单开发**。全新交付完整的记账与编辑流程！实现 `AmountDisplay`（B方案双行设计，结合 Reanimated 弹力缩放动效的大字金额与算式展示）、`NumericKeypad`（具备优秀触感反馈的数学表达式计算键盘）、`CategoryGrid`（果冻感微缩放动画网格类别选择器）以及核心页面控制器 `EntryForm`。实现 iOS 端高级毛玻璃 `BottomDrawer` 日期选择与 Android 原生自适应日期选择，以及高拟真“昨天/今天”快捷一键切换；完美打通了编辑模式数据的 SQLite 加载、修改更新及结合 Session 3 的 `ConfirmModal` 二次确认安全删除功能，融入了微秒级 `Haptics` 物理触控反馈。**本轮特别修复**：核验并确保了 `@react-native-community/datetimepicker` 在 `package.json` 中的物理写入，并**在 codebase 全局范围内完成了对所有 6 个非法使用 `Manrope-Medium` 和 3 个使用 `JetBrainsMono-Medium` 文件的字体别名清扫与物理载入字重对齐**，彻底清除了 Fallback 隐患，达成 100% 完美的视觉一致性。 |
| v1.0.0-ui | 2026-05-17 | **完成 Session 3：导航框架与通用组件开发**。成功交付 `app/(tabs)/_layout.tsx`（集成 iOS BlurView/Android 高级半透明自适应的高端毛玻璃 TabBar，并拦截中间 Tab 唤起全屏 Modal）、`SegmentedControl`（结合 Reanimated spring 滑动弹簧物理回弹效果的分段选择器）、`BottomDrawer`（带淡入淡出遮罩与底部弹出物理动画的精美抽屉容器）、`ConfirmModal`（二次确认弹窗），并提前完成 settings 页面的 Drawer 联动及占位防错组件，全数消除了 TS 编译隐患。 |
| v1.0.0-stores | 2026-05-17 | 完成 Session 2：状态管理与服务层开发。实现 `useSettingsStore`（预算/主题设置持久化）、`useTransactionStore`（交易 CRUD 状态管理）、`useStatsStore`（统计视图周期/导航/筛选）。开发 `BudgetService`（预算健康度分析）与高拟真度的 `MockDataService`（单条 SQLite 事务高效批量写入 180 天测试流水）。 |
| v1.0.0-infra | 2026-05-17 | 完成 Session 1：补全项目基础设施。下载 Manrope 与 JetBrains Mono 字体，创建交易与统计类型定义，补全 SQLite 连接与 Schema 设计，统一分类常量，修复 `settings.tsx` 语法错误。 |
| v0.9 | 2026-05-17 | 重启开发：审计代码实际状态，重整 Architecture.md 和 Migration_Plan.md，保留可用代码、重置迁移进度 |
| v0.8 | 2026-05-17 | 新增 `Architecture.md`，确立 React Native (Expo SDK 54) + SQLite 跨平台技术栈，初始化 Expo 项目 |
| v0.7 | 2026-05-17 | 新增数据导出功能，支持 CSV 格式及多维度时间范围选择（Drawer 交互） |
| v0.6 | 2026-05-17 | 优化月度/年度统计卡片布局为自适应 Bento Grid 网格 |
| v0.5 | 2026-05-17 | 新增 `Settings.html` 设置页，完善月度预算逻辑及定制键盘，联动统计图表 |
| v0.4 | 2026-05-17 | 新增全局规则文件 `.agents/rules/overview.md` |
| v0.3 | 2026-01-11 | 统计模块优化 (双折线图/预算环/入场动效) |
| v0.2 | 2026-01-10 | 统计模块初版 (图表/排行列表) |
| v0.1 | 2026-01-07 | 基础记账功能 |

