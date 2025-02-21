import type { VCDependencies } from "./models";
import AkoyaClient from './apiClient';

const createDataAdapter = (sandbox: boolean, dependencies: VCDependencies) => {
  return async ({
    connectionId,
    type,
    userId,
    accountId
                }: {
    connectionId: string
    type: string
    userId: string
    accountId?: string
  }) => {

    const { logClient, envConfig, aggregatorCredentials } = dependencies;
    const configuration = sandbox
      ? aggregatorCredentials.akoyaSandbox
      : aggregatorCredentials.akoyaProd;
    const vcClient =  new AkoyaClient(sandbox, configuration, logClient, envConfig)
    let token = await vcClient.getIdToken(userId)
    const institutionId = connectionId;
    switch(type){
      case 'identity':
        let customer = await vcClient.getCustomerInfo(institutionId, token.id_token);
        return {customers: [customer]};
      case 'accounts':
        let accounts = await vcClient.getAccountInfo(institutionId, [], token.id_token);
        return {accounts};
      case 'transactions':
        const transactions = await vcClient.getTransactions(institutionId, accountId, token.id_token);
        return {transactions};
    }
  };
};

export const createAkoyaProdDataAdapter = (dependencies: VCDependencies) => createDataAdapter(false, dependencies);
export const createAkoyaSandboxDataAdapter = (dependencies: VCDependencies) => createDataAdapter(true, dependencies);
