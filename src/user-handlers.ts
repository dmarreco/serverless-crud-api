import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { UserRepo } from "./user-repo";
import { middyfy } from "./lib/middleware"; 
import { BadRequestException } from "./lib/api-exceptions";
import { User } from "./user-schema";

const userRepo = new UserRepo();

type UnserializedAPIGatewayProxyResult = APIGatewayProxyResult | { body: any }

const baseGetHandler: Handler = async (event: APIGatewayEvent & {pathParameters: {userId: string}}): Promise<UnserializedAPIGatewayProxyResult> => {

  const userId = event.pathParameters.userId;

  const user = await userRepo.get(userId);

  return {
    statusCode: 200,
    body: user,
  };
  
};


const baseListHandler: Handler = async (event: APIGatewayEvent): Promise<UnserializedAPIGatewayProxyResult> => {

  // debugger;

  let page: number | undefined, pageSize: number | undefined;

  if (event.queryStringParameters) {
    page = event.queryStringParameters.page == null ? undefined : Number(event.queryStringParameters.page);
    pageSize = event.queryStringParameters.size == null ? undefined : Number(event.queryStringParameters.size); 

    // TODO create a generic event validator using zod to avoid this type of checking
    if ( (page && isNaN(page)) || (pageSize && isNaN(pageSize)) ) {
      throw new BadRequestException();
    }
  }

  const users = await userRepo.list(page, pageSize);

  return {
    statusCode: 200,
    body: users,
  };
  
};

const baseCreateHandler: Handler = async (event: APIGatewayEvent & {body: User}): Promise<UnserializedAPIGatewayProxyResult> => {

  const user = event.body;

  const createdUser = await userRepo.create(user);

  return {
    statusCode: 201,
    body: createdUser,
  };

};  

export const get = middyfy(baseGetHandler);
export const list = middyfy(baseListHandler);
export const create = middyfy(baseCreateHandler);