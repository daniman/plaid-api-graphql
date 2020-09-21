const { ApolloServer, gql } = require("apollo-server");
var util = require("util");
var envvar = require("envvar");
var path = require("path");
var bodyParser = require("body-parser");
var moment = require("moment");
var plaid = require("plaid");

require("dotenv").config();

var APP_PORT = process.env.APP_PORT;
var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_ENV = process.env.PLAID_ENV;
var PLAID_PRODUCTS = process.env.PLAID_PRODUCTS.split(",");
var PLAID_COUNTRY_CODES = process.env.PLAID_COUNTRY_CODES.split(",");
var PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI;

// We store the access_token in memory - in production, store it in a secure
// persistent data store
var ACCESS_TOKEN = "aaaa_FAKE_TOKEN_bbbb";

var PUBLIC_TOKEN = null;
var ITEM_ID = null;
// The payment_id is only relevant for the UK Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store
var PAYMENT_ID = null;

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)
var client = new plaid.Client({
  clientID: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: plaid.environments[PLAID_ENV],
  options: {
    version: "2019-05-29",
  },
});

const typeDefs = gql`
  type Transaction {
    id: ID!
    code: String
    type: String
    account: Account
    name: String
    merchantName: String
    amount: Float!
    date: String!
    pending: Boolean
    categoryId: String
    accountOwner: String
    paymentChannel: String
    isoCurrencyCode: String
    pendingTransactionId: ID
    unofficialCurrencyCode: String
    authorizedDate: String
    category: [String]
    # location: [Object],
    # payment_meta: [Object],
  }

  type Balances {
    available: Float
    current: Float
    isoCurrencyCode: String
    limit: Float
    unofficialCurrencyCode: String
  }

  type Account {
    id: ID
    mask: String
    name: String
    officialName: String
    subtype: String
    type: String
    balances: Balances
  }

  type LinkToken {
    token: String!
    expiration: String!
  }

  type Query {
    transactions(accessToken: String): [Transaction!]
  }

  type Mutation {
    getLinkToken: LinkToken
    getAccessToken(publicToken: String!): Boolean
  }
`;

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

const snakeToCamel = (object) => {
  const newObj = {};
  Object.entries(object).forEach(([key, value]) => {
    newObj[toCamel(key)] =
      !!value && typeof value === "object" && !(value instanceof Array)
        ? snakeToCamel(value)
        : value;
  });
  return newObj;
};

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Mutation: {
    getLinkToken: () =>
      client
        .createLinkToken({
          user: {
            client_user_id: "user-id", // a unique id for the current user.
          },
          client_name: "Plaid Quickstart",
          products: PLAID_PRODUCTS,
          country_codes: PLAID_COUNTRY_CODES,
          language: "en",
        })
        .then((createTokenResponse) => ({
          token: createTokenResponse.link_token,
          expiration: createTokenResponse.expiration,
        }))
        .catch((err) => new Error(err)),
    getAccessToken: (_context, args) =>
      // Exchange token flow - exchange a Link public_token for an API access_token
      // https://plaid.com/docs/#exchange-token-flow
      client
        .exchangePublicToken(args.publicToken)
        .then((tokenResponse) => {
          ACCESS_TOKEN = tokenResponse.access_token;
          ITEM_ID = tokenResponse.item_id;

          return tokenResponse.status_code === 200;
        })
        .catch((err) => new Error(err)),
  },
  Query: {
    transactions: (_context, args) =>
      client
        .getTransactions(
          args.accessToken || ACCESS_TOKEN,
          moment().subtract(60, "days").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
          {
            count: 250,
            offset: 0,
          }
        )
        .then((response) => {
          return response.transactions.map((res) => {
            const account =
              response.accounts.find((a) => a.account_id === res.account_id) ||
              {};

            return snakeToCamel({
              ...res,
              id: res.transaction_id,
              code: res.transaction_code,
              type: res.transaction_type,
              account: {
                ...account,
                id: account.account_id,
              },
            });
          });
        })
        .catch((err) => new Error(err)),
  },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers, playground: false });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(
    `🚀  Server ready at ${url}\nQuery at https://studio-staging.apollographql.com/dev`
  );
});

// app.get('/', function(request, response, next) {
//   response.sendFile('./views/index.html', { root: __dirname });
// });

// // This is an endpoint defined for the OAuth flow to redirect to.
// app.get('/oauth-response.html', function(request, response, next) {
//   response.sendFile('./views/oauth-response.html', { root: __dirname });
// });

