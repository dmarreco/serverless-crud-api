import { getDocClient } from "../../../src/lib/dynamo-doc-client";
import { ScanCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

import * as fs from 'fs';
import * as path from 'path';

const userTableName = process.env.USER_TABLE || 'local.user';


export const deleteAllUsers = async () => {
    const data = await getDocClient().send(new ScanCommand({ TableName: userTableName }));

    if (data.Items && data.Items.length > 0) {
        const deleteCommands = data.Items.map((item) => ({
            DeleteRequest: {
                // TableName: userTableName,
                Key: { id: item.id.toString() },
            },
        }));

        const batchWriteCommand = { RequestItems: { [userTableName]: deleteCommands } };

        await getDocClient().send(new BatchWriteCommand(batchWriteCommand));
    }
};

export const seedUsers = async () => {
    const seedDataPath = path.join(__dirname, '../../integration/seed-data/user.data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    const putCommands = seedData.map((item: any) => ({
        PutRequest: {
            Item: item,
        },
    }));

    const batchWriteCommand = { RequestItems: { [userTableName]: putCommands } };
    
    await getDocClient().send(new BatchWriteCommand(batchWriteCommand));
};
