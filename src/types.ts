import { Socket } from "socket.io";
///<reference types="socket.io" />
///<reference types="socket.io-client" />

export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: any): Promise<string>;
  del(key: string): Promise<number>;
  deleteAll(keys: string[]): Promise<number | void | null>;
}

/**
 * Authorization options
 */
export type AuthOptions = {
  /**
   * Authorization timeout, in ms
   * @default false // Don't set timeout
   */
  timeout?: number | boolean;

  /**
   * Allowed events before authentication
   * @default 'Extensor defaults'
   */
  authorizedEvents?: string[];
};

/**
 * Force unique connection options
 */
export type UniqueOptions = {
  /**
   * Identifier for prevent multiple connection attemp
   * @default false Mix of ip and user-agent
   */
  identifier?: string | boolean;

  /**
   * Set error handler for unique middleware
   * @default 'e => debug("%s: %s", e.local, e.message);'
   */
  onError?: (local: string, eror: Error, socket: Socket) => void;

  /**
   * Manager of connections state data
   * @default ExtensorSimpleStore
   */
  storage?: Storage;
};

export type AuthResultResponse = {
  error?: string;
  merge: { [prop: string]: any };
};

export type ServerSocket = SocketIO.Socket & {
  [prop: string]: any;
  /**
   * Handler socket authentication
   */
  auth: Promise<unknown>;
};

export type ClientSocket = SocketIOClient.Socket & {
  [prop: string]: any;
  /**
   * Handler socket authentication
   */
  auth: Promise<unknown>;
};

export type AuthHandler = (ctx: {
  /**
   * Socket that requests authentication
   */
  socket: SocketIO.Socket;
  /**
   * Sent data
   */
  data: any;
  /**
   * Resolve authentication
   */
  done: (response: AuthDoneResponse) => void;
}) => AuthDoneResponse | void | Promise<AuthDoneResponse>;

export type AuthDoneResponse = boolean | object | Error;

export type Schema = string | string[] | { [prop: string]: Schema | Schema[] };

/**
 * Parser schemas
 * @example
 * {
 *   chat: {
 *     id: 1,
 *     schema: {
 *       content: "string"
 *     }
 *   }
 * }
 */
export type ParserMapSchemas = {
  [eventName: string]: {
    id: number;
    schema: Schema;
  };
};

export type ParserIDMap = {
  [id: number]: string;
};

export type ParserPacket = {
  type: number;
  data: any[];
  nsp: string;
  id?: number;
  options?: {
    compress: boolean;
  };
};

export type Parser = {
  encode: (data: any) => Buffer;
  decode: (buffer: Buffer) => any;
};

export type ParsersList = {
  [event: string]: Parser;
};
