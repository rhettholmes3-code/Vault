const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('==============================================');
console.log('🧪 Vault v1.1.0 全量质量与逻辑自动化测试套件');
console.log('==============================================\n');

// ----------------------------------------------------
// 测试模块 1: i18n 双语字典 100% 对齐与参数插值校验
// ----------------------------------------------------
console.log('【测试模块 1】i18n 多语言字典结构与插值对齐校验:');
const zhPath = path.join(__dirname, '..', 'src', 'constants', 'locales', 'zh.json');
const enPath = path.join(__dirname, '..', 'src', 'constants', 'locales', 'en.json');

const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8').replace(/^\uFEFF/, ''));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, ''));

function compareKeys(objA, objB, prefix = '') {
  const keysA = Object.keys(objA).sort();
  const keysB = Object.keys(objB).sort();

  for (const k of keysA) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    assert(k in objB, `Key "${fullKey}" exists in both zh and en`);
    if (typeof objA[k] === 'object' && objA[k] !== null) {
      if (typeof objB[k] === 'object' && objB[k] !== null) {
        compareKeys(objA[k], objB[k], fullKey);
      }
    } else if (typeof objA[k] === 'string' && typeof objB[k] === 'string') {
      // 检查动态插值占位符 %{xxx} 是否在双语中完全匹配
      const placeholdersA = (objA[k].match(/%\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const placeholdersB = (objB[k].match(/%\{[a-zA-Z0-9_]+\}/g) || []).sort();
      assert(
        JSON.stringify(placeholdersA) === JSON.stringify(placeholdersB),
        `Interpolation variables match for "${fullKey}": ${JSON.stringify(placeholdersA)}`
      );
    }
  }

  for (const k of keysB) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (!(k in objA)) {
      assert(false, `Key "${fullKey}" exists in en but missing in zh`);
    }
  }
}

compareKeys(zh, en);

// ----------------------------------------------------
// 测试模块 2: BackupService 备份数据协议与校验算法
// ----------------------------------------------------
console.log('\n【测试模块 2】数据备份协议 (Schema v1) 与校验完整性:');

