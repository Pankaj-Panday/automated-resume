import {
  uploadFiles,
  createNewFolder,
  deleteFolder,
  listFolders,
  renameFolder,
} from "./remoteFileHandler";
import mime from "mime-types";

async function handleGdriveUpload(resumeFolder = null, filesToUpload = []) {
  if (!resumeFolder) throw new Error("Missing required arguments");
  if (!Array.isArray(filesToUpload) || filesToUpload.length === 0)
    throw new Error("No files provided for upload.");

  // 1. Create a 'Resume' folder (if it doesn't exist)
  const resumeFoldersList = await listFolders(resumeFolder);
  const resumeFolderExist = resumeFoldersList.length > 0;
  let resumeFolderId = null;
  if (resumeFolderExist) {
    resumeFolderId = resumeFoldersList[0].id;
    console.log(
      `\n"${resumeFolder}" folder already exist with ID: ${resumeFolderId}`
    );
  } else {
    console.log(`\n"${resumeFolder}" folder doesn't exist. Creating now...`);
    resumeFolderId = await createNewFolder(resumeFolder);
    console.log(
      `\nSuccessfully created "${resumeFolder}" folder with ID: ${resumeFolderId}.`
    );
  }

  // 2. Search for a folder called 'latest' inside of it
  console.log(
    `\nSearching for existing "latest" folder inside "${resumeFolder}" folder...`
  );
  const latestFoldersList = await listFolders("latest", resumeFolderId);
  const latestFolderExist = latestFoldersList.length > 0;

  // 3. If 'latest' folder found, get the ID of the 'latest' folder, and store it in 'prevLatestId'
  let existingLatestFolderId = null;
  if (latestFolderExist) {
    existingLatestFolderId = latestFoldersList[0].id;
    console.log(
      `\nFound existing "latest" folder with ID: ${existingLatestFolderId}`
    );
  } else {
    console.log(`\n"latest" folder not found. Nothing to do`);
  }

  // 4. Create a new folder called 'latest' inside "Resume" folder and store its ID in 'newLatestFolderId'
  const newLatestFolderId = await createNewFolder("latest", resumeFolderId);
  console.log(
    `\nSuccessfully created new "latest" folder with ID: ${newLatestFolderId} inside "${resumeFolder}" folder for uploading files`
  );

  // 5. Upload files to the 'newLatestFolder' folder.
  console.log(
    `\nUploading files to new "latest" folder with ID: ${newLatestFolderId}...`
  );
  filesToUpload.forEach((file) => {
    // modify filesToUpload to have mimeType and parentFoldeId field
    file.parentFolderId = newLatestFolderId;
    file.mimeType = mime.lookup(file.filePath);
  });
  const isSuccess = await uploadFiles(filesToUpload);
  if (isSuccess) {
    console.log(`\nAll ${filesToUpload.length} files uploaded successfully`);
  }

  // 6. Search for a folder called 'previous' inside of 'Resume' folder
  console.log(
    `\nSearching for "previous" folder inside "${resumeFolder}" folder...`
  );
  const previousFoldersList = await listFolders("previous", resumeFolderId);
  const previousFolderExist = previousFoldersList.length > 0;

  // 7. If 'previous' folder found, store its ID in 'previousFolderId'
  let previousFolderId = null;
  if (previousFolderExist) {
    previousFolderId = previousFoldersList[0].id;
    console.log(`\nFound "previous" folder with ID: ${previousFolderId}`);
  } else {
    console.log(`\n"previous" folder not found. Nothing to do`);
  }

  // 8. If 'latest' folder already exist, rename it to 'previous'
  if (latestFolderExist && existingLatestFolderId) {
    console.log(
      `\nRenaming existing "latest" folder with ID: ${existingLatestFolderId} to "previous"...`
    );
    await renameFolder(existingLatestFolderId, "previous");
    console.log(`\nSuccessfully renamed "latest" folder to "previous"`);
  }

  // 9. If 'previous' folder exist, delete/trash the 'previousFolderId' folder
  if (previousFolderExist && previousFolderId) {
    console.log(
      `\nDeleting older "previous" folder inside "${resumeFolder}" folder...`
    );
    await deleteFolder(previousFolderId);
    console.log(
      `\nSuccessfully deleted older "previous" folder inside "${resumeFolder}" folder\n`
    );
  }
}

export default handleGdriveUpload;
