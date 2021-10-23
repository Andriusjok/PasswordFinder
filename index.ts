import { promisify } from "util";
import path from "path";
import fs, { createReadStream } from "fs";
import { createInterface } from "readline";

const fsReaddir = promisify(fs.readdir);
const fsLstat = promisify(fs.lstat);

const CONFIG = {
  minLength: 10,
  minLowerCaseLatinChars: 1,
  minUpperCaseLatinChars: 2,
  minNumbers: 1,
  minSpecialChar: 1,
};

var matchingPasswords: string[] = [];

async function searchFilesInDirectoryAsync(dir: string, ext: string) {
  const files = await fsReaddir(dir).catch((err) => {
    throw new Error(err.message);
  });
  const found = await getFilesInDirectoryAsync(dir, ext);

  searchForPasswords(found);
}

async function getFilesInDirectoryAsync(
  dir: string,
  ext: string
): Promise<string[]> {
  let files: string[] = [];
  const filesFromDirectory = await fsReaddir(dir).catch((err) => {
    throw new Error(err.message);
  });

  for (let file of filesFromDirectory) {
    const filePath = path.join(dir, file);
    const stat = await fsLstat(filePath);

    if (path.extname(file) === ext) {
      files.push(filePath);
    }
  }

  return files;
}

async function searchForPasswords(fileList: string[]): Promise<void> {
  for (let file of fileList) {
    readStream(file);
  }
}

const readStream = async (filePath: string) => {
  const readLine = createInterface({
    input: createReadStream(filePath),
    output: process.stdout,
    terminal: false,
  });

  readLine.on("line", (line) => {
    if (
      passWordMatchesRequirements(line) &&
      !matchingPasswords.includes(line)
    ) {
      matchingPasswords.push(line);
    }

    if (matchingPasswords.length >= 100) {
      matchingPasswords.forEach((password) => {
        console.log(password);
      });
      console.log("Passwords found successfully");
      process.exit(1);
    }
  });
};

const passWordMatchesRequirements = (line: string) => {
  var password = line.replace(/\s+/g, "");
  var regex = new RegExp(
    `([0-9]{${CONFIG.minNumbers}})(?=.*[a-z]{${CONFIG.minLowerCaseLatinChars},})(?=.*[A-Z]{${CONFIG.minUpperCaseLatinChars},})([^a-zA-Z0-9]{${CONFIG.minSpecialChar}})`
  );

  return password.length >= CONFIG.minLength && regex.test(password);
};

async function main() {
  await searchFilesInDirectoryAsync("./passwordDictionaries", ".txt");
}

if (require.main === module) {
  main();
}
