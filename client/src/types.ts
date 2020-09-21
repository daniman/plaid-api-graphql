/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: GetLinkToken
// ====================================================

export interface GetLinkToken_getLinkToken {
  __typename: "LinkToken";
  token: string;
}

export interface GetLinkToken {
  getLinkToken: GetLinkToken_getLinkToken | null;
}

/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: GetAccessToken
// ====================================================

export interface GetAccessToken {
  getAccessToken: boolean | null;
}

export interface GetAccessTokenVariables {
  publicToken: string;
}

/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: TransactionsQuery
// ====================================================

export interface TransactionsQuery_transactions_account {
  __typename: "Account";
  name: string | null;
}

export interface TransactionsQuery_transactions {
  __typename: "Transaction";
  id: string;
  name: string | null;
  amount: number;
  date: string;
  account: TransactionsQuery_transactions_account | null;
}

export interface TransactionsQuery {
  transactions: TransactionsQuery_transactions[] | null;
}

/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
