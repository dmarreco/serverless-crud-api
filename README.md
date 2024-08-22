# Simple C/R/U/D Serverless API

## About the project

This project is a simple, lean and yet professional-grade implementation for a simple Create / Update / Retrieve / Delete REST API, using typescript 5, middlewares, offline dry-running and test automation and other best practices. 

It's goal is to serve as a learning reference and template.

## Tools used in this project:

- [Serverless Framework](https://www.serverless.com/)
- [Jest.js](https://jestjs.io/) for test automation
- [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) for code inspection and formatting
- [Husky](https://github.com/typicode/husky) to define git hooks and impose unit test execution and linter checks before pushing
- [middy](https://github.com/middyjs/middy) middleware engine for AWS lambda. It is used to check request/response scheme, resolve application exceptions to error responses and fetch configuration from SSM, and many other handy features. Never dive into the serverless sea without it =).
- [AWS SDK for Javascript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)


## Features:

- Optimistic lock write verification
- (TODO) Input schema validation
- (TODO) Parameter resolution at runtime


## This Project Requires

- Node 20
- JRE installed and 'java' in the path (in order to run dynamodb local for the e2e local tests)
- AWS Account setup

## Setup

1. Clone the project and install local dependencies with npm

`npm install`

2. Install a local instance of dynamodb using the serverless-dynamodb plugin (https://www.npmjs.com/package/serverless-dynamodb). You can do it by executing the script 'dynamodb:install' defined in package.json as follows.

This step is useful to validate the serverless.yml and dynamo table definitions. It also enables us to run end-to-end integration tests, with seeded test data.

`npm run dynamodb:install`

> **Note**
> You must have a JRE installed and have java in your path to execute dynamodb local.

3. Start the serverless offline. This command will also start the Dynamodb local instance automatically.
   `npm run offline:start`

## Testing

You may execute all integration and unit tests locally by running:
`npm test`

> **Note**
> All integration tests ('test/integration/\*_/_') will fail if serverless offline (with dynamodb offline) is not started.

To run only the unit tests there is no need to execute previous steps 1 (install local dynamodb) nor 2 (start serverless offline) by running:
`npm run test:unit`

## Deploying

Deploying to the cloud is very simple, you can use serverless directly, providing the environment name as folows:
`npx serverless deploy --stage <stage_name>`

## Notes from the Author:

- This project may have incurred in some big design upfront, and some selected tools might look like an overshoot for such a simple service, but I wanted to show some interesting tools and approaches to use in real and more complex production projects. On the other hand, some shortcuts I would take in production code were taken for simplicity sake.
- I would certainly rely on more regression tests scenarios for a real application, production code.
- Not to use DDD was a design decision, I decided to focus on structure, SOLID and clean practices.
- The service layer encapsulate business rules. The handler layer encapsulates API contract rules.
- I decided not to create a single, idempotent endpoint for updating and creating (PUT) for simplicity, although I admit it is not a good REST modeling practice for entities. Different approaches like non-idempotent PUT, PATCHing attributes, etc exist, depending on many factors.
- All modules in 'lib' packages would be reused by many services, and in production code, should be extracted into one or many managed dependencies (something like '@my_company/lambda-utils') in a private dependency repository or available in a managed lambda layer (see https://docs.aws.amazon.com/lambda/latest/dg/chapter-layers.html).

## Possible further improvements:

- Use a proper middleware such as https://middy.js.org/ instead of the simple home-made lambda wrapper at 'lib/lambda-wrapper.ts'.
- Integrate with a parameter storage like SSM or Secrets Manager, either at runtime or deployment time.
- Define IAM role per function, adopting a more strict read/write permission policy.
- More tests scenarios are needed to achieve 100% coverage; e2e tests scenarios are meant to be less profuse, but are also missing some more scenarios.

## Know issues:

- DynamoRepository.query will break for large datasets; We must query iteratively from an offset and make it a generative function or make it return a stream somehow to avoid memory overflow.
- Got an issue when using serverless offline and trying to resolve ${aws:accountId}, so I had to hardcode the accountId in serverless.yml. Needs attention.
