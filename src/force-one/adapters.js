function donePromise(resolve, reject, err, data = true) {
  if (err) return reject(err);

  resolve(data);
}

const standardGet = client => key =>
  new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      donePromise(resolve, reject, err, data);
    });
  });

const standardDel = client => key =>
  new Promise((resolve, reject) => {
    client.del(key, err => {
      donePromise(resolve, reject, err);
    });
  });

export const redis = client => {
  return {
    get: standardGet(client),
    del: standardDel(client),
    set: (key, value, ex = 5) =>
      new Promise((resolve, reject) => {
        client.set(key, value, "EX", ex * 60, err => {
          donePromise(resolve, reject, err);
        });
      })
  };
};

export const memcached = client => {
  return {
    get: standardGet(client),
    del: standardDel(client),
    set: (key, value, ex = 5) =>
      new Promise((resolve, reject) => {
        client.set(key, value, ex * 60, err => {
          donePromise(resolve, reject, err);
        });
      })
  };
};

export const ioRedis = client => {
  return {
    get: key => client.get(key),
    set: (key, value, ex = 5) => client.set(key, value, "EX", ex),
    del: key => client.del(key)
  };
};
