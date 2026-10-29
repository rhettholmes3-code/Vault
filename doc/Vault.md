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
- ✅ 分类管理 (支持自定义图标、颜色、排序、隐藏以及新增自定义类别)
- ✅ 统计分析 (月度/年度趋势图)
- ✅ 预算追踪 (环形进度条)
- ✅ 数据导出 (CSV 格式)
- ✅ 全量数据备份与灾备安全 (遵循 Schema v1 的 JSON 全量导出、覆盖前自动快照、SQLite 原子事务恢复与一键撤销回滚)
- ✅ 本地智能提醒与周期总结 (每日 12:30 午间记账、21:30 晚间记账动态感知复盘；每周一 09:00 与每月 1 号 09:30 支出分析推送；100% 离线)
- ✅ 深色模式 (支持手动切换/系统跟随)
- ✅ 多语言支持 (中英双语 100% 同步对齐，零硬编码，支持参数化动态模板渲染)

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

## 自动化质量保障与发布门禁

项目建立了严格的发布前质量门禁标准与真实数据绝对保全铁律，任何版本构建发布前必须 100% 依次通过：
1. `npx tsc --noEmit`：TypeScript 全局静态类型检查；
2. `node scripts/verify_i18n_keys.js`：全局代码 i18n 静态扫描，杜绝未定义翻译键；
3. `node scripts/run_v11_tests.js`：450+ 项业务逻辑全量自动化测试（双语对齐、Schema v1、防篡改校验和、动态感知文案、超支计算）；
4. `npx expo export --platform android`：Hermes 生产打包编译预检；
5. **真实数据绝对保全测试 (Zero Data Loss)**：老版本升级覆盖验证，确保沙盒 SQLite 数据条数、金额、分类、设置 100% 毫发无损。

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.2.1 | 2026-10-29 | **智能提醒底层穿透优化与本地轻量化构建环境落地**。① **本地极简轻量化构建闭环**：免装 10GB Android Studio，在本地建立仅 0.68GB 的极简编译链（JDK 17 + Android SDK platform-35 / build-tools），配置腾讯云与阿里云 Maven 镜像加速，交付 `scripts/build_local_apk.ps1`，实现本地 20~30 秒增量编译独立 APK 并通过 ADB 直推 Samsung 真机；② **精准闹钟与免休眠权限全量补齐 (`app.json`)**：新增 `USE_EXACT_ALARM`（Android 13/14+ 免审核高优先级闹钟权限，系统默认授予，根除后台息屏延迟挂起）与 `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`；③ **系统权限自检与动态引导 (`NotificationService`)**：集成 `getExactAlarmPermissionsAsync` 与 `requestExactAlarmPermissionsAsync`，主动检测精确闹钟授权；④ **“每日记账提醒”注释文案响应式重塑**：遵循方案 B 改造为功能性总括说明（`在设定的午间与晚间时刻推送记账提醒` / `Remind you to log transactions at scheduled times`），双语 100% 对齐；⑤ **准时提醒保障指南深化**：明确针对三星 One UI 及各类 Android 系统提供【电池设为无限制】与【闹钟与提醒】排查指南及一键跳转；⑥ **版本与无损升级保障**：版本升至 `1.2.1`，`versionCode` 升至 `10`，全量通过四大自动化发布门禁。 |
| v1.2.0 | 2026-10-29 | **智能提醒与开发者选项层级架构重构，老版本无损迁移保障**。构建 ID：`4a20b653-6b04-4e7c-be91-3e26a69eac5b`。① **智能提醒二级菜单重构**：新建独立二级页面 `app/reminder-settings.tsx`，主设置页精简为入口并实时动态显示时刻摘要；二级页将【每日记账提醒】设为主控 Switch 并支持午晚间时刻动态展开折叠；周/月支出总结独立为卡片；② **开发者选项层级拆分**：按职责拆分为【提醒唤醒诊断】与【数据维护与模拟】；③ **老版本数据库覆盖升级零损毁门禁**：新增模块 7 回归测试，确保历史记账明细、预算、自定义分类 100% 幂等完好；④ **版本单调递增**：版本升至 `1.2.0`，`android.versionCode` 升至 `9`。 |
| v1.1.2 | 2026-10-28 | **Android 准点提醒体系工业级强化与自定义时刻配置**。构建 ID：`d169c2c6-c8d3-4f05-adec-8176e4583b61`，APK 下载：[v1.1.2 APK 直链](https://expo.dev/artifacts/eas/Z3GN-sm_gcszqSoNKI1u_J00O8p_j3tHykGiW_E3xPY.apk)。① **Android 底座权限补齐 (`app.json`)**：显式声明 `SCHEDULE_EXACT_ALARM`（Android 12+ 准时闹钟硬件唤醒核心权限，彻底消除非精确降级与息屏延迟）、`RECEIVE_BOOT_COMPLETED`（手机重启自动恢复闹钟）、`POST_NOTIFICATIONS`、`WAKE_LOCK` 与 `VIBRATE`；② **自定义每日记账时刻**：支持在主设置页自由设定午间与晚间提醒的具体时分（通过原生时间选择器滑动配置），配置即时持久化到 SQLite 并重新调度系统闹钟；③ **成熟 App 级保活与排查**：新增前台生命周期自愈校验（`AppState.change` 切回时自动检测并补齐调度），设置页提供【准时提醒排查指南】指引一键前往系统设置将电池优化改为【无限制】并开启自启动；④ **真实定时测试赋能**：在开发者选项中新增【1分钟定时唤醒测试 (AlarmManager)】，支持用户锁屏息屏后于 1 分钟内验证系统硬件唤醒与通知弹出；⑤ **版本与门禁保证**：版本升至 `1.1.2`，`versionCode` 升至 `8`，自动化测试套件扩充至 519 项 100% 通过。 |
| v1.1.1 | 2026-10-28 | **应用内版本检查更新与自动引导升级体系 (`UpdateService`)**。① **GitHub Releases 直连更新器**：基于语义化版本号比较算法 (`compareSemver`)，仅在用户于设置页主动点击【版本信息】时才向 GitHub API 发送只读请求，100% 恪守离线与隐私优先原则，零后台静默请求；② **极简零危险权限下载**：检测到新版本时展示弹窗（含新版本号、发布时间及 Markdown 格式更新日志），用户点击【立即下载更新】调用系统默认浏览器直连下载 APK 附件进行本地无损覆盖安装，无需申请高危的 `REQUEST_INSTALL_PACKAGES` 权限；③ **交互与加载动效打磨**：设置页版本项右侧支持实时转圈加载态与“点击检查更新”提示；未检测到新版或网络异常时具备温和兜底弹窗；④ **版本单调递增保障**：`app.json` 与 `package.json` 升至 `1.1.1`，`android.versionCode` 严格从 `6` 递增至 `7`，严格保障覆盖升级保留本地 SQLite 数据；⑤ **自动化测试矩阵扩充**：自动化测试套件扩增至 484 项，全量覆盖语义化版本比对（含前缀处理、大版本跨越、4位版本号比对等边界）。 |
| v1.1.0 | 2026-10-25 | **v1.1 正式发布 — 本地智能提醒体系与可追溯全量数据备份系统**。① **本地智能提醒系统 (`NotificationService`)**：基于 `expo-notifications` 实现 100% 离线定时提醒调度（每日 12:30 午间记账、21:30 晚间记账动态温和复盘、每周一 09:00 上周支出与 Top 分类总结、每月 1 号 09:30 上月支出与预算结余总结）；实现通知点击直达（记账提醒直达全屏记账弹窗、总结提醒直达统计视图）；支持首次启动温和授权弹窗及设置页独立细分开关；支持【发送即时测试提醒】2秒快速复核机制。② **全量数据灾备与可追溯恢复系统 (`BackupService`)**：遵循规范 Schema v1，支持全量 JSON 导出分享与导入覆盖恢复；首创**导入前自动安全快照（Safety Auto-Snapshot）**与【一键撤销恢复】防护能力；恢复全程在 SQLite 原子事务包裹下执行，彻底消除数据损坏隐患。③ **设置页面层级体验重构**：主设置页清爽化，在应用偏好中新增【更多设置】入口，将数据安全与备份、开发者选项收纳至独立二级页面 (`app/more-settings.tsx`)。④ **多语言 (i18n) 全局铁律**：零硬编码，所有新增文案 100% 同步至 `zh.json` 与 `en.json` 并采用参数化动态模板。⑤ **版本迭代稳定性规范**：`app.json` 与 `package.json` 升至 `1.1.0`，`android.versionCode` 升至 `6`，保障覆盖升级无损保留历史数据库。⑥ **全量自动化质量验证**：构建全自动化测试套件，完成 454 项测试 100% 通过（双语字典对齐、占位符完整性、Schema v1 结构、防篡改校验和、动态感知文案、预算超支计算等），达成零缺陷发布。 |
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


## 常见问题与环境配置 (Troubleshooting)

### Git 报错：`'remote-https' is not a git command`

**问题现象**：
在执行 `git push` 或其它 Git 网络操作时，命令行报以下错误：
```
git: 'remote-https' is not a git command. See 'git --help'.
fatal: remote helper 'https' aborted session
```

**原因分析**：
该问题表示本地 Git 的网络传输辅助程序丢失。经检测，您的 Git 安装目录 `D:\Software\Git\mingw64\libexec\git-core\` 下，除了 `git-remote-ftp.exe` 外，没有找到 `git-remote-http.exe` 和 `git-remote-https.exe`。这通常是因为：
1. **杀毒软件误杀**：Windows Defender 或第三方杀毒软件在后台将该程序误判为威胁并自动隔离或删除。
2. **Git 安装损坏**：此前的 Git 安装不完整或核心组件被意外损毁。

**修复方案**：

#### 方案一：使用 winget 强制覆盖重装（推荐）
在您系统的 PowerShell 或 CMD（建议以**管理员身份**运行）中，执行以下命令，强制重新下载并覆盖安装 Git：
```powershell
winget install --id Git.Git --force
```

#### 方案二：前往官网手动下载覆盖安装
直接访问 Git 官方下载页面 [Git for Windows](https://git-scm.com/download/win)，下载最新的 64-bit Git for Windows Setup 安装程序，运行并直接覆盖安装到 `D:\Software\Git`。

#### 方案三：检查杀毒软件隔离历史
1. 打开 Windows **“安全中心”** -> **“病毒和威胁防护”**。
2. 点击 **“保护历史记录”**。
3. 查找最近是否拦截了来自 Git 目录的 `git-remote-https.exe`。
4. 如果有，点击它并选择 **“还原”**（或允许在设备上运行），并将该路径加入排除项，以防止后续再次被删。

### Notion 桌面客户端启动闪退

**问题现象**：
双击 Notion 图标启动，显示窗口但未加载内容即立刻闪退。网页版正常，清理常规缓存和重装无效。

**原因分析**：
Notion Windows 客户端基于 Electron 架构，启动闪退通常由于以下原因：
1. **本地 AppData 配置文件/缓存残留损坏**：常规卸载无法清除 `%APPDATA%\Notion` 目录下的用户配置文件。
2. **GPU 硬件加速与显卡驱动冲突**：Electron 渲染器在启用 GPU 加速时由于显卡驱动、系统更新或双显卡切换产生致命错误崩溃。
3. **微软 WebView2 Runtime 损坏**：底层渲染依赖的 WebView2 损坏或版本不匹配。

**解决步骤**：

#### 步骤一：彻底清除 AppData 残留数据
1. 按下 `Win + R` 快捷键，输入 `%appdata%` 并回车。
2. 在打开的目录中找到并彻底删除 `Notion` 文件夹。
3. 再次按下 `Win + R`，输入 `%localappdata%` 并回车，删除 `Programs\Notion` 目录（如有）。
4. 重新启动 Notion。

#### 步骤二：禁用 GPU 硬件加速启动
1. 使用快捷键 `Win + R` 打开运行窗口，输入 `cmd` 并回车。
2. 在命令行中执行以下命令（以默认安装路径为例）：
   ```cmd
   "%USERPROFILE%\AppData\Local\Programs\Notion\Notion.exe" --disable-gpu
   ```
3. 若以此方式能成功启动且不闪退，说明是硬件加速冲突。
4. 永久解决：右键 Notion 桌面快捷方式 -> **属性** -> 在**“目标”**输入框的最后面添加空格并加上参数 ` --disable-gpu`（例如：`"C:\Users\...\Notion.exe" --disable-gpu`），点击确定。

#### 步骤三：使用 --no-sandbox 参数启动（针对崩溃代码 80000003）
崩溃日志中的 `ExceptionCode: 80000003` (STATUS_BREAKPOINT) 通常是 Chromium/Electron 底层的沙盒 (Sandbox) 安全机制在 Windows 系统下初始化失败导致的断点崩溃。
1. 使用快捷键 `Win + R` 打开运行窗口，输入 `cmd` 并回车。
2. 在命令行中执行以下命令测试：
   ```cmd
   "%USERPROFILE%\AppData\Local\Programs\Notion\Notion.exe" --no-sandbox
   ```
3. 如果测试成功启动，可以在快捷方式的“目标”最后面添加 ` --no-sandbox`。

#### 步骤四：修复 WebView2 运行时
1. 前往微软官方网站下载并安装 **Microsoft Edge WebView2 运行时** (WebView2 Runtime) 安装包进行修复或重装。

#### 步骤五：尝试以管理员权限或兼容模式运行
1. 右键点击 Notion 快捷方式或 `Notion.exe`，选择 **以管理员身份运行**。
2. 或者在 **属性 -> 兼容性** 选项卡中，尝试以 Windows 8 兼容模式运行。

#### 步骤六：通过网页端唤起桌面客户端 (Protocol Handler)
1. 在网页端登录 Notion，打开任意页面。
2. 点击右上角的 `...` 菜单，选择 **“Open in Windows App”**。这会通过系统协议关联强行唤醒并初始化桌面端，有时可以绕过冷启动时的首屏闪退。

#### 步骤七：获取与解析崩溃日志
若以上均失效，可通过 Windows 事件查看器定位原因：
1. 按下 `Win + X`，选择 **事件查看器**。
2. 展开左侧的 **Windows 日志 -> 应用程序**。
3. 查找发生闪退时间点的 **“错误 (Error)”** 日志（来源通常为 `Application Error` 或 `.NET Runtime`，对应程序为 `Notion.exe`）。
4. 复制错误描述中的“错误模块名称”（例如某个 `.dll` 文件），可精确定位是显卡、杀毒软件拦截还是系统动态库问题。
