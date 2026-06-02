# Vault - 项目全局规则

## 项目定义

Vault 是一款**隐私优先**的个人记账应用，所有数据存储在设备本地，完全离线运行。

## 项目阶段

当前处于 **跨平台工程化开发与打包发布阶段**。已完成由 UI 原型到 **React Native (Expo) + TypeScript + SQLite** 的全面迁移，实现多语言本地化、多货币切换、开发者模式，并在 Expo EAS 云端跑通 Android 独立 APK 打包发布（已更新并发布 v1.0.4-i18n-apk 增量包）。

## 文档体系

所有设计文档存放在 `doc/` 目录：

| 文档 | 职责 |
|------|------|
| `doc/Vault.md` | 项目总览、技术栈、版本历史 |
| `doc/UX.md` | 页面结构、交互逻辑、设计规范 |
| `doc/Statistics_Design.md` | 统计分析模块详细设计 |
| `doc/Architecture.md` | 跨平台架构设计 (目录结构/分层/数据库/迁移) |
| `doc/Migration_Plan.md` | 跨平台迁移任务拆分计划 (8 个 Session) |
| `doc/Android_Build_Guide.md` | Android 云端 EAS 打包与本地离线 Gradle 构建指南 |

**规则：任何功能变更前必须先阅读相关文档，完成后必须同步更新文档。**

## 核心功能

- 快速记账（支出/收入，支持四则运算）
- 分类管理（UI 层根据 i18n 动态翻译映射）
- 统计分析（月度/年度趋势图、消费构成、分类排行、预算健康度、Bento Grid数据展示，支持横向丝滑滑动与全画幅悬浮 Y 轴刻度）
- 开发者选项（清除数据、一键生成 180 天高拟真流水演示数据）
- 主题外观设置（深色/浅色/跟随系统）
- 多语言本地化（中英双语，支持跟随手机系统或设置页手动切换，现已在 v1.0.4-i18n-apk 中完成并物理交付）
- 多国货币偏好（支持跟随 Locale 自动推荐或在设置中手动切换：CNY/USD/GBP/CAD/AUD/NZD 等，并支持 CSV 自适应表头）

## 设计原则

1. **隐私优先** — 数据不离开设备，不依赖网络，完全离线
2. **极简交互** — 记一笔操作 ≤ 3 步完成
3. **视觉精致** — 玻璃拟态 (Glassmorphism)、微动效、自适应主题 Token
4. **移动优先** — 全画幅折线、大字数字、微缩网格与触控手势物理回弹

## 设计系统（已确立，保持一致）

| 要素 | 规范 |
|------|------|
| 主字体 | Manrope（正文）、JetBrains Mono（金额/数字） |
| 收入色 | `#10B981` 绿色系 |
| 支出色 | `#F43F5E` 玫瑰红系 |
| 主色调 | `#3B82F6` 蓝色系 |
| 卡片风格 | 玻璃拟态 `GlassCard`（`backdrop-filter` 滤镜） |
| 布局特征 | Bento Grid (自适应紧凑网格)，图表支持横向滚动与千位压缩 (k格式) |
| 圆角 | 卡片圆角 `20` / `24`，按钮全圆或 `12` / `14` |
| 动效 | 入场淡入淡出（错落淡入），按压缩放微交互（物理弹力缩放反馈） |

## 编码规范与数据层

1. **语言** — 代码注释和文档使用中文。
2. **命名** — 组件与页面文件名 `PascalCase` 或 Expo 路由约束，CSS 与样式 `camelCase`（StyleSheet），常量 `UPPER_SNAKE_CASE`。
3. **SQLite 数据库存储**：
   - 数据库文件存放在本地 SQLite 沙盒环境中。
   - **`settings` 表**（键值对存储，替代 LocalStorage）：
     - `monthly_budget`：每月预算限额，字符串数字。
     - `theme_preference`：主题偏好（`'light' | 'dark' | 'auto'`）。
     - `language_preference`：语言偏好（`'zh' | 'en' | 'auto'`）。
     - `currency_preference`：货币偏好（`'CNY' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'NZD' | 'auto'`）。
   - **`transactions` 表**（交易流水存储）：
     ```sql
     CREATE TABLE IF NOT EXISTS transactions (
       id          TEXT PRIMARY KEY,
       type        TEXT NOT NULL, -- 'expense' | 'income'
       amount      REAL NOT NULL,
       category    TEXT NOT NULL,
       date        TEXT NOT NULL, -- ISO 8601 YYYY-MM-DD
       note        TEXT DEFAULT '',
       created_at  INTEGER NOT NULL,
       updated_at  INTEGER NOT NULL
     );
     ```

## 技术方向

- **正式版技术栈**：React Native (Expo SDK 54) + TypeScript + SQLite
- **状态管理**：Zustand (状态内存持久化与 SQLite 本地更新深度绑定)
- **体积与性能控制**：0 额外网络依赖，通过 EAS Build 精简剔除冗余依赖，包体积控制在 15MB 内。
- **详细架构**：参见 `doc/Architecture.md`