// app.post('/api/info', function(request, response, next) {
//   response.json({
//     item_id: ITEM_ID,
//     access_token: ACCESS_TOKEN,
//     products: PLAID_PRODUCTS
//   })
// });

// // Create a link token with configs which we can then use to initialize Plaid Link client-side.
// // See https://plaid.com/docs/#payment-initiation-create-link-token-request
// app.post('/api/create_link_token_for_payment', function(request, response, next) {
//     client.createPaymentRecipient(
//       'Harry Potter',
//       'GB33BUKB20201555555555',
//       {
//         'street':      ['4 Privet Drive'],
//         'city':        'Little Whinging',
//         'postal_code': '11111',
//         'country':     'GB'
//       },
//       function(error, createRecipientResponse) {
//         var recipientId = createRecipientResponse.recipient_id

//         client.createPayment(
//           recipientId,
//           'payment_ref',
//           {
//             'value': 12.34,
//             'currency': 'GBP'
//           },
//           function(error, createPaymentResponse) {
//             prettyPrintResponse(createPaymentResponse)
//             var paymentId = createPaymentResponse.payment_id
//             PAYMENT_ID = paymentId;
//             const configs = {
//               'user': {
//                 // This should correspond to a unique id for the current user.
//                 'client_user_id': 'user-id',
//               },
//               'client_name': "Plaid Quickstart",
//               'products': PLAID_PRODUCTS,
//               'country_codes': PLAID_COUNTRY_CODES,
//               'language': "en",
//               'payment_initiation': {
//                  'payment_id': paymentId
//               }
//             };
//             if (PLAID_REDIRECT_URI !== '') {
//               configs.redirect_uri = PLAID_REDIRECT_URI;
//             }
//             client.createLinkToken(
//             {
//                'user': {
//                  // This should correspond to a unique id for the current user.
//                  'client_user_id': 'user-id',
//                },
//                'client_name': "Plaid Quickstart",
//                'products': PLAID_PRODUCTS,
//                'country_codes': PLAID_COUNTRY_CODES,
//                'language': "en",
//                'redirect_uri': PLAID_REDIRECT_URI,
//                'payment_initiation': {
//                   'payment_id': paymentId
//                }
//              }, function(error, createTokenResponse) {
//               if (error != null) {
//                 prettyPrintResponse(error);
//                 return response.json({
//                   error: error,
//                 });
//               }
//               response.json(createTokenResponse);
//             })
//           }
//         )
//       }
//     )
// });

// // Retrieve an Item's accounts
// // https://plaid.com/docs/#accounts
// app.get('/api/accounts', function(request, response, next) {
//   client.getAccounts(ACCESS_TOKEN, function(error, accountsResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(accountsResponse);
//     response.json(accountsResponse);
//   });
// });

// // Retrieve ACH or ETF Auth data for an Item's accounts
// // https://plaid.com/docs/#auth
// app.get('/api/auth', function(request, response, next) {
//   client.getAuth(ACCESS_TOKEN, function(error, authResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(authResponse);
//     response.json(authResponse);
//   });
// });

// // Retrieve Identity for an Item
// // https://plaid.com/docs/#identity
// app.get('/api/identity', function(request, response, next) {
//   client.getIdentity(ACCESS_TOKEN, function(error, identityResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(identityResponse);
//     response.json({identity: identityResponse.accounts});
//   });
// });

// // Retrieve real-time Balances for each of an Item's accounts
// // https://plaid.com/docs/#balance
// app.get('/api/balance', function(request, response, next) {
//   client.getBalance(ACCESS_TOKEN, function(error, balanceResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(balanceResponse);
//     response.json(balanceResponse);
//   });
// });

// // Retrieve Holdings for an Item
// // https://plaid.com/docs/#investments
// app.get('/api/holdings', function(request, response, next) {
//   client.getHoldings(ACCESS_TOKEN, function(error, holdingsResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(holdingsResponse);
//     response.json({error: null, holdings: holdingsResponse});
//   });
// });

// // Retrieve Investment Transactions for an Item
// // https://plaid.com/docs/#investments
// app.get('/api/investment_transactions', function(request, response, next) {
//   var startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
//   var endDate = moment().format('YYYY-MM-DD');
//   client.getInvestmentTransactions(ACCESS_TOKEN, startDate, endDate, function(error, investmentTransactionsResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(investmentTransactionsResponse);
//     response.json({error: null, investment_transactions: investmentTransactionsResponse});
//   });
// });

