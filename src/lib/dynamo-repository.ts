import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

import log from './log';

import DomainEntity from "./domain-entity";


export class PersistenceException extends Error {
    constructor(message: string) {
        super(message);
    }
}


export abstract class DynamoRepository<EntityType extends DomainEntity> {

    private _docClient: DynamoDBDocumentClient;

    protected constructor(private readonly getTableName: () => string) { }

    // TODO this client lazy getter / factory can be extracted to a specific module
    private getDocClient():  DynamoDBDocumentClient {
        if (this._docClient == null) {
            let client: DynamoDBClient;

            if (process.env['IS_OFFLINE'] === 'true') {
                log.warn('Using Local/Offline DynamoDb Custom Endpoint');
                client = new DynamoDBClient({ endpoint: 'http://localhost:8000' });
            } else {
                log.debug('Using Cloud/AWS DynamoDb Default Endpoint');
                client = new DynamoDBClient();
            }
    
            this._docClient = DynamoDBDocumentClient.from(client);
        }

        return this._docClient;
    }

    async get(id: string): Promise<EntityType | null> {
        const command = new GetCommand({
            TableName: this.getTableName(),
            Key: { id }
        });

        const commandResult = await this.getDocClient().send(command);

        if (!commandResult.Item) return null;

        return commandResult.Item as EntityType;
    }

    async list(page: number, pageSize: number): Promise<EntityType[]> {
        const commonCmdParams = {
            TableName: this.getTableName(),
            Limit: pageSize,
        };

        let commandResult;
        let lastEvaluatedKey;

        for (let i = 0; i < page; i++) {
            const isLastPage = i === page - 1;

            commandResult = await this.getDocClient().send(new ScanCommand({
                ...commonCmdParams,
                ExclusiveStartKey: lastEvaluatedKey,
                ProjectionExpression: isLastPage ? undefined : 'id', // Fetch full attributes only for the last page
            }));

            lastEvaluatedKey = commandResult?.LastEvaluatedKey;

            if (!lastEvaluatedKey)  break; // End of dataset reached before target page
        }

        if (commandResult?.Items == null) return []; // TODO should throw?

        return commandResult.Items as EntityType[]
    }

    async update(entity: EntityType): Promise<EntityType> {
        if (entity.id == null || entity.version == null) {
            throw new PersistenceException('Can not update an entity object with missing id or version attributes');
        }

        const currentVersion = Number(entity.version);
        const newVersion = Date.now();
        
        const command = new PutCommand({
            TableName: this.getTableName(),
            Item: {
                ... entity,
                version: newVersion
            },
            // the parameters below garantee optimistic lock violations will throw "ConditionalCheckFailedException: The conditional request failed" error
            ConditionExpression: '#version = :currentVersion',
            ExpressionAttributeNames: { '#version': 'version' },
            ExpressionAttributeValues: { ':currentVersion': currentVersion }
          });

          const commandResult = await this.getDocClient().send(command);

          return commandResult.Attributes as EntityType;
    }

    async create(entity: EntityType): Promise<EntityType> {
        
        if (entity.id) {
            throw new PersistenceException('Can not create a non-volatile entity object; The entity already has an id attribute - update instead');
        }

        const command = new PutCommand({
            TableName: this.getTableName(),
            Item: {
                ... entity,
                id: uuidv4(),
                version: Date.now()
            }
          });

          const commandResult = await this.getDocClient().send(command);

          return commandResult.Attributes as EntityType;
    }

}