import React from "react";
import { gql, useMutation } from "@apollo/client";

declare var Plaid: any;

const GET_LINK_TOKEN = gql`
  mutation getLinkToken {
    getLinkToken {
      token
    }
  }
`;

const GET_ACCESS_TOKEN = gql`
  mutation($publicToken: String!) {
    getAccessToken(publicToken: $publicToken)
  }
`;

function App() {
  const [
    getLinkToken,
    { data: linkTokenData, loading: linkTokenLoading, error: linkTokenError },
  ] = useMutation(GET_LINK_TOKEN);

  const [
    getAccessToken,
    {
      data: accessTokenData,
      loading: accessTokenLoading,
      error: accessTokenError,
    },
  ] = useMutation(GET_ACCESS_TOKEN);

  return (
    <div style={{ padding: 40 }}>
      <p>
        A light-weight web app that wraps the Plaid transactions API with
        GraphQL. This is a sandbox account. Use the credentials{" "}
        <code>user_good</code> and <code>pass_good</code> to log in.
      </p>
      <div style={{ marginTop: 20 }}>
        <button
          onClick={async () => {
            const linkToken = await getLinkToken().then(
              (response: any) => response?.data?.getLinkToken?.token
            );

            const configs = {
              token: linkToken,
              onSuccess: async (publicToken: string) => {
                getAccessToken({ variables: { publicToken } });
              },
              onExit: async function (err: any) {
                if (err != null) {
                  if (err.error_code === "INVALID_LINK_TOKEN") {
                    handler.destroy();
                    handler = Plaid.create({
                      ...configs,
                      token: await getLinkToken()
                        .then(
                          (response: any) => response?.data?.getLinkToken?.token
                        )
                        .catch((err) => {
                          console.error(err);
                        }),
                    });
                  }
                }
              },
            };

            let handler = Plaid.create(configs);
            handler.open();
          }}
        >
          Link Account
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        {linkTokenLoading
          ? "getting a link token...."
          : linkTokenData && JSON.stringify(linkTokenData, null, 2)}
      </div>
      <div style={{ marginTop: 20 }}>
        {accessTokenLoading
          ? "exchanging public token from plaid widget for access token"
          : accessTokenData && JSON.stringify(accessTokenData, null, 2)}
      </div>
      {linkTokenError && (
        <div style={{ color: "red", marginTop: 20 }}>
          {linkTokenError.message}
        </div>
      )}
      {accessTokenError && (
        <div style={{ color: "red", marginTop: 20 }}>
          {accessTokenError.message}
        </div>
      )}
    </div>
  );
}

export default App;
