/**
 * 每日额度。
 *
 * 自用场景下额度不是为了防别人刷，而是防止自己手滑把预算刷光：
 * 一份报告 6 次模型调用，M4 还带联网检索，成本不是零。
 */
const { getStore } = require('./store');

const getDailyLimit = () => {
  const value = Number(process.env.REREAD_DAILY_LIMIT || 20);
  return Number.isFinite(value) && value > 0 ? value : 20;
};

// 按北京时间切天
const todayKey = () =>
  new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getQuota = async (ownerOpenid) => {
  const day = todayKey();
  const usage = await getStore().getUsage(ownerOpenid, day);
  const limit = getDailyLimit();
  const used = usage.count || 0;
  return {
    day,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    allowed: used < limit
  };
};

const consumeQuota = async (ownerOpenid) => {
  const day = todayKey();
  const usage = await getStore().incUsage(ownerOpenid, day, 1);
  const limit = getDailyLimit();
  return {
    day,
    limit,
    used: usage.count,
    remaining: Math.max(0, limit - usage.count)
  };
};

module.exports = {
  getQuota,
  consumeQuota,
  getDailyLimit,
  todayKey
};
