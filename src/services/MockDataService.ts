import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { TransactionType } from '../types/transaction';

/**
 * 开发者测试数据生成服务
 * 用于在开发调试环境下，为应用生成具有极高拟真度的 180 天收支流水。
 * 使用单条 SQLite 事务进行批量写入以保证最高插入性能 (在 100ms 内完成数百条写入)。
 */
export class MockDataService {
  /**
   * 生成过去 180 天的真实测试数据，写入 SQLite 数据库
   * @returns 生成的交易记录总条数
   */
  static async generateMockData(): Promise<number> {
    const db = await getDatabase();
    
    // 1. 先清空已有的交易记录，确保测试数据纯净且不重复
    await db.runAsync(QUERIES.CLEAR_ALL_TRANSACTIONS);

    const now = new Date();
    const transactions: {
      id: string;
      type: TransactionType;
      amount: number;
      category: string;
      date: string;
      note: string;
      created_at: number;
      updated_at: number;
    }[] = [];

    const formatToSqlDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // 常用备注池以增加数据的真实性，体现生活化气息
    const notesPool: Record<string, string[]> = {
      food: ['早餐肠粉', '午餐黄焖鸡', '买水果', '便利店零食', '晚饭牛肉面', '面包牛奶', '星巴克咖啡', '下午茶奶茶'],
      transport: ['地铁乘车', '打车回家', '共享单车', '汽车加油', '公交卡充值'],
      shopping: ['买日用品', '天猫超市', '名创优品', '技术类图书', '手机壳', '数据线'],
      housing: ['每月房租', '水费电费', '物业管理费', '光纤宽带费'],
      clothing: ['外套', '买运动鞋', '优衣库短袖', '防晒衣', '牛仔裤'],
      telecom: ['移动话费充值', '流量充值包'],
      dining: ['周末朋友聚餐', '海底捞火锅', '请客吃饭', '日料自助', '椰子鸡火锅'],
      entertainment: ['电影票', '密室逃脱', 'Switch 游戏购买', 'Livehouse 门票', '网易云音乐会员', '网吧上网'],
      travel: ['高铁票', '酒店民宿住宿', '景区门票', '旅行纪念品', '飞机票'],
      medical: ['感冒药', '挂号费', '洗牙服务', '体检费', '创可贴及常备药'],
      salary: ['开发工程师工资', '月度绩效工资', '基础薪资'],
      bonus: ['季度奖金', '项目突出贡献奖', '开工利是红包', '年终奖金'],
      investment: ['基金分红', '理财收益', '股票利息派发'],
      parttime: ['接单开发微信小程序', '技术翻译收益', '课后辅导'],
      refund: ['淘宝退款', '京东取消订单退款', '拼多多退款']
    };

    const getRandomNote = (category: string): string => {
      const pool = notesPool[category] || ['无'];
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const getRandomAmount = (min: number, max: number): number => {
      return parseFloat((Math.random() * (max - min) + min).toFixed(2));
    };

    // 循环过去 180 天
    for (let i = 180; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = formatToSqlDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const dayOfMonth = d.getDate();

      const createdTime = d.getTime() + 12 * 60 * 60 * 1000; // 假定在中午左右创建

      // A. 固定月度收支
      // 每月 10 号发工资
      if (dayOfMonth === 10) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'income' as TransactionType,
          amount: getRandomAmount(8000, 12000),
          category: 'salary',
          date: dateStr,
          note: getRandomNote('salary'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // 每月 5 号交房租
      if (dayOfMonth === 5) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(2000, 3200),
          category: 'housing',
          date: dateStr,
          note: getRandomNote('housing'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // 每月 20 号充话费
      if (dayOfMonth === 20) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(50, 100),
          category: 'telecom',
          date: dateStr,
          note: getRandomNote('telecom'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // B. 每日基础支出 (餐饮: 1~3 笔)
      const foodCount = Math.floor(Math.random() * 3) + 1; // 1-3 笔
      for (let f = 0; f < foodCount; f++) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(12, 60),
          category: 'food',
          date: dateStr,
          note: getRandomNote('food'),
          created_at: createdTime + f * 3 * 3600000, // 递减时间
          updated_at: createdTime + f * 3 * 3600000
        });
      }

      // C. 工作日通勤 (交通)
      if (!isWeekend && Math.random() < 0.85) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(2, 15),
          category: 'transport',
          date: dateStr,
          note: getRandomNote('transport'),
          created_at: createdTime + 4 * 3600000,
          updated_at: createdTime + 4 * 3600000
        });
      }

      // D. 随机日常消费
      // 购物 (10% 概率)
      if (Math.random() < 0.10) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(15, 250),
          category: 'shopping',
          date: dateStr,
          note: getRandomNote('shopping'),
          created_at: createdTime + 5 * 3600000,
          updated_at: createdTime + 5 * 3600000
        });
      }

      // 聚餐与娱乐 (周末概率高)
      const partyChance = isWeekend ? 0.35 : 0.08;
      if (Math.random() < partyChance) {
        const isDining = Math.random() < 0.6;
        const category = isDining ? 'dining' : 'entertainment';
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: isDining ? getRandomAmount(80, 450) : getRandomAmount(30, 260),
          category,
          date: dateStr,
          note: getRandomNote(category),
          created_at: createdTime + 6 * 3600000,
          updated_at: createdTime + 6 * 3600000
        });
      }

      // 服饰衣帽 (3% 概率)
      if (Math.random() < 0.03) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(99, 599),
          category: 'clothing',
          date: dateStr,
          note: getRandomNote('clothing'),
          created_at: createdTime + 2 * 3600000,
          updated_at: createdTime + 2 * 3600000
        });
      }

      // 医疗保健 (1.5% 概率)
      if (Math.random() < 0.015) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(20, 350),
          category: 'medical',
          date: dateStr,
          note: getRandomNote('medical'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // 旅行 (每 180 天可能有一两次)
      if (Math.random() < 0.008) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'expense' as TransactionType,
          amount: getRandomAmount(300, 1800),
          category: 'travel',
          date: dateStr,
          note: getRandomNote('travel'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // E. 随机额外收入
      // 理财收益 (每周可能有 1-2 次，15% 概率)
      if (Math.random() < 0.15) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'income' as TransactionType,
          amount: getRandomAmount(5, 80),
          category: 'investment',
          date: dateStr,
          note: getRandomNote('investment'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }

      // 兼职收入 (5% 概率)
      if (Math.random() < 0.05) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'income' as TransactionType,
          amount: getRandomAmount(150, 1200),
          category: 'parttime',
          date: dateStr,
          note: getRandomNote('parttime'),
          created_at: createdTime - 2 * 3600000,
          updated_at: createdTime - 2 * 3600000
        });
      }

      // 退款 (2% 概率)
      if (Math.random() < 0.02) {
        transactions.push({
          id: Crypto.randomUUID(),
          type: 'income' as TransactionType,
          amount: getRandomAmount(10, 180),
          category: 'refund',
          date: dateStr,
          note: getRandomNote('refund'),
          created_at: createdTime,
          updated_at: createdTime
        });
      }
    }

    // 3. 执行批量写入数据库（高效事务）
    await db.withTransactionAsync(async () => {
      for (const t of transactions) {
        await db.runAsync(
          QUERIES.INSERT_TRANSACTION,
          [t.id, t.type, t.amount, t.category, t.date, t.note, t.created_at, t.updated_at]
        );
      }
    });

    console.log(`[MockData] 成功生成并高效插入了 ${transactions.length} 条交易流水数据。`);
    return transactions.length;
  }
}
