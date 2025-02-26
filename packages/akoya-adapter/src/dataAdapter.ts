import type { VCDependencies } from "./models";
import AkoyaClient from './apiClient';
import { VCAdapterInput, VCDataTypes } from "@repo/utils";

const createDataAdapter = (sandbox: boolean, dependencies: VCDependencies) => {
  return async ({
    connectionId,
    type,
    userId,
    accountId,
    startTime,
    endTime,
                }: VCAdapterInput) => {

    const { logClient, envConfig, aggregatorCredentials } = dependencies;
    const configuration = sandbox
      ? aggregatorCredentials.akoyaSandbox
      : aggregatorCredentials.akoyaProd;
    const vcClient =  new AkoyaClient(sandbox, configuration, logClient, envConfig)
    let token = JSON.parse(userId)
    const institutionId = connectionId;
    switch(type){
      case 'identity':
        let customer = await vcClient.getCustomerInfo(institutionId, token.id_token);
        return {customers: [customer]};
      case 'accounts':
        let accounts = await vcClient.getAccountInfo(institutionId, [], token.id_token);
        return {accounts};
      case 'transactions':
        const transactions = await vcClient.getTransactions(institutionId, accountId, token.id_token, startTime, endTime);
        return {transactions};
    }
  };
};

export const createAkoyaProdDataAdapter = (dependencies: VCDependencies) => createDataAdapter(false, dependencies);
export const createAkoyaSandboxDataAdapter = (dependencies: VCDependencies) => createDataAdapter(true, dependencies);
