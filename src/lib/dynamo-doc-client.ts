import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import log from './log';

let _docClient: DynamoDBDocumentClient;

export function getDocClient():  DynamoDBDocumentClient {
    if (_docClient == null) {
        let client: DynamoDBClient;

        if (process.env['IS_OFFLINE'] === 'true') {
            log.warn('Using Local/Offline DynamoDb Custom Endpoint');
            client = new DynamoDBClient({ endpoint: 'http://localhost:8000' });
        } else {
            log.debug('Using Cloud/AWS DynamoDb Default Endpoint');
            client = new DynamoDBClient();
        }

        _docClient = DynamoDBDocumentClient.from(client);
    }

    return _docClient;
}