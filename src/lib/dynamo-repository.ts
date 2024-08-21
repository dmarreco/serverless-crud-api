import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import DomainEntity from './domain-entity';
import log from './log';
import { OptimisticLockException } from './business-exceptions';

export default class DynamoRepository<T extends DomainEntity> {
  private client: DynamoDB.DocumentClient;
  private tableName: string;

  constructor(tablePropertyName: string) {
    const tableName = process.env[tablePropertyName];

    if (tableName == null)
      throw new Error(
        `Expected environment variable is missing: ${tablePropertyName}; check service env configuration`
      ); // This is an 'unhandled' exception and will result on a lambda error (and API response 5XX)

    this.tableName = tableName;

    log.info('ENV', process.env);

    if (process.env.IS_OFFLINE === 'true') {
      log.warn('Using Local/Offline DynamoDb Custom Endpoint');
      this.client = new DynamoDB.DocumentClient({ endpoint: 'http://localhost:8000' });
    } else {
      log.debug('Using Cloud/AWS DynamoDb Default Endpoint');
      this.client = new DynamoDB.DocumentClient();
    }
  }

  /**
   * Retrieve a record by its primary unique identifier (uuid)
   *
   * @param {*Entity's unique universal identifier} id Unique identifier (uuid) for the entity.
   */
  async get(id: string): Promise<T | undefined> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: { id }
    };

    log.debug('Dynamodb get request', params);
    const response = await this.client.get(params).promise();

    log.debug('Dynamodb get result retrieved', response);

    return response.Item as T;
  }

  async create(entity: T): Promise<T> {
    entity.id = uuidv4();
    entity.version = Date.now();

    const params = {
      TableName: this.tableName,
      Item: entity,
      ReturnValues: 'NONE'
    };

    log.debug('Database put request (create)', params);
    const result = await this.client.put(params).promise();

    log.debug('Database put response (create)', result);

    return entity;
  }

  async query(key: string, fieldName: string, indexName?: string): Promise<T[]> {
    const params = {
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: '#field = :key',
      ExpressionAttributeNames: { '#field': fieldName },
      ExpressionAttributeValues: { ':key': key },
      ScanIndexForward: false
    };

    if (!indexName) delete params.IndexName;

    log.debug('Database query request', params);
    const response = await this.client.query(params).promise();

    log.debug('Database query response', response);

    if (response.Items == null) return [];

    return response.Items?.map((i) => i as T);
  }

  async update(entity: T): Promise<T> {
    const currentVersion = Number(entity.version);
    const newVersion = Date.now();

    entity.version = newVersion;
    const params = {
      TableName: this.tableName,
      IndexName: 'uuid-index',
      Key: entity.id,
      Item: entity,
      // the parameters below garantee optimistic lock violations will throw "ConditionalCheckFailedException: The conditional request failed" error
      ConditionExpression: '#version = :currentVersion',
      ExpressionAttributeNames: { '#version': 'version' },
      ExpressionAttributeValues: { ':currentVersion': currentVersion }
    };

    try {
      log.debug('Database put request (update)', params);
      const result = await this.client.put(params).promise();

      log.debug('Database put response (update)', result);
    } catch (error) {
      if ('' + error === 'ConditionalCheckFailedException: The conditional request failed')
        throw new OptimisticLockException();
      else throw error;
    }

    return entity;
  }
}
