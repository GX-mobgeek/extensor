export default function createInMemoryStorage() {
  const store = {};
  return {
    get: async key => {
      if (!(key in store)) return null;

      const { expire, value } = store[key];

      if (expire !== false && expire < Date.now()) {
        delete store[key];
        return null;
      }

      return value;
    },
    set: async (key, value, expire = false) => {
      if (expire !== false) {
        // expire defined aways in minutes, convert to ms
        expire *= 60000;
        expire += Date.now();
      }

      store[key] = { expire, value };
      return true;
    },
    del: async key => {
      delete store[key];

      return true;
    }
  };
}
