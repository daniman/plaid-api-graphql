# Quickstart for plaid-node

To run this application locally, first install it and then run either of the flows described below. Additionally, please also refer to the [Quickstart guide](https://plaid.com/docs/quickstart).

You'll need a `.env` file in this `/server` folder set up with the following variables:

```bash
# Start the Quickstart with your API keys from the Dashboard
# https://dashboard.plaid.com/account/keys
PLAID_CLIENT_ID=<CLIENT ID from your Plaid dashboard>
PLAID_SECRET=<SECRET from your Plaid dashboard>

APP_PORT=8000
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US,CA
PLAID_REDIRECT_URI=
PLAID_ENV=sandbox
```

Then you'll be able to use this command to run the app in watch mode, and have your server reload when files change.

```bash
npm install
npm start
```

### Link token creation and server-side configuration.

The [recommended way to initialize Plaid Link](https://plaid.com/docs/#create-link-token) is to pass Plaid Link initialization
parameters server-side to `link/token/create`. The server then returns the link token,
which the client can then use to initialize Plaid Link.

When the client initializes Plaid Link with the link token, the Plaid Link
initialization parameters associated with the Plaid Token will be applied.
Note - If you want to use the [Payment Initiation][payment-initiation] product, you will need to [contact Sales][contact-sales] to get this product enabled.
