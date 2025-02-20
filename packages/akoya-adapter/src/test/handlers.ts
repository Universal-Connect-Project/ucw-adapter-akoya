import { http, HttpResponse } from 'msw'

// import { BASE_PATH as AKOYA_BASE_PATH } from '../apiClient'

import { paymentData } from './testData/payments';
import { accountsData } from "./testData/accounts";
import { balanceData } from './testData/balances';
import { investmentData } from './testData/investments';
import { tokenData } from './testData/token';
import { transactionData } from './testData/transactions';
import { customerData } from './testData/customer';

const AKOYA_BASE_PATH = 'https://sandbox-idp.ddp.akoya.com'
const AKOYA_BASE_PROD_PATH = 'https://idp.ddp.akoya.com'

const handlers = [
  http.post(`${AKOYA_BASE_PATH}/token`, ({request}) =>
    HttpResponse.json(tokenData)
  ),
  http.post(`${AKOYA_BASE_PROD_PATH}/token`, ({request}) =>
    HttpResponse.json(tokenData)
  ),
  http.get(`${AKOYA_BASE_PATH}/accounts-info/v2/mikomo`, ({request}) =>{
      return HttpResponse.json(accountsData);
  }),
  http.get(`${AKOYA_BASE_PROD_PATH}/accounts-info/v2/mikomo`, ({request}) =>{
      return HttpResponse.json(accountsData);
  }),
  http.get(`${AKOYA_BASE_PATH}/balances/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(balanceData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_BASE_PATH}/accounts/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(investmentData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_BASE_PATH}/payments/v2/mikomo/accountId/payment-networks`, () => {
    return HttpResponse.json(paymentData)
  }),
  http.get(`${AKOYA_BASE_PROD_PATH}/transactions/v2/mikomo/839502593?offset=0&limit=50`, () => {
    return HttpResponse.json(transactionData)
  }),
  http.get(`${AKOYA_BASE_PATH}/customers/v2/mikomo/current`, () => {
    return HttpResponse.json(customerData)
  })
]

export default handlers
