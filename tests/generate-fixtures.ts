import { writeAllFixturesToDisk } from './fixtures-generator';
import * as path from 'path';

async function main() {
  const targetDir = path.join(__dirname, 'fixtures');
  const files = await writeAllFixturesToDisk(targetDir);
  console.log(`Generated ${files.length} fixtures in ${targetDir}:`);
  for (const f of files) {
    console.log(` - ${path.basename(f)}`);
  }
}

main().catch(console.error);
