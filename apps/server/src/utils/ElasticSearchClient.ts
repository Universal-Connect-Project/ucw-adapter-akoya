import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'

import type { CachedInstitution } from 'src/shared/contract'

function getInstitutionFilePath () {
  if (config.Env === 'test') {
    console.log('loading test institutions')
    return resolve(__dirname, '../../cachedDefaults/testInstitutionsMapping.json')
  } else {
    console.log('loading all institutions into elasticSearch')
    return resolve(__dirname, '../../cachedDefaults/ucwInstitutionsMapping.json')
  }
}

export default class ElasticsearchClient {
  private readonly client: Client
  private static _instance: ElasticsearchClient

  private constructor (client: Client = null) {
    if (client) {
      console.log('client passed in')
      this.client = client
    } else {
      console.log('make new client')
      this.client = new Client({
        node: config.ELASTIC_SEARCH_URL ?? 'http://localhost:9200'
      })
    }
  }

  static async initialize () {
    const client = this.getInstance().client

    const elasticSearchLoaded = await client.indices.exists({ index: 'institutions' })
    if (!elasticSearchLoaded) {
      await this.reIndexElasticSearch()
    } else {
      console.log('ElasticSearch already indexed')
    }
  }

  static getInstance (client: Client = null) {
    if (this._instance) {
      return this._instance
    }

    this._instance = new ElasticsearchClient(client)
    return this._instance
  }

  static async reIndexElasticSearch () {
    const client = this.getInstance().client
    try {
      await client.indices.delete({
        index: 'institutions'
      })
    } catch {
      console.log('Elasticsearch "institutions" index did not exist')
    }
    console.log('Elasticsearch indexing institutions')
    const dataFilePath = getInstitutionFilePath()
    const rawData = readFileSync(dataFilePath)
    const jsonData = JSON.parse(rawData.toString())

    await client.indices.create({ index: 'institutions' })

    for (const institution of jsonData) {
      await client.index({
        index: 'institutions',
        id: institution.ucp_id,
        document: institution
      })
    }
  }

  static async search (searchTerm: string): Promise<any[]> {
    const client = this.getInstance().client
    const searchResults: estypes.SearchResponseBody = await client.search({
      index: 'institutions',
      body: {
        query: {
          multi_match: {
            query: searchTerm,
            fields: ['name', 'keywords']
          }
        }
      }
    })
    return searchResults.hits.hits.map((esObject: estypes.SearchHit) => esObject._source)
  }

  static async getInstitution (id: string): Promise<CachedInstitution> {
    const client = this.getInstance().client

    const institutionResponse = await client.get({
      id,
      index: 'institutions'
    })

    return institutionResponse._source as CachedInstitution
  }

  static async getFavoriteInstitutions (): Promise<CachedInstitution[]> {
    const client = this.getInstance().client

    // Eventually the favorites list will be in the config or something, this is just a placeholder until then
    // to remove the dependency on the institution service hosted by UCP
    const favorites = ['UCP-b087caf69b372c9', 'UCP-60155b7292895ed', 'UCP-ce8334bbb890163', 'UCP-ebca9a2b2ae2cca', 'UCP-b0a4307160ecb4c', 'UCP-8c4ca4c32dbd8de', 'UCP-412ded54698c47f']
    const esSearch = favorites.map(favorite => {
      return {
        _index: 'institutions',
        _id: favorite
      }
    })

    const favoriteInstitutionsResponse: estypes.MgetRequest = await client.mget({
      docs: esSearch
    })
    const institutions = favoriteInstitutionsResponse.docs.map(favoriteInstitution => favoriteInstitution._source as CachedInstitution)
    return institutions
  }
}
