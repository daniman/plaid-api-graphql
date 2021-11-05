// helper functions

function $get(id) {
  return document.getElementById(id)
}

async function gqlFetch(query) {
  const res = await fetch(window.location.href, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "apollographql-client-name": "Apollo Explorer",
      "apollographql-client-version": "CodeSandbox"
    },
    body: JSON.stringify({
      query
    })
  }).then((res) => res.json());
  return res;
}

function updateUI() {
  const authToken = localStorage.getItem("plaid:token");
  if (authToken) {
    $get("login").innerHTML = "Logout";
    $get("token").innerHTML = `Token: ${authToken.slice(0, 20)}...`;
  } else {
    $get("login").innerHTML = "Login";
    $get("token").innerHTML = "";
  }
}
