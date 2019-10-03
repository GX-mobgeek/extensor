import * as auto from "./auto";
import * as credential from "./credential";
import * as mixed from "./mixed";

const CREDENTIAL = 1;
const AUTO = 2;
const MIXED = 3;

const methods = [CREDENTIAL, AUTO, MIXED];

const opts = {
  method: AUTO,
  timeout: 60000
};

export const withAuth = (io, options = {}, step1, step2) => {
  options = { ...opts, ...options };

  if (!~methods.indexOf(options.method)) {
    throw new Error(`Invalid authentication method "${options.method}"`);
  }

  if (!("io" in io)) {
    io.extensorAuthHandling = true;

    return io.use((socket, next) => {
      switch (options.method) {
        case AUTO:
          auto.server(io, socket, next, step1);
          break;
        case CREDENTIAL:
          credential.server(io, socket, next, options, step1);
          break;
        case MIXED:
          mixed.server(io, socket, next, options, step1, step2);
          break;
      }
    });
  } else {
    switch (options.method) {
      case AUTO:
        auto.client(io, step1);
        break;
      case CREDENTIAL:
        credential.client(io, step1);
        break;
      case MIXED:
        mixed.client(io, step1);
        break;
    }
  }
};

withAuth.AUTO = AUTO;
withAuth.CREDENTIAL = CREDENTIAL;
withAuth.MIXED = MIXED;
