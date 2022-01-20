"use strict";
const redis = require('redis')
const alog = require('alog-xyz').getInstance(__dirname);

class Aredis {

  hashName = '';

  constructor(options) {
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
  set(key, value) {
    alog.info(`${this.hashName} >> HSET >>${k}:${JSON.stringify(v).length}characters`);
    this.client.hset(this.hashName, key, JSON.stringify(value));
    // expired after 3 days (auto remove)
    this.client.expire(this.hashName, 3 * 24 * 60 * 60);
  }


  keys() {
    return new Promise((resolve, reject) => {
      this.client.hkeys(this.hashName, (err, ls) => {
        if (err) {
          reject(err);
        } else {
          resolve(ls);
        }
      });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.client.hget(this.hashName, key, (err, result) => {
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
      this.client.hgetall(this.hashName, (err, result) => {
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
      this.client.hgetall(this.hashName, (err, result) => {
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
      this.client.hgetall(this.hashName, (err, result) => {
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
    this.client.hdel(this.hashName, k);
  }

  quit() {
    this.client.quit();
  }
}
// singleton
let instance = null;
const getInstance = () => {
  if (!instance) {
    instance = new Aredis();
  }
  return instance;
}

// builder
exports.build = (hashName, prefix = 'AREDIS-',) => {
  const instance = getInstance();
  instance.hashName = prefix + hashName;
  return instance;
}