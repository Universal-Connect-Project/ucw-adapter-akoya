import { server } from '../test/testServer'
import config from '../config'
import { SophtronAdapter } from './sophtron'
import { HttpResponse, http } from 'msw'
import {
  SOPHTRON_DELETE_MEMBER_PATH,
  SOPHTRON_INSTITUTION_BY_ID_PATH,
  SOPHTRON_MEMBER_BY_ID
} from '../test/handlers'
import { sophtronInstitutionData } from '../test/testData/institution'

const adapter = new SophtronAdapter({
  sophtron: {
    clientId: 'testClientId',
    endpoint: config.SophtronApiServiceEndpoint,
    secret: 'testSecret'
  }
})

const testId = 'testId'
const testUserId = 'testUserId'

describe('sophtron adapter', () => {
  describe('clear connection', () => {
    it('calls delete member if there is a vc issues', async () => {
      let memberDeletionAttempted = false

      server.use(
        http.delete(SOPHTRON_DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        })
      )

      await adapter.clearConnection({ issuer: true }, testId, testUserId)

      expect(memberDeletionAttempted).toBe(true)
    })

    it('doesnt call delete member if there is not a vc issuer', async () => {
      let memberDeletionAttempted = false

      server.use(
        http.delete(SOPHTRON_DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        })
      )

      await adapter.clearConnection({}, testId, testUserId)

      expect(memberDeletionAttempted).toBe(false)
    })
  })

  describe('GetInstitutionById', () => {
    it('returns a modified institution object', async () => {
      const response = await adapter.GetInstitutionById(testId)

      expect(response).toEqual({
        id: sophtronInstitutionData.InstitutionID,
        logo_url: sophtronInstitutionData.Logo,
        name: sophtronInstitutionData.InstitutionName,
        provider: 'sophtron',
        url: sophtronInstitutionData.URL
      })
    })
  })

  describe('ListInstitutionCredentials', () => {
    it('uses custom login form user name and password if provided', async () => {
      const customName = 'customName'
      const customPassword = 'customPassword'

      server.use(
        http.post(SOPHTRON_INSTITUTION_BY_ID_PATH, () =>
          HttpResponse.json({
            ...sophtronInstitutionData,
            InstitutionDetail: {
              LoginFormUserName: customName,
              LoginFormPassword: customPassword
            }
          })
        )
      )

      const response = await adapter.ListInstitutionCredentials(testId)

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'customName'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'customPassword'
        }
      ])
    })

    it('Uses standard User name and Password if nothing custom is provided', async () => {
      const response = await adapter.ListInstitutionCredentials(testId)

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'User name'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'Password'
        }
      ])
    })
  })

  describe('ListConnectionCredentials', () => {
    it('returns a list of institution credentials if available using the InstitutionId', async () => {
      let institutionId = null

      server.use(
        http.get(SOPHTRON_MEMBER_BY_ID, ({ params }) => {
          institutionId = params.memberId

          return HttpResponse.json({})
        })
      )

      const response = await adapter.ListConnectionCredentials(
        testId,
        testUserId
      )

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'User name'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'Password'
        }
      ])

      expect(institutionId).toEqual(testId)
    })

    it('returns an empty array if there is no member', async () => {
      server.use(
        http.get(SOPHTRON_MEMBER_BY_ID, () => HttpResponse.json(undefined))
      )

      const response = await adapter.ListConnectionCredentials(
        testId,
        testUserId
      )

      expect(response).toEqual([])
    })
  })

  describe('ListConnections', () => {
    it('returns an empty array', async () => {
      expect(await adapter.ListConnections()).toEqual([])
    })
  })
})
