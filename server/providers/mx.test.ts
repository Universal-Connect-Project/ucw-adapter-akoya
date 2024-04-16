import { http, HttpResponse } from 'msw'
import { server } from '../../test/testServer'
import { institutionData } from '../../test/testData/institution'
import { MxApi } from './mx'
import { CREATE_MEMBER_PATH, DELETE_CONNECTION_PATH, DELETE_MEMBER_PATH, INSTITUTION_BY_ID_PATH } from '../../test/handlers'
import { institutionCredentialsData } from '../../test/testData/institutionCredentials'
import { extendHistoryMemberData, identifyMemberData, memberData, membersData, verifyMemberData } from '../../test/testData/members'
import config from '../config'

const token = 'testToken'

const mxApiInt = new MxApi({
  mxInt: {
    username: 'testUsername',
    password: 'testPassword'
  },
  token
}, true)

const mxApi = new MxApi({
  mxProd: {
    username: 'testUsername',
    password: 'testPassword'
  },
  token
}, false)

const institutionResponse = institutionData.institution

const clientRedirectUrl = `${config.HostUrl}/oauth/mx/redirect_from?token=${token}`

describe('mx provider', () => {
  describe('MxApi', () => {
    it('works with integration credentials', async () => {
      expect(await mxApiInt.GetInstitutionById('testId')).toEqual({
        id: institutionResponse.code,
        logo_url: institutionResponse.medium_logo_url,
        name: institutionResponse.name,
        oauth: institutionResponse.supports_oauth,
        url: institutionResponse.url,
        provider: 'mx_int'
      })
    })

    describe('GetInsitutionById', () => {
      it('uses the medium logo if available', async () => {
        expect(await mxApi.GetInstitutionById('testId')).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.medium_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          provider: 'mx'
        })
      })

      it('uses the small logo if no medium logo', async () => {
        server.use(http.get(INSTITUTION_BY_ID_PATH, () => HttpResponse.json({
          ...institutionData,
          institution: {
            ...institutionData.institution,
            medium_logo_url: undefined
          }
        })
        ))

        expect(await mxApi.GetInstitutionById('testId')).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.small_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          provider: 'mx'
        })
      })
    })

    describe('ListInstitutionCredentials', () => {
      const [firstCredential, secondCredential] = institutionCredentialsData.credentials

      it('transforms the credentials into useable form', async () => {
        expect(await mxApi.ListInstitutionCredentials('testId')).toEqual([{
          id: firstCredential.guid,
          field_name: firstCredential.field_name,
          field_type: firstCredential.field_type,
          label: firstCredential.field_name
        }, {
          id: secondCredential.guid,
          field_name: secondCredential.field_name,
          field_type: secondCredential.field_type,
          label: secondCredential.field_name
        }])
      })
    })

    describe('ListConnections', () => {
      const [firstMember, secondMember] = membersData.members

      it('retrieves and transforms the members', async () => {
        expect(await mxApi.ListConnections('testId')).toEqual([
          {
            id: firstMember.guid,
            cur_job_id: firstMember.guid,
            institution_code: firstMember.institution_code,
            is_being_aggregated: firstMember.is_being_aggregated,
            is_oauth: firstMember.is_oauth,
            oauth_window_uri: firstMember.oauth_window_uri,
            provider: 'mx'
          },
          {
            id: secondMember.guid,
            cur_job_id: secondMember.guid,
            institution_code: secondMember.institution_code,
            is_being_aggregated: secondMember.is_being_aggregated,
            is_oauth: secondMember.is_oauth,
            oauth_window_uri: secondMember.oauth_window_uri,
            provider: 'mx'
          }
        ])
      })
    })

    describe('ListConnectionCredentials', () => {
      const [firstCredential, secondCredential] = institutionCredentialsData.credentials

      it('retreieves and transforms member credentials', async () => {
        expect(await mxApi.ListConnectionCredentials('testMemberId', 'testUserId')).toEqual([{
          id: firstCredential.guid,
          field_name: firstCredential.field_name,
          field_type: firstCredential.field_type,
          label: firstCredential.field_name
        }, {
          id: secondCredential.guid,
          field_name: secondCredential.field_name,
          field_type: secondCredential.field_type,
          label: secondCredential.field_name
        }])
      })
    })

    describe('CreateConnection', () => {
      const baseConnectionRequest = {
        id: 'testId',
        initial_job_type: 'auth',
        background_aggregation_is_disabled: false,
        credentials: [{
          id: 'testCredentialId',
          label: 'testCredentialLabel',
          value: 'testCredentialValue',
          field_type: 'testCredentialFieldType',
          field_name: 'testCredentialFieldName'
        }],
        institution_id: 'testInstitutionId',
        is_oauth: false,
        skip_aggregation: false,
        metadata: 'testMetadata'
      }

      it('deletes the existing member if one is found', async () => {
        let memberDeletionAttempted = false

        server.use(http.delete(DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        }))

        await mxApi.CreateConnection({
          ...baseConnectionRequest,
          institution_id: membersData.members[0].institution_code,
          is_oauth: true
        }, 'testUserId')

        expect(memberDeletionAttempted).toBe(true)
      })

      describe('createMemberPayload spy tests', () => {
        let createMemberPayload: any

        beforeEach(() => {
          createMemberPayload = null

          server.use(http.post(CREATE_MEMBER_PATH, async ({ request }) => {
            createMemberPayload = await request.json()

            return HttpResponse.json(memberData)
          }))
        })

        it('creates member with a client_redirect_url if is_oauth', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            is_oauth: true
          }, 'testUserId')

          expect(createMemberPayload.client_redirect_url).toEqual(clientRedirectUrl)
        })

        it('creates member without a client_redirect_url if !is_oauth', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            is_oauth: false
          }, 'testUserId')

          expect(createMemberPayload.client_redirect_url).toEqual(null)
        })

        it('creates a member with skip_aggregation if requested', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            skip_aggregation: true
          }, 'testUserId')

          expect(createMemberPayload.member.skip_aggregation).toEqual(true)
        })

        it('creates a member with skip_aggregation if jobType is not aggregate', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            initial_job_type: 'auth'
          }, 'testUserId')

          expect(createMemberPayload.member.skip_aggregation).toEqual(true)
        })

        it('creates a member with !skip_aggregation if jobType is aggregate', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            initial_job_type: 'aggregate'
          }, 'testUserId')

          expect(createMemberPayload.member.skip_aggregation).toEqual(false)
        })

        it('creates a member with correctly mapped request options and returns the member from that response when is_oauth', async () => {
          await mxApi.CreateConnection({
            ...baseConnectionRequest,
            is_oauth: true
          }, 'testUserId')

          expect(createMemberPayload).toEqual({
            client_redirect_url: clientRedirectUrl,
            member: {
              credentials: [{
                guid: baseConnectionRequest.credentials[0].id,
                value: baseConnectionRequest.credentials[0].value
              }],
              institution_code: baseConnectionRequest.institution_id,
              is_oauth: true,
              skip_aggregation: true
            },
            referral_source: 'APP'
          })
        })
      })

      it('returns the member from verifyMember if job type is verification or aggregate_identity_verification', async () => {
        const verificationMember = await mxApi.CreateConnection({
          ...baseConnectionRequest,
          initial_job_type: 'verification'
        }, 'testUserId')

        expect(verificationMember.id).toEqual(verifyMemberData.member.guid)

        const aggregateMember = await mxApi.CreateConnection({
          ...baseConnectionRequest,
          initial_job_type: 'all'
        }, 'testUserId')

        expect(aggregateMember.id).toEqual(verifyMemberData.member.guid)
      })

      it('returns the member from identifyMember if job type is aggregate_identity', async () => {
        const member = await mxApi.CreateConnection({
          ...baseConnectionRequest,
          initial_job_type: 'vc_identity'
        }, 'testUserId')

        expect(member.id).toEqual(identifyMemberData.member.guid)
      })

      it('returns the member from extendHistory if job type is aggregate_extendedhistory', async () => {
        const member = await mxApi.CreateConnection({
          ...baseConnectionRequest,
          initial_job_type: 'aggregate_extendedhistory'
        }, 'testUserId')

        expect(member.id).toEqual(extendHistoryMemberData.member.guid)
      })
    })

    describe('DeleteConnection', () => {
      it('deletes the connection', async () => {
        let connectionDeletionAttempted = false

        server.use(http.delete(DELETE_CONNECTION_PATH, () => {
          connectionDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        }))

        await mxApi.DeleteConnection('testId', 'testUserId')

        expect(connectionDeletionAttempted).toBe(true)
      })
    })
  })
})
