# Vault - 项目全局规则

## 项目定义

Vault 是一款**隐私优先**的个人记账应用，所有数据存储在设备本地，完全离线运行。

## 项目阶段

当前处于 **UI 原型阶段**（`Prototype/` 目录下的 HTML 文件），尚未进入工程化开发。后续计划采用跨平台方案支持 Android / iOS。

## 文档体系

所有设计文档存放在 `doc/` 目录：

| 文档 | 职责 |
|------|------|
| `doc/Vault.md` | 项目总览、技术栈、版本历史 |
| `doc/UX.md` | 页面结构、交互逻辑、设计规范 |
| `doc/Statistics_Design.md` | 统计分析模块详细设计 |

**规则：任何功能变更前必须先阅读相关文档，完成后必须同步更新文档。**

## 核心功能

- 快速记账（支出/收入，支持四则运算）
- 分类管理（支持自定义图标和排序）
- 统计分析（月度/年度趋势图、分类排行、预算追踪）
- 深色模式

## 设计原则

1. **隐私优先** — 数据不离开设备，不依赖网络
2. **极简交互** — 记一笔操作 ≤ 3 步完成
3. **视觉精致** — 玻璃拟态 (Glassmorphism)、微动效、渐变色彩
4. **移动优先** — 所有 UI 以手机尺寸为第一适配目标

## 设计系统（已确立，保持一致）

| 要素 | 规范 |
|------|------|
| 主字体 | Manrope（正文）、JetBrains Mono（金额/数字） |
| 收入色 | `#10B981` 绿色系 |
| 支出色 | `#F43F5E` 玫瑰红系 |
| 主色调 | `#3B82F6` 蓝色系 |
| 卡片风格 | 玻璃拟态 `.glass`（`backdrop-filter: blur`） |
| 圆角 | 卡片 `1.5rem`，按钮 `1rem`，全圆 `9999px` |
| 动效 | 入场 `fadeIn` / `slideUp`，交互 `scale` 反馈，时长 `200-300ms` |

## 编码规范

1. **语言** — 代码注释和文档使用中文
2. **命名** — 文件名 `PascalCase`，CSS 类名 `kebab-case`，JS 变量 `camelCase`，常量 `UPPER_SNAKE_CASE`
3. **数据键名** — LocalStorage 键统一使用 `vault_` 前缀（如 `vault_transactions`）
4. **交易数据结构**：
   ```json
   {
     "id": "string",
     "type": "expense | income",
     "amount": "number",
     "category": "string",
     "date": "ISO 8601",
     "note": "string",
     "timestamp": "number (ms)"
   }
   ```

## 技术方向

- **目标平台**：Android + iOS（跨平台）
- **当前原型**：纯 HTML + Tailwind CSS (CDN) + Chart.js
- **迁移时机**：当原型设计稳定后，再确定具体的跨平台技术栈（如 Flutter / React Native 等）
- **数据层**：本地存储优先，迁移时需保持离线可用的核心约束
