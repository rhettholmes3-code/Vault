const fs = require('fs');
const path = require('path');

const zh = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'constants', 'locales', 'zh.json'), 'utf8').replace(/^\uFEFF/, ''));

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.git' && e.name !== '.expo') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(e.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = [
  ...getAllFiles(path.join(__dirname, '..', 'src')),
  ...getAllFiles(path.join(__dirname, '..', 'app')),
];

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = curr[p];
    } else {
      return undefined;
    }
  }
  return curr;
}

let missingKeys = [];
let totalKeyCalls = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match t('...') or t("...")
  const matches = content.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g);
  for (const match of matches) {
    const key = match[1];
    // 忽略如 t('category.' + id) 这样的动态拼接前缀
    if (key.endsWith('.')) {
      const parentNamespace = key.slice(0, -1);
      const val = getNestedValue(zh, parentNamespace);
      if (!val || typeof val !== 'object') {
        missingKeys.push({ file: path.relative(path.join(__dirname, '..'), file), key });
      }
      continue;
    }
    totalKeyCalls++;
    const val = getNestedValue(zh, key);
    if (val === undefined) {
      missingKeys.push({ file: path.relative(path.join(__dirname, '..'), file), key });
    }
  }
}

console.log(`扫描了 ${files.length} 个代码文件中的 ${totalKeyCalls} 处 t('key') 调用:`);
if (missingKeys.length === 0) {
  console.log('✅ 零遗漏！所有代码中引用的 i18n 键均在 zh.json 字典中存在！');
} else {
  console.error(`❌ 发现 ${missingKeys.length} 处未定义的翻译键:`);
  console.table(missingKeys);
}
