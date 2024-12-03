import google from "@googleapis/drive";
import * as fs from "node:fs/promises";

import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const credentialsFilePath = path.join(__dirname, "credentials.json");
const tokenFilePath = path.join(__dirname, "tokens.json");

async function authenticateAndGetDriveClient() {
  const credentials = JSON.parse(
    await fs.readFile(credentialsFilePath, "utf-8")
  );
  const { client_id, client_secret, redirect_uris } = credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const tokens = JSON.parse(await fs.readFile(tokenFilePath));
    oauth2Client.setCredentials(tokens);
  } catch (err) {
    console.log("\nNo tokens found. Generating a new one...");

    // generate a url that asks for user permisson to provide the authorization code
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive"],
      // prompt: "consent", // if this is true user will forcefully see the consent screen
    });

    console.log(
      `Authorize this app by and visiting the url and copy code from there:\n${authUrl}`
    );

    // prompt the user to enter the code they got above
    const authCode = await new Promise((resolve) => {
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim());
        process.stdin.destroy(); // Clean up stdin after input
      });
      console.log(
        "Enter the authorization code you copied from url above here:"
      );
    });
    console.log("Processing...");

    // exchange tokens for that authCode
    // This will provide an object with the access_token and refresh_token.
    const { tokens } = await oauth2Client.getToken(authCode);
    console.log("Setting credentials...");
    oauth2Client.setCredentials(tokens);

    // save tokens for future use
    await fs.writeFile(tokenFilePath, JSON.stringify(tokens));
    console.log("Saved tokens to:", tokenFilePath);
  }

  // Return an authenticated Google Drive client
  const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
  });

  return drive;
}

export default authenticateAndGetDriveClient;
