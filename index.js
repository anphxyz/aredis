"use strict";
const redis = require('redis')
const alog = require('alog-xyz').getLogger({
  logName: 'AREDIS'
});

class Aredis {

  constructor(options) {
    this.options = options;
    //
    this.client = redis.createClient(options);
    //
    this.client.on('connect', function () {
      alog.info(`${this.hashName} >>ARedis client connected`);
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
    alog.dev(`${this.hashName} >> HSET >>${k}:${JSON.stringify(v).length}characters`);
    this.client.hSet(this.hashName, k, JSON.stringify(v));
    this.client.expire(this.hashName, this.options.expire);

  }


  async keys() {
    return await this.client.hKeys(this.hashName)
  }

  async get(k) {
    const result = await this.client.hGet(this.hashName, k);
    alog.dev(`${this.hashName} >> HGET >> ${k}`, Boolean(result));
    if (!result)
      return null;
    try {
      return JSON.parse(result)
    } catch (error) {
      alog.error(error)
    }
  }

  async getAllByPrefix(prefix) {
    const result = await this.client.hGetAll(this.hashName);
    alog.dev(`${this.hashName} >> GETALL BY PREFIX >>`, { prefix });

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

    alog.dev('>>>getAllByPrefix', prefix, rs.length);
    return rs;
  }

  async getall() {
    const result = await this.client.hGetAll(this.hashName);
    alog.dev(`${this.hashName} >> HGETALL >>`, Boolean(result));

    if (!result)
      return null

    const disArr = Object.values(result);
    return !disArr.length ? [] : disArr.map(JSON.parse)
  }

  async getallkey() {
    const result = await this.client.hGetAll(this.hashName);
    alog.dev(`${this.hashName} >> HGETALL >>`, Boolean(result));
    if (!result)
      return null
    return Object.keys(result)
  }

  async del(k) {
    alog.dev(`${this.hashName} >> HDEL >> ${k}`);
    await this.client.hDel(this.hashName, k);
  }

}
// singleton
let instance = null;
const getInstance = (option) => {
  if (!instance) {
    instance = new Aredis(option);
    instance.client.connect();
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
  //
  return instance;
}