import { ConnectionStatus } from '@repo/utils'
import { TestAdapter } from './adapter'
import { testExampleInstitution } from './constants'

const labelText = 'testLabelText'
const provider = 'provider'

const testAdapter = new TestAdapter({
  labelText,
  provider
})

describe('TestAdapter', () => {
  describe('GetInstitutionById', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.GetInstitutionById('test')).toEqual({
        id: 'test',
        logo_url: testExampleInstitution.logo_url,
        name: testExampleInstitution.name,
        oauth: testExampleInstitution.oauth,
        provider,
        url: testExampleInstitution.url
      })
    })
  })

  describe('ListInstitutionCredentials', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ListInstitutionCredentials('test')).toEqual([
        {
          field_name: 'fieldName',
          field_type: 'fieldType',
          id: 'testId',
          label: labelText
        }
      ])
    })
  })

  describe('ListConnections', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ListConnections('test')).toEqual([
        {
          id: 'testId',
          cur_job_id: 'testJobId',
          institution_code: 'testCode',
          is_being_aggregated: false,
          is_oauth: false,
          oauth_window_uri: undefined,
          provider
        }
      ])
    })
  })

  describe('ListConnectionCredentials', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.ListConnectionCredentials('test', 'test')
      ).toEqual([
        {
          id: 'testId',
          field_name: 'testFieldName',
          field_type: 'testFieldType',
          label: labelText
        }
      ])
    })
  })

  describe('CreateConnection', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.CreateConnection(undefined, 'test')).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        provider
      })
    })
  })

  describe('UpdateConnection', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.UpdateConnection(undefined, 'test')).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        provider
      })
    })
  })

  describe('UpdateConnectionInternal', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.UpdateConnectionInternal(undefined, 'test')
      ).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        provider
      })
    })
  })

  describe('GetConnectionById', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.GetConnectionById(undefined, 'test')).toEqual({
        id: 'testId',
        institution_code: 'testCode',
        is_oauth: false,
        is_being_aggregated: false,
        oauth_window_uri: undefined,
        provider,
        user_id: 'test'
      })
    })
  })

  describe('GetConnectionStatus', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.GetConnectionStatus('test', 'test', false, 'userId')
      ).toEqual({
        provider,
        id: 'testId',
        cur_job_id: 'testJobId',
        user_id: 'userId',
        status: ConnectionStatus.CONNECTED,
        challenges: []
      })
    })
  })

  describe('AnswerChallenge', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.AnswerChallenge(undefined, 'test', 'test')
      ).toEqual(true)
    })
  })

  describe('ResolveUserId', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ResolveUserId('userId', false)).toEqual('userId')
    })
  })
})