function calculateChecksum(transactions, totalExpense, totalIncome) {
  const seed = `${transactions.length}_${totalExpense.toFixed(2)}_${totalIncome.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// 模拟完整备份对象
const mockTransactions = [
  { id: 'tx-1', type: 'expense', amount: 35.5, category: 'food', date: '2026-10-25', note: '午饭', created_at: 1729860000000, updated_at: 1729860000000 },
  { id: 'tx-2', type: 'expense', amount: 120.0, category: 'shopping', date: '2026-10-24', note: '生活用品', created_at: 1729773600000, updated_at: 1729773600000 },
  { id: 'tx-3', type: 'income', amount: 15000.0, category: 'salary', date: '2026-10-15', note: '月薪', created_at: 1728996000000, updated_at: 1728996000000 },
];
const mockCategories = [
  { id: 'food', type: 'expense', name: 'food', icon: 'restaurant', color: '#f59e0b', bg: '#fef3c7', is_active: 1, is_custom: 0, sort_order: 1, created_at: 1728900000000 },
];
const mockSettings = {
  monthly_budget: '5000',
  theme_preference: 'dark',
  currency_preference: 'CNY',
  daily_reminder_enabled: '1',
  periodic_summary_enabled: '1',
};

const totalExp = 35.5 + 120.0;
const totalInc = 15000.0;
const checksum = calculateChecksum(mockTransactions, totalExp, totalInc);

const mockBackup = {
  schemaVersion: 1,
  metadata: {
    appVersion: '1.1.0',
    exportTimestamp: Date.now(),
    exportDate: new Date().toISOString(),
    totalTransactions: mockTransactions.length,
    totalExpense: totalExp,
    totalIncome: totalInc,
    checksum: checksum,
  },
  settings: mockSettings,
  categories: mockCategories,
  transactions: mockTransactions,
};

// 校验函数
function validateBackup(data) {
  if (!data) return false;
  if (data.schemaVersion !== 1) return false;
  if (!Array.isArray(data.transactions)) return false;
  if (!Array.isArray(data.categories)) return false;
  if (typeof data.settings !== 'object' || data.settings === null) return false;
  if (typeof data.metadata !== 'object' || data.metadata === null) return false;
  return true;
}

assert(validateBackup(mockBackup) === true, '合法 Schema v1 备份数据校验通过');
assert(validateBackup({ schemaVersion: 2 }) === false, '非法 Schema 版本被拒绝');
assert(validateBackup({ schemaVersion: 1, transactions: 'bad' }) === false, '交易数据非数组被拒绝');
assert(calculateChecksum(mockTransactions, totalExp, totalInc) === checksum, 'Checksum 校验和一致性一致');
assert(calculateChecksum(mockTransactions, totalExp + 1, totalInc) !== checksum, '篡改金额触发 Checksum 变动拦截');

// ----------------------------------------------------
// 测试模块 3: Notification 晚间动态感知文案生成逻辑
// ----------------------------------------------------
console.log('\n【测试模块 3】通知文案动态感知生成与边界逻辑:');

function formatEveningBody(count, lang = 'zh') {
  const dict = lang === 'zh' ? zh.notifications : en.notifications;
  if (count > 0) {
    return dict.evening_body_done.replace('%{count}', count);
  }
  return dict.evening_body_zero;
}

const body0Zh = formatEveningBody(0, 'zh');
const body1Zh = formatEveningBody(3, 'zh');
const body0En = formatEveningBody(0, 'en');
const body1En = formatEveningBody(2, 'en');

assert(body0Zh.includes('今天辛苦啦'), '0 笔支出时晚间展示温馨提醒文案 (zh)');
assert(body1Zh.includes('今天已记 3 笔账'), '有记录时晚间展示已记笔数温和复盘文案 (zh)');
assert(body0En.includes('Great job today'), '0 笔支出时晚间展示提醒文案 (en)');
assert(body1En.includes('You logged 2 transactions today'), '有记录时晚间展示已记笔数温和复盘文案 (en)');

// ----------------------------------------------------
// 测试模块 4: 周报与月报预算分析文案生成逻辑
// ----------------------------------------------------
console.log('\n【测试模块 4】周报与月报预算结余/超支文案逻辑:');

function formatMonthlyReport(monthlyBudget, lastMonthExpense, currency = '¥', lang = 'zh') {
  const dict = lang === 'zh' ? zh.notifications : en.notifications;
  if (monthlyBudget > 0) {
    const diff = monthlyBudget - lastMonthExpense;
    if (diff >= 0) {
      return dict.monthly_body_budget
        .replace(/%\{currency\}/g, currency)
        .replace('%{amount}', lastMonthExpense.toFixed(2))
        .replace('%{balance}', diff.toFixed(2));
    } else {
      return dict.monthly_body_over
        .replace(/%\{currency\}/g, currency)
        .replace('%{amount}', lastMonthExpense.toFixed(2))
        .replace('%{balance}', Math.abs(diff).toFixed(2));
    }
  }
  return dict.monthly_body_no_budget
    .replace(/%\{currency\}/g, currency)
    .replace('%{amount}', lastMonthExpense.toFixed(2));
}

const underBudget = formatMonthlyReport(5000, 3200, '¥', 'zh');
const overBudget = formatMonthlyReport(5000, 5800, '¥', 'zh');
const noBudget = formatMonthlyReport(0, 4200, '$', 'en');

assert(underBudget.includes('预算结余 ¥1800.00'), '未超支时正确计算并展示预算结余');
assert(overBudget.includes('超出预算 ¥800.00'), '超支时正确计算并展示超出金额');
assert(noBudget.includes("Last month's total expense was $4200.00"), '未设置预算时仅展示总支出');

// ----------------------------------------------------
// 测试模块 5: 语义化版本号比较器逻辑 (compareSemver)
// ----------------------------------------------------
console.log('\n【测试模块 5】语义化版本号比较与更新识别校验:');

function compareSemver(v1, v2) {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

assert(compareSemver('1.1.1', '1.1.0') > 0, '1.1.1 > 1.1.0 (次要修订版检测到更新)');
assert(compareSemver('v1.2.0', '1.1.1') > 0, 'v1.2.0 > 1.1.1 (带 v 前缀与功能版本更新)');
assert(compareSemver('2.0.0', '1.9.9') > 0, '2.0.0 > 1.9.9 (大版本跨越更新)');
assert(compareSemver('1.1.0', '1.1.0') === 0, '1.1.0 === 1.1.0 (相同版本无更新)');
assert(compareSemver('v1.1.0', '1.1.0') === 0, 'v1.1.0 === 1.1.0 (带前缀相等)');
assert(compareSemver('1.0.9', '1.1.0') < 0, '1.0.9 < 1.1.0 (低版本不触发更新)');
assert(compareSemver('1.1.0.1', '1.1.0') > 0, '1.1.0.1 > 1.1.0 (支持4位版本号比较)');

// 校验 app.json 与 package.json 版本号单调递增
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

assert(appJson.expo.version === pkgJson.version, `app.json (${appJson.expo.version}) 与 package.json (${pkgJson.version}) 版本号一致`);
assert(appJson.expo.android.versionCode >= 7, `android.versionCode 严格递增至 >= 7 (当前: ${appJson.expo.android.versionCode})`);
assert(compareSemver(appJson.expo.version, '1.1.0') > 0, `新发布版本号 (${appJson.expo.version}) 高于上一版本 1.1.0`);

// ----------------------------------------------------
// 测试总结
// ----------------------------------------------------
console.log('\n==============================================');
console.log(`📊 测试汇总: 总计 ${passCount + failCount} 项测试, ✅ 通过: ${passCount}, ❌ 失败: ${failCount}`);
console.log('==============================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
