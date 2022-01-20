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
  set(k, v) {
    alog.info(`${this.hashName} >> HSET >>${k}:${JSON.stringify(v).length}characters`);
    this.client.hSet(this.hashName, k, JSON.stringify(v));
    // expired after 3 days (auto remove)
    this.client.expire(this.hashName, this.options.expire);
  }


  keys() {
    return new Promise((resolve, reject) => {
      this.client.hKeys(this.hashName, (err, ls) => {
        if (err) {
          reject(err);
        } else {
          resolve(ls);
        }
      });
    });
  }

  get(k) {
    return new Promise((resolve, reject) => {
      this.client.hGet(this.hashName, k, (err, result) => {
        alog.info(`${this.hashName} >> HGET >> ${k}`, Boolean(result));
        if (err)
          return reject(err);
        if (!result)
          return resolve(null);
        try {
          return resolve(JSON.parse(result))
        } catch (error) {
          return reject(error);
        }
      })
    })
  }

  getAllByPrefix(prefix) {
    return new Promise((resolve, reject) => {
      this.client.hGetAll(this.hashName, (err, result) => {
        alog.info(`${this.hashName} >> GETALL BY PREFIX >>`, { prefix });
        if (err)
          return reject(err);
        if (!result)
          return resolve(null);

        try {
          const disArr = Object.entries(result);
          // empty
          if (!disArr.length)
            return resolve([]);
          //
          const rs = disArr
            .map(([k, v]) => k.includes(prefix) ? v : null)
            .filter(Boolean)
            .map(JSON.parse);

          alog.info('>>>getAllByPrefix', prefix, rs.length);

          resolve(rs);

        } catch (error) {
          return reject(error);
        }
      })
    })
  }

  getall() {
    return new Promise((resolve, reject) => {
      this.client.hGetAll(this.hashName, (err, result) => {
        alog.info(`${this.hashName} >> HGETALL >>`, Boolean(result));
        if (err)
          return reject(err);

        if (!result)
          return resolve(null);
        try {
          const disArr = Object.values(result);
          return resolve(
            !disArr.length
              ? []
              : disArr.map(JSON.parse)
          )
        } catch (error) {
          return reject(error);
        }
      })
    })
  }

  getallkey() {
    return new Promise((resolve, reject) => {
      this.client.hGetAll(this.hashName, (err, result) => {
        alog.info(`${this.hashName} >> HGETALL >>`, Boolean(result));
        if (err) {
          return reject(err);
        }
        if (!result)
          return resolve(null);

        return resolve(
          Object.keys(result)
        )
      })
    })
  }

  del(k) {
    alog.info(`${this.hashName} >> HDEL >> ${k}`);
    this.client.hDel(this.hashName, k);
  }

  quit() {
    this.client.quit();
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
  //
  return instance;
}