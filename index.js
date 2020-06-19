import axios from "axios";

/**
 * Get an OAuth token from Drupal.
 *
 * @returns {Object} Json
 *   Returns a json object with the token saved in localStorage
 *   or returned from Drupal.
 */
const getToken = async () => {
  // Check if we already have access token in localStorage
  const token =
    localStorage.getItem("access-token") !== null
      ? JSON.parse(localStorage.getItem("access-token"))
      : null;
  // Check if access token is still valid
  if (token !== null && token.expirationDate > Math.floor(Date.now() / 1000)) {
    return token;
  }
  //If token is not null, but invalid, try to refresh:
  let tokenRefreshed = [];
  if (token !== null) {
    tokenRefreshed = await refreshToken(token);
  }
  //if token was refreshed:
  if (tokenRefreshed.hasOwnProperty("access_token")) {
    return tokenRefreshed;
  } else {
    //If has a problem in refreshing token or token is null, get a new token:
    return await fetchOauthToken();
  }
};

/**
 * Get a refreshed OAuth token from Drupal.
 *
 * @returns Json
 *   Returns a json object with the refreshed token returned from Drupal.
 */
const refreshToken = async (dataToken) => {
  const formData = new FormData();
  formData.append("client_id", process.env.GATSBY_CLIENT_ID);
  formData.append("client_secret", process.env.GATSBY_CLIENT_SECRET);
  formData.append("grant_type", "refresh_token");
  formData.append("scope", process.env.GATSBY_CLIENT_SCOPE);
  formData.append("refresh_token", dataToken.refresh_token);
  formData.append("username", process.env.GATSBY_DRUPAL_USER);
  formData.append("password", process.env.GATSBY_DRUPAL_PASSWORD);

  return await axios
    .post(`${process.env.GATSBY_DRUPAL_ROOT}/oauth/token`, formData, {
      headers: {
        Accept: "application/json",
      },
    })
    .then((response) => {
      saveToken(response.data);
      return response.data;
    })
    .catch((error) => error.response.status);
};

/**
 * Get a new OAuth token from Drupal.
 *
 * @returns Json
 *   Returns a json object with the new token returned from Drupal.
 */
const fetchOauthToken = async () => {
  const formData = new FormData();
  formData.append("client_id", process.env.GATSBY_CLIENT_ID);
  formData.append("client_secret", process.env.GATSBY_CLIENT_SECRET);
  formData.append("grant_type", "password");
  formData.append("scope", process.env.GATSBY_CLIENT_SCOPE);
  formData.append("username", process.env.GATSBY_DRUPAL_USER);
  formData.append("password", process.env.GATSBY_DRUPAL_PASSWORD);
  return await axios
    .post(`${process.env.GATSBY_DRUPAL_ROOT}/oauth/token`, formData, {
      headers: {
        Accept: "application/json",
      },
    })
    .then((response) => {
      saveToken(response.data);
      return response.data;
    });
};

/**
 * Helper function to store token into local storage
 **/
const saveToken = (json) => {
  const token = { ...json };
  token.date = Math.floor(Date.now() / 1000);
  token.expirationDate = token.date + token.expires_in;
  localStorage.setItem("access-token", JSON.stringify(token));
};

module.exports = { getToken };