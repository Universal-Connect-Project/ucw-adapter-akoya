import { enc } from "crypto-js";
import axios from "axios";
import type { LogClient, ApiCredentials } from "./models";

export const BASE_PATH = 'products.ddp.akoya.com'

function makeAkoyaAuthHeaders(apiConfig) {
  const words = enc.Utf8.parse(`${apiConfig.clientId}:${apiConfig.secret}`);
  return {
    Authorization: `Basic ${enc.Base64.stringify(words)}`,
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json",
  };
}

function makeAkoyaBearerHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };
}

export default class AkoyaClient {
  apiConfig: ApiCredentials;
  client_redirect_url: string;
  authParams: object;
  envConfig: Record<string, string>;
  logger: LogClient;

  constructor(sandbox, apiConfig, logger, envConfig){
    this.apiConfig = sandbox ? {
      ...apiConfig,
      basePath: "https://sandbox-idp.ddp.akoya.com",
      productPath: "https://sandbox-products.ddp.akoya.com",
      apiVersion: 'v2',
      aggregator: "akoya_sandbox",
      available: true,
    } : {
      ...apiConfig,
      basePath: "https://idp.ddp.akoya.com",
      productPath: "https://products.ddp.akoya.com",
      apiVersion: 'v2',
      aggregator: "akoya",
      available: true,
    };
    this.logger = logger;
    this.envConfig = envConfig;
    this.client_redirect_url = `${this.envConfig.HostUrl}/oauth/${this.apiConfig.aggregator}/redirect_from`;
    this.authParams = {
      client_id: apiConfig.clientId,
      client_secret: apiConfig.secret,
    };
  }

  getOauthUrl(institutionId, state) {
    return `${this.apiConfig.basePath}/auth?connector=${institutionId}&client_id=${this.apiConfig.clientId}&redirect_uri=${this.client_redirect_url}&state=${state}&response_type=code&scope=openid email profile offline_access`;
  }

  async getIdToken(authCode) {
    const body = {
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: this.client_redirect_url,
    };
    // let body = `grant_type=authorization_code&code=${authCode}`; //&redirect_uri=${this.client_redirect_url}
    return await this.post("token", body);
  }

  async refreshToken(existingRefreshToken) {
    return await this.post("token", {
      grant_type: "refresh_token",
      refresh_token: existingRefreshToken,
      client_id: this.apiConfig.clientId,
      client_secret: this.apiConfig.secret,
    });
  }

  async getAccountInfo(institutionId, accountIds, token) {
    return await this.get(
      `accounts-info/${this.apiConfig.apiVersion}/${institutionId}`,
      token,
    ).then((res) => res.accounts);
  }

  async getBalances(institutionId, token) {
    return await this.get(`balances/${this.apiConfig.apiVersion}/${institutionId}`, token);
  }

  async getInvestments(institutionId, token) {
    return await this.get(`accounts/${this.apiConfig.apiVersion}/${institutionId}`, token);
  }

  async getPayments(institutionId, accountId, token) {
    return await this.get(
      `payments/${this.apiConfig.apiVersion}/${institutionId}/${accountId}/payment-networks`,
      token,
    );
  }

  async getTransactions(institutionId, accountId, token) {
    let ret = await this.get(
      `transactions/${this.apiConfig.apiVersion}/${institutionId}/${accountId}?offset=0&limit=50`,
      token,
    );
    return ret?.transactions
  }

  async getCustomerInfo(institutionId, token) {
    let ret = await this.get(
      `customers/${this.apiConfig.apiVersion}/${institutionId}/current`,
      token,
    );
    return ret.customer
  }

  async post(path, body) {
    const headers = makeAkoyaAuthHeaders(this.apiConfig);
    return await this._post(
      `${this.apiConfig.basePath}/${path}`,
      body,
      headers,
    );
  }

  async get(path, token) {
    const headers = makeAkoyaBearerHeaders(token);
    return await this._get(`${this.apiConfig.productPath}/${path}`, headers);
  }


  async _get(url, headers) {
    this.logger.debug(`get request: ${url}`);
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`error from ${url}`, error);
      throw error;
    }
  }

  async _post(url, data, headers) {
    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`error from ${url}`, error);
      throw error;
    }
  }
}