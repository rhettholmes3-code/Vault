# 统计分析模块设计稿 (Statistics Module Design)

> 对应 UX 文档 3.2 章节：月度统计 & 年度统计
> **最后更新**: 2026-01-11 (基于 Prototype 实现同步)

---

## 1. 核心交互架构

`Overview.html` 采用单页应用 (SPA) 模式，顶部提供三种视图状态切换：

| Tab | 模式 | 内容 |
|-----|------|------|
| **本月** | 账本模式 | 资产卡片 + 交易流水列表 |
| **月度** | 统计模式 | 最近12个月趋势/结构图表 + 分类排行 |
| **年度** | 统计模式 | 最近5年趋势/结构图表 + 分类排行 |

### 时间导航
- **位置**: 顶部栏右侧 (统计模式下显示)
- **格式**: `< 2026.01 >` (月度) / `< 2026 >` (年度)
- **功能**: 左右切换周期, "回到今天" 按钮

---

## 2. 汇总卡片组 (Summary Cards)

采用紧凑的多行网格布局 (Bento Grid)，动态自适应月度/年度状态：

- **月度视图** (5张卡片, `grid-cols-6`)：
  - 第一行：结余 (`col-span-4`), 预算剩余 (`col-span-2` 包含微型进度环)
  - 第二行：总收入 (`col-span-2`), 总支出 (`col-span-2`), 日均支出 (`col-span-2`)
- **年度视图** (4张卡片, 隐藏预算卡片)：
  - 自动切换为 2x2 网格 (每个 `col-span-3`)

### 预算进度环逻辑
- `>50%` 剩余: 绿色 (Healthy)
- `20%-50%` 剩余: 黄色 (Warning)
- `<20%` 剩余: 红色 (Critical)

---

## 3. 核心分析图表 (Core Chart)

### 3.1 双模式切换
- **[趋势]**: 双折线图 (收入 vs 支出) + 预算虚线
- **[结构]**: 堆叠柱状图 (分类占比)

### 3.2 图表细度
| Tab | 横轴 | 数据范围 |
|-----|------|----------|
| 月度 | 月 (1月-12月) | 最近12个月 (滚动窗口) |
| 年度 | 年 (2022-2026) | 最近5年 (滚动窗口) |

### 3.3 可视化元素
- **收入线**: 绿色 (#22c55e), 细线
- **支出线**: 蓝色 (#3b82f6), 粗线, 填充渐变
- **预算线**: 灰色虚线 (#94a3b8)
- **图例**: 底部圆点图例 (收入 / 支出 / 预算)

### 3.4 交互功能
| 交互 | 效果 |
|------|------|
| 点击数据点 | 高亮选中点, 下方列表筛选至该月/年 |
| 再次点击 | 取消选中, 恢复默认视图 |
| 左右滑动 | 切换上一/下一周期 |

---

## 4. 分类排行列表 (Ranking List)

### 4.1 切换控件
- `[支出]` / `[收入]` Segmented Control

### 4.2 布局
```
┌─────────────────────────────────┐
│  🍔 餐饮美食                     │
│  ══════════════════ 50%  ¥5,000 │
│                                 │
│  > 展开查看明细                  │
└─────────────────────────────────┘
```

### 4.3 穿透交互 (Drill-down)
- 点击分类卡片 → 手风琴展开该分类下的交易明细
- 明细项显示: 日期 | 备注 | 金额

---

## 5. 动效与体验 (Motion & UX)

### 5.1 入场动效
| 元素 | 动画 |
|------|------|
| 汇总卡片 | Staggered Fade-in (75ms 间隔) |
| 图表 | Y轴生长动画 (2s, easeOutQuart) |

### 5.2 骨架屏 (Skeleton)
- 数据加载时显示闪烁占位符 (`.skeleton` 类)

### 5.3 触感反馈 (Tactile)
- 选中点: 放大 + 实心填充
- 非选中点: 变淡 (opacity 0.3)

---

## 6. 技术实现

### 6.1 依赖
- **原型阶段**: Chart.js (CDN), 用于折线图和柱状图
- **正式版**: react-native-chart-kit 或 Victory Native (原生渲染)

### 6.2 核心服务（已规划提取为独立模块）

将从 `Prototype/Overview.html` 提取至 `src/services/StatisticsService.ts`:

```typescript
// src/services/StatisticsService.ts
export const StatisticsService = {
  getPeriodStats(transactions: Transaction[], period: PeriodType, referenceDate: Date): PeriodStats { ... },
  getTrendData(transactions: Transaction[], periodType: PeriodType, referenceDate: Date): TrendData { ... },
  getStructureData(transactions: Transaction[], periodType: PeriodType, referenceDate: Date): StructureData { ... }
};
```

### 6.3 状态管理

原型使用全局对象，正式版迁移至 Zustand Store (`src/stores/useStatsStore.ts`):

```typescript
interface StatsState {
  period: 'month' | 'year';
  currentDate: Date;
  chartMode: 'trend' | 'structure';
  chartActiveIndex: number | null;
  listType: 'expense' | 'income';
}
```

> 详细架构设计参见 `doc/Architecture.md`

---

## 7. 待办 & 未来规划

- [x] 预算设置功能 (在"更多"页面配置)
- [ ] 图表全屏放大模式
- [ ] 导出 PDF/图片
- [ ] 智能洞察 (如 "本月餐饮支出比上月增加 15%")
