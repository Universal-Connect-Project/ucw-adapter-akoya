import type { AdapterMap } from "@repo/utils";
import { getTemplateAdapterMapObject } from "@ucp-npm/template-adapter";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { getAkoyaAdapterMapObject } from "@ucp-npm/akoya-adapter";
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";
import config from "./config";

const templateAdapterMapObject = getTemplateAdapterMapObject();

const akoyaAdapterMapyObject = getAkoyaAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    akoyaSandbox: {
      clientId: config.AKOYA_CLIENT_ID,
      secret: config.AKOYA_SECRET,
    },
    akoyaProd: {
      clientId: config.AKOYA_CLIENT_ID_PROD,
      secret: config.AKOYA_SECRET_PROD,
    },
  },
  envConfig: {
    HostUrl: config.HOST_URL,
    WebhookHostUrl: config.WebhookHostUrl
  },
});

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...templateAdapterMapObject,
  ...testAdapterMapObject,
  ...akoyaAdapterMapyObject
};
export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
