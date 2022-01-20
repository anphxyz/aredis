"use strict";
const redis = require('redis')
const alog = require('alog-xyz').getInstance({
  logName: 'AREDIS'
});

class Aredis {

  hashName = '';

  constructor(options) {
    this.options = options;
    //
    this.client = redis.createClient(options);
    //
    this.client.on('connect', function () {
      alog.info(`${this.hashName} >>A Redis client connected`);
    })
    this.client.on('error', function (err) {
      alog.error(`${this.hashName} >>Something went wrong ${err}`);
    })
  }
  /**
   * set 
   * @param {*} k 
   * @param {*} v 
   */
  async set(k, v) {
    alog.info('>>SET', this.hashName, k);
    alog.info(`${this.hashName} >> HSET >>${k}:${JSON.stringify(v).length}characters`);
    this.client.hSet(this.hashName, k, JSON.stringify(v));
    this.client.expire(this.hashName, this.options.expire);

  }


  async keys() {
    alog.info('>>KEYS', this.hashName);
    return await this.client.hKeys(this.hashName)
  }

  async get(k) {
    alog.info('>>GET', this.hashName, k);

    const result = await this.client.hGet(this.hashName, k);
    alog.info(`${this.hashName} >> HGET >> ${k}`, Boolean(result));
    if (!result)
      return null;
    try {
      return JSON.parse(result)
    } catch (error) {
      alog.error(error)
    }
  }

  async getAllByPrefix(prefix) {
    alog.info('>>GETALLBYPREFIX', this.hashName, prefix);

    const result = this.client.hGetAll(this.hashName);
    alog.info(`${this.hashName} >> GETALL BY PREFIX >>`, { prefix });

    if (!result)
      return null

    const disArr = Object.entries(result);
    // empty
    if (!disArr.length)
      return []
    //
    const rs = disArr
      .map(([k, v]) => k.includes(prefix) ? v : null)
      .filter(Boolean)
      .map(JSON.parse);

    alog.info('>>>getAllByPrefix', prefix, rs.length);
    return rs;
  }

  async getall() {
    alog.info('>>GETALL', this.hashName);

    const result = await this.client.hGetAll(this.hashName);
    alog.info(`${this.hashName} >> HGETALL >>`, Boolean(result));

    if (!result)
      return null

    const disArr = Object.values(result);
    return !disArr.length ? [] : disArr.map(JSON.parse)
  }

  async getallkey() {
    alog.info('>>GETALLKEY', this.hashName);
    const result = await this.client.hGetAll(this.hashName);
    alog.info(`${this.hashName} >> HGETALL >>`, Boolean(result));
    if (!result)
      return null
    return Object.keys(result)
  }

  async del(k) {
    alog.info('>>HDEL', this.hashName);

    alog.info(`${this.hashName} >> HDEL >> ${k}`);
    await this.client.hDel(this.hashName, k);
  }

}
// singleton
let instance = null;
const getInstance = (option) => {
  if (!instance) {
    instance = new Aredis(option);
  }
  return instance;
}

// builder
exports.build = (option) => {
  if (!option || JSON.stringify(option) === '{}')
    return false;

  const instance = getInstance(option);
  instance.hashName = [
    option.prefix || 'AREDIS-',
    option.hashName || new Date().toISOString()
  ].join('');
  if (!instance.client.connected) {
    instance.client.connect();
  }
  //
  return instance;
}