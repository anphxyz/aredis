I. Description

This is a simple redis wrapper using `promise` and allow use `async/await` only work with HASH :

option parameter at `build()` follow Client options of `NodeRedis` and 2 addtion properties by `aredis-xyz`:
   - prefix
   - hashName

@see https://github.com/NodeRedis/node-redis#user-content-options-object-properties
 

II. Install

``` bash
    npm i aredis-xyz
```

III. Uninstall

``` bash
    npm uninstall aredis-xyz
```

IV. Using

```js
    const aredis = require('aredis-xyz').build(option);// default prefix is AREDIS- final hash format by AREDIS-POST

```