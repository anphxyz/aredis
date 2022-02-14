"use strict";
const redis = require('redis')
const alog = require('alog-xyz').getLogger({
  logName: 'AREDIS'
});

class Aredis {

  constructor(options) {
    this.options = { ...options };
    //
    this.client = redis.createClient(options);
    //
    this.client.on('connect', function () {
      alog.info(`${this.hash} >>ARedis client connected`);
    })
    this.client.on('error', function (err) {
      alog.error(`${this.hash} >>Something went wrong ${err}`);
    })
  }

  set hashName(hName) {
    this.hash = hName;
  }

  get hashName() {
    return this.hash;
  }

  /**
   * set 
   * @param {*} k 
   * @param {*} v 
   */
  async set(k, v) {
    alog.dev(`${this.hash} >> HSET >>${k}:${JSON.stringify(v).length}characters`);
    this.client.hSet(this.hash, k, JSON.stringify(v));
    this.client.expire(this.hash, this.options.expire);

  }


  async keys() {
    return await this.client.hKeys(this.hash)
  }

  async get(k) {
    const result = await this.client.hGet(this.hash, k);
    alog.dev(`${this.hash} >> HGET >> ${k}`, Boolean(result));
    if (!result)
      return null;
    try {
      return JSON.parse(result)
    } catch (error) {
      alog.error(error)
    }
  }

  async getAllByPrefix(prefix) {
    const result = await this.client.hGetAll(this.hash);
    alog.dev(`${this.hash} >> GETALL BY PREFIX >>`, { prefix });

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
    const result = await this.client.hGetAll(this.hash);
    alog.dev(`${this.hash} >> HGETALL >>`, Boolean(result));

    if (!result)
      return null

    const disArr = Object.values(result);
    return !disArr.length ? [] : disArr.map(JSON.parse)
  }

  async getallkey() {
    const result = await this.client.hGetAll(this.hash);
    alog.dev(`${this.hash} >> HGETALL >>`, Boolean(result));
    if (!result)
      return null
    return Object.keys(result)
  }

  async del(k) {
    alog.dev(`${this.hash} >> HDEL >> ${k}`);
    await this.client.hDel(this.hash, k);
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