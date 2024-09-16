import { getDocClient } from "./dynamo-doc-client";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

import log from './log';

import {DomainEntity} from "./domain-entity-schema";


export class PersistenceException extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class OptimisticLockingException extends PersistenceException {
    readonly statusCode = 409;
    
    constructor() {
        super('Optimistic lock violation');
    }
}

export class UnexistingEntityException extends PersistenceException {
    readonly statusCode = 404;

    constructor() {
        super('No entity with the given id currently exists');
    }
}

export abstract class DynamoRepository<EntityType extends DomainEntity> {

    private _docClient: DynamoDBDocumentClient;

    protected constructor(private readonly getTableName: () => string) { }

    // TODO this client lazy getter / factory can be extracted to a specific module


    async get(id: string): Promise<EntityType> {
        const command = new GetCommand({
            TableName: this.getTableName(),
            Key: { id }
        });

        log.debug('sending command', command.input);

        const commandResult = await getDocClient().send(command);

        if (!commandResult.Item) throw new UnexistingEntityException();

        return commandResult.Item as EntityType;
    }

    async list(page: number = 1, pageSize?: number): Promise<EntityType[]> {

        let commandResult;
        let lastEvaluatedKey;

        for (let i = 0; i < page; i++) {
            const isLastPage = i === page - 1;

            const command: QueryCommand = new QueryCommand({
                TableName: this.getTableName(),
                IndexName: 'GSI1',
                KeyConditionExpression: '#GSI1_PK = :GSI1_PK_VAL',
                ExpressionAttributeNames: {
                    '#GSI1_PK': 'GSI1_PK',
                },
                ExpressionAttributeValues: {
                    ':GSI1_PK_VAL': '1',
                },

                ScanIndexForward: true,
                Limit: pageSize,
                ExclusiveStartKey: lastEvaluatedKey,
                ProjectionExpression: isLastPage ? undefined : 'id', // Fetch full attributes only for the target page
            });

            log.debug('sending command', command.input);

            commandResult = await getDocClient().send(command);

            lastEvaluatedKey = commandResult?.LastEvaluatedKey;

            if (!lastEvaluatedKey) break; // End of dataset reached before target page
        }

        if (commandResult?.Items == null) return []; // TODO should throw?

        return commandResult.Items as EntityType[]
    }

    async update(entity: EntityType): Promise<EntityType> {
        if (entity.id == null || entity.version == null) {
            throw new PersistenceException('Can not update an entity object with missing id or version attributes');
        }

        const currentVersion = Number(entity.version);

        const existing = await this.get(entity.id);

        if (existing == null) throw new UnexistingEntityException();

        const item = {
            ...entity,
            version: Date.now()
        }

        const command = new PutCommand({
            TableName: this.getTableName(),
            Item: item,
            // the parameters below garantee optimistic lock violations will throw "ConditionalCheckFailedException: The conditional request failed" error
            ConditionExpression: '#version = :currentVersion',
            ExpressionAttributeNames: { '#version': 'version' },
            ExpressionAttributeValues: { ':currentVersion': currentVersion },
        });

        log.debug('sending command', command.input);

        try {
            await getDocClient().send(command);
        } catch (err) {
            if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
                throw new OptimisticLockingException();
            }
            throw err;
        }

        return item as EntityType;
    }

    async create(entity: EntityType): Promise<EntityType> {

        if (entity.id) {
            throw new PersistenceException('Can not create a non-volatile entity object; The entity already has an id attribute - update instead');
        }

        const GSI1_PK = '1'; // constant, this GSI is useful only used to sort all records by name

        const newEntity = {
            ...entity,
            id: uuidv4(),
            version: Date.now(),
            GSI1_PK
        };

        const command = new PutCommand({
            TableName: this.getTableName(),
            Item: newEntity,
        });

        log.debug('sending command', command.input);

        await getDocClient().send(command);

        return newEntity as EntityType;
    }

}