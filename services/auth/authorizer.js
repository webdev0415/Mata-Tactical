import * as Axios from "axios";
import * as jsonwebtoken from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
// import { ModelsList } from "../../libs/db";
// const {ActivityLog} = ModelsList;
// import { promisify } from "util";

const cognitoPoolId = process.env.USER_POOL_ID || "";
const cognitoIssuer = `https://cognito-idp.us-east-1.amazonaws.com/${cognitoPoolId}`;
let returnPubKey = {};
const getPublicKeys = async () => {
  if (returnPubKey !== {}) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys = await Axios.get(url);

    console.log("------public Kyes             ---", publicKeys.data);
    const promises = await publicKeys.data.keys.map(async (current) => {
      const pem = await jwkToPem(current);
      returnPubKey[current.kid] = { instance: current, pem };
    });
    await Promise.all(promises);
    console.log("-------Caceeee--", returnPubKey);
    return returnPubKey;
  } else {
    return returnPubKey;
  }
};

export const handler = async (event, context, callback) => {
  var token = event.authorizationToken;
  try {
    const tokenSections = (token || "").split(".");
    if (tokenSections.length < 2) {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "Token is invalid"
        )
      );
    }
    const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
    const header = JSON.parse(headerJSON);
    const keys = await getPublicKeys();
    const key = keys[header.kid];
    if (key === undefined) {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "Key is not defined"
        )
      );
    }

    const claims = await jsonwebtoken.verify(token, key.pem);
    console.log(claims);
    const currentSeconds = Math.floor(new Date().valueOf() / 1000);
    if (currentSeconds > claims.exp || currentSeconds < claims.auth_time) {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "Token Expired"
        )
      );
    }
    if (claims.iss !== cognitoIssuer) {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "Issuer is not correct!"
        )
      );
    }
    if (claims.token_use !== "id") {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "You should use id token"
        )
      );
    }
    callback(
      null,
      generatePolicy("UserAuthentication", "Allow", event.methodArn, claims)
    );
  } catch (err) {
    if (err.message === "jwt expired") {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          "Token Expired"
        )
      );
    } else {
      callback(
        null,
        generatePolicy(
          "UserAuthentication",
          "Deny",
          event.methodArn,
          null,
          err.message
        )
      );
    }
  }
};

// Help function to generate an IAM policy
const generatePolicy = (
  principalId,
  effect,
  resource,
  claims = null,
  customErrorMessage = null
) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    policyDocument.Statement.push({
      Action: "execute-api:Invoke",
      Effect: effect,
      Resource: "*",
    });
    authResponse.policyDocument = policyDocument;
  }
  if (effect.toLowerCase() == "deny" && customErrorMessage != null) {
    authResponse.context = {
      customErrorMessage: customErrorMessage,
    };
  } else if (effect.toLowerCase() == "allow") {
    const groups = claims["cognito:groups"]
      ? claims["cognito:groups"].toString()
      : "";
    authResponse.context = {
      sub: claims.sub,
      email: claims.email,
      groups: groups,
    };
  }
  console.log(authResponse);
  return authResponse;
};
