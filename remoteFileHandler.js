import authenticateAndGetDriveClient from "./config/driveAuth";
const drive = await authenticateAndGetDriveClient();
import fs from "node:fs";

async function listFolders(folderName, parentFolderId = null) {
  const folderQuery = [
    `name = '${folderName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
  ];

  if (parentFolderId) {
    folderQuery.push(`'${parentFolderId}' in parents`);
  } else {
    folderQuery.push("'root' in parents"); // Ensure it's in the root if no parent specified
  }

  const { data } = await drive.files.list({
    q: folderQuery.join(" and "),
    fields: "files(id, name, parents)",
  });

  return data.files;
}

async function createNewFolder(folderName, parentFolderId = null) {
  const fileMetaData = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentFolderId ? [parentFolderId] : ["root"],
  };
  const folder = await drive.files.create({
    requestBody: fileMetaData,
    fields: "id",
  });

  return folder.data.id;
}

async function deleteFolder(folderId) {
  const { data } = await drive.files.update({
    fileId: folderId,
    requestBody: {
      trashed: true,
    },
  });
  return data.id;
}

async function uploadSingleFile(
  fileName,
  metaData = {
    mimeType: "",
    filePath: "",
    parentFolderId: "",
  }
) {
  const { mimeType, filePath, parentFolderId } = metaData;
  if (!mimeType.trim() || !filePath.trim())
    throw Error("Error uploading files, missing mimeType or filePath");

  const fileSize = fs.statSync(filePath).size;
  let uploadedBytes = 0;

  const progressStream = fs.createReadStream(filePath).on("data", (chunk) => {
    uploadedBytes += chunk.length;
    const progress = ((uploadedBytes / fileSize) * 100).toFixed(1);
    // '\r' (carriage return) ensures the cursor returns to the beginning of the same line, so each update overwrites the previous one.
    process.stdout.write(`\rUpload progress: ${progress}%`);
    if (progress === "100.0") {
      process.stdout.write(`\n`);
    }
  });

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: mimeType,
      parents: parentFolderId ? [parentFolderId] : ["root"],
    },
    media: {
      mimeType: mimeType,
      body: progressStream,
    },
    fields: "id, name",
  });

  return data.id;
}

async function uploadFiles(files) {
  if (!Array.isArray(files) || files.length === 0)
    throw new Error("No files provided for upload.");

  for (const file of files) {
    const {
      name,
      mimeType,
      filePath,
      makePublic,
      parentFolderId = "root",
    } = file;
    if (!name || !mimeType || !filePath) {
      throw new Error(`missing required arguments in ${JSON.stringify(file)}`);
    }
    console.log(`\nUploading ${name}...`);
    const fileId = await uploadSingleFile(name, {
      mimeType,
      filePath,
      parentFolderId,
    });
    if (makePublic) {
      const publicLink = await makeFilePublic(fileId);
      console.log(`Made ${name} file public. Visit: ${publicLink}`);
    }
  }
  return true;
}

async function renameFolder(folderId = "", newName = "") {
  if (!folderId.trim() || !newName.trim())
    throw new Error("folderId and newName are required");
  const { data } = await drive.files.update({
    fileId: folderId,
    requestBody: {
      name: newName,
    },
    fields: "id, name",
  });

  return data.id;
}

async function makeFilePublic(fileId) {
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });

  const { data } = await drive.files.get({
    fileId,
    fields: "webViewLink, webContentLink",
  });

  return data.webViewLink; // Return the public link
}

export {
  listFolders,
  createNewFolder,
  deleteFolder,
  uploadSingleFile,
  uploadFiles,
  renameFolder,
  makeFilePublic,
};
