import handleGdriveUpload from "./handleGdriveUpload";

const filesToUpload = [
  {
    name: "Pankaj_Panday_resume.pdf",
    makePublic: true,
    filePath: "/home/pankaj/Documents/Career/Pankaj_Panday_latest-resume.pdf",
  },
  {
    name: "Pankaj_Panday_resume.docx",
    makePublic: false,
    filePath: "/home/pankaj/Documents/Career/Pankaj-resume-latest.docx",
  },
  {
    name: "Pankaj_Panday_resume.odt",
    makePublic: false,
    filePath: "/home/pankaj/Documents/Career/Pankaj-resume-latest.odt",
  },
];

async function main() {
  try {
    const resumeFolder = "Automated_resume";
    await handleGdriveUpload(resumeFolder, filesToUpload);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
