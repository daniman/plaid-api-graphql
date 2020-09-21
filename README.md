A light-weight app that wraps a GraphQL API around the Plaid transactions API with Apollo Server, and provides a small UI with Apollo Client so you can provide your credentials and do an OAuth handshake.

The app is not currently running in any deployed environments. To run it yourself, open both the `client` and `server` folders and run:

```
npm install
npm start
```

This app is very much in progress, and there is no current UI. You'll want to use the UI provided to authenticate with the API, and then you'll want to query the API directly to test it out, which I recommend using Apollo Studio for.

---

![image](https://user-images.githubusercontent.com/5922187/93736099-27390000-fb94-11ea-9564-64c56036e230.png)
