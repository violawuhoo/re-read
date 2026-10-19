/**
 * 统一存储层。
 *
 * 两种实现，靠环境变量切换：
 * - cloud：微信云开发数据库（云托管/云函数里用，容器本地磁盘不持久，必须落库）
 * - file ：本地 JSON 目录（仅本机开发调试用）
 *
 * 所有方法都是 async，调用方不要假设同步返回。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const COLLECTIONS = {
  reports: 'reports',
  tasks: 'tasks',
  usage: 'usage'
};

const TASK_TTL_MS = 24 * 60 * 60 * 1000;

const getStoreMode = () => {
  if (process.env.REREAD_STORE) {
    return process.env.REREAD_STORE;
  }
  return process.env.TCB_ENV ? 'cloud' : 'file';
};

/* ------------------------------ 本地文件实现 ------------------------------ */

const fileStore = () => {
  const dataDir = process.env.REREAD_DATA_DIR
    ? path.resolve(process.env.REREAD_DATA_DIR)
    : path.join(os.homedir(), '.reread');
  const files = {
    reports: path.join(dataDir, 'reports.json'),
    tasks: path.join(dataDir, 'tasks.json'),
    usage: path.join(dataDir, 'usage.json')
  };

  const read = (key) => {
    try {
      const text = fs.readFileSync(files[key], 'utf-8');
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  };

  const write = (key, value) => {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(files[key], JSON.stringify(value, null, 2), 'utf-8');
  };

  return {
    mode: 'file',
    describe: () => ({ mode: 'file', dir: dataDir }),

    async getReport(id) {
      return read('reports')[id] || null;
    },

    async listReports({ ownerOpenid, limit = 50 }) {
      const all = Object.values(read('reports'));
      return all
        .filter((item) => !ownerOpenid || item.ownerOpenid === ownerOpenid)
        .sort((a, b) => String(b.generatedAt || '').localeCompare(String(a.generatedAt || '')))
        .slice(0, limit);
    },

    async findReportByArticleUrl(articleUrl, ownerOpenid) {
      if (!articleUrl) {
        return null;
      }
      const all = Object.values(read('reports'));
      return (
        all.find(
          (item) =>
            item.articleSnapshot &&
            item.articleSnapshot.articleUrl === articleUrl &&
            (!ownerOpenid || item.ownerOpenid === ownerOpenid)
        ) || null
      );
    },

    async addReport(report) {
      const all = read('reports');
      all[report.id] = report;
      write('reports', all);
      return report;
    },

    async createTask(task) {
      const all = read('tasks');
      all[task.taskId] = task;
      write('tasks', all);
      return task;
    },

    async getTask(taskId) {
      return read('tasks')[taskId] || null;
    },

    async patchTask(taskId, patch) {
      const all = read('tasks');
      if (!all[taskId]) {
        return null;
      }
      all[taskId] = { ...all[taskId], ...patch, updatedAt: new Date().toISOString() };
      write('tasks', all);
      return all[taskId];
    },

    async getUsage(ownerOpenid, day) {
      return read('usage')[`${ownerOpenid}__${day}`] || { count: 0 };
    },

    async incUsage(ownerOpenid, day, delta = 1) {
      const all = read('usage');
      const key = `${ownerOpenid}__${day}`;
      const next = { ...(all[key] || { count: 0 }), count: ((all[key] || {}).count || 0) + delta };
      all[key] = next;
      write('usage', all);
      return next;
    },

    async cleanupTasks() {
      const all = read('tasks');
      const deadline = Date.now() - TASK_TTL_MS;
      let changed = false;
      Object.entries(all).forEach(([id, task]) => {
        if (new Date(task.createdAt || 0).getTime() < deadline) {
          delete all[id];
          changed = true;
        }
      });
      if (changed) {
        write('tasks', all);
      }
    }
  };
};

/* ------------------------------ 云开发数据库 ------------------------------ */

const cloudStore = () => {
  let database = null;

  const getDb = () => {
    if (!database) {
      // 延迟加载：本地跑的时候不需要装这个依赖
      const tcb = require('@cloudbase/node-sdk');
      const app = tcb.init({
        env: process.env.TCB_ENV || process.env.SCF_NAMESPACE
      });
      database = app.database();
    }
    return database;
  };

  const segment = (name) => getDb().collection(COLLECTIONS[name]);

  return {
    mode: 'cloud',
    describe: () => ({ mode: 'cloud', env: process.env.TCB_ENV || process.env.SCF_NAMESPACE || '' }),

    async getReport(id) {
      // 云数据库默认单条读取上限，报告可能较大，用 where 取回
      const result = await segment('reports').where({ id }).limit(1).get();
      return (result.data && result.data[0]) || null;
    },

    async listReports({ ownerOpenid, limit = 50 }) {
      const query = ownerOpenid ? { ownerOpenid } : {};
      const result = await segment('reports')
        .where(query)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();
      return result.data || [];
    },

    async findReportByArticleUrl(articleUrl, ownerOpenid) {
      if (!articleUrl) {
        return null;
      }
      const query = { 'articleSnapshot.articleUrl': articleUrl };
      if (ownerOpenid) {
        query.ownerOpenid = ownerOpenid;
      }
      const result = await segment('reports').where(query).limit(1).get();
      return (result.data && result.data[0]) || null;
    },

    async addReport(report) {
      // 用报告 id 作为文档 id，天然去重
      await segment('reports')
        .doc(report.id)
        .set({ ...report, ownerOpenid: report.ownerOpenid || '' });
      return report;
    },

    async createTask(task) {
      await segment('tasks').doc(task.taskId).set(task);
      return task;
    },

    async getTask(taskId) {
      const result = await segment('tasks').where({ taskId }).limit(1).get();
      return (result.data && result.data[0]) || null;
    },

    async patchTask(taskId, patch) {
      const result = await segment('tasks')
        .where({ taskId })
        .update({ ...patch, updatedAt: new Date().toISOString() });
      if (result && result.updated !== undefined && result.updated === 0) {
        return null;
      }
      return this.getTask(taskId);
    },

    async getUsage(ownerOpenid, day) {
      const result = await segment('usage').where({ ownerOpenid, day }).limit(1).get();
      return (result.data && result.data[0]) || { count: 0 };
    },

    async incUsage(ownerOpenid, day, delta = 1) {
      const current = await this.getUsage(ownerOpenid, day);
      const next = {
        ownerOpenid,
        day,
        count: (current.count || 0) + delta,
        updatedAt: new Date().toISOString()
      };
      await segment('usage').doc(`${ownerOpenid}__${day}`).set(next);
      return next;
    },

    async cleanupTasks() {
      const deadline = new Date(Date.now() - TASK_TTL_MS).toISOString();
      await segment('tasks').where({ createdAt: getDb().command.lt(deadline) }).remove();
    }
  };
};

let instance = null;

const getStore = () => {
  if (!instance) {
    instance = getStoreMode() === 'cloud' ? cloudStore() : fileStore();
  }
  return instance;
};

module.exports = {
  getStore,
  getStoreMode,
  COLLECTIONS,
  TASK_TTL_MS
};