// // Create and then retrieve an Asset Report for one or more Items. Note that an
// // Asset Report can contain up to 100 items, but for simplicity we're only
// // including one Item here.
// // https://plaid.com/docs/#assets
// app.get('/api/assets', function(request, response, next) {
//   // You can specify up to two years of transaction history for an Asset
//   // Report.
//   var daysRequested = 10;

//   // The `options` object allows you to specify a webhook for Asset Report
//   // generation, as well as information that you want included in the Asset
//   // Report. All fields are optional.
//   var options = {
//     client_report_id: 'Custom Report ID #123',
//     // webhook: 'https://your-domain.tld/plaid-webhook',
//     user: {
//       client_user_id: 'Custom User ID #456',
//       first_name: 'Alice',
//       middle_name: 'Bobcat',
//       last_name: 'Cranberry',
//       ssn: '123-45-6789',
//       phone_number: '555-123-4567',
//       email: 'alice@example.com',
//     },
//   };
//   client.createAssetReport(
//     [ACCESS_TOKEN],
//     daysRequested,
//     options,
//     function(error, assetReportCreateResponse) {
//       if (error != null) {
//         prettyPrintResponse(error);
//         return response.json({
//           error: error,
//         });
//       }
//       prettyPrintResponse(assetReportCreateResponse);

//       var assetReportToken = assetReportCreateResponse.asset_report_token;
//       respondWithAssetReport(20, assetReportToken, client, response);
//     });
// });

// // This functionality is only relevant for the UK Payment Initiation product.
// // Retrieve Payment for a specified Payment ID
// app.get('/api/payment', function(request, response, next) {
//   client.getPayment(PAYMENT_ID, function(error, paymentGetResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error,
//       });
//     }
//     prettyPrintResponse(paymentGetResponse);
//     response.json({error: null, payment: paymentGetResponse});
//   });
// });

// // Retrieve information about an Item
// // https://plaid.com/docs/#retrieve-item
// app.get('/api/item', function(request, response, next) {
//   // Pull the Item - this includes information about available products,
//   // billed products, webhook information, and more.
//   client.getItem(ACCESS_TOKEN, function(error, itemResponse) {
//     if (error != null) {
//       prettyPrintResponse(error);
//       return response.json({
//         error: error
//       });
//     }
//     // Also pull information about the institution
//     client.getInstitutionById(itemResponse.item.institution_id, function(err, instRes) {
//       if (err != null) {
//         var msg = 'Unable to pull institution information from the Plaid API.';
//         console.log(msg + '\n' + JSON.stringify(error));
//         return response.json({
//           error: msg
//         });
//       } else {
//         prettyPrintResponse(itemResponse);
//         response.json({
//           item: itemResponse.item,
//           institution: instRes.institution,
//         });
//       }
//     });
//   });
// });

// var server = app.listen(APP_PORT, function() {
//   console.log('plaid-quickstart server listening on port ' + APP_PORT);
// });

// // This is a helper function to poll for the completion of an Asset Report and
// // then send it in the response to the client. Alternatively, you can provide a
// // webhook in the `options` object in your `/asset_report/create` request to be
// // notified when the Asset Report is finished being generated.
// var respondWithAssetReport = (
//   numRetriesRemaining,
//   assetReportToken,
//   client,
//   response
// ) => {
//   if (numRetriesRemaining == 0) {
//     return response.json({
//       error: 'Timed out when polling for Asset Report',
//     });
//   }

//   var includeInsights = false;
//   client.getAssetReport(
//     assetReportToken,
//     includeInsights,
//     function(error, assetReportGetResponse) {
//       if (error != null) {
//         prettyPrintResponse(error);
//         if (error.error_code == 'PRODUCT_NOT_READY') {
//           setTimeout(
//             () => respondWithAssetReport(
//               --numRetriesRemaining, assetReportToken, client, response),
//             1000
//           );
//           return
//         }

//         return response.json({
//           error: error,
//         });
//       }

//       client.getAssetReportPdf(
//         assetReportToken,
//         function(error, assetReportGetPdfResponse) {
//           if (error != null) {
//             return response.json({
//               error: error,
//             });
//           }

//           response.json({
//             error: null,
//             json: assetReportGetResponse.report,
//             pdf: assetReportGetPdfResponse.buffer.toString('base64'),
//           })
//         }
//       );
//     }
//   );
// };
