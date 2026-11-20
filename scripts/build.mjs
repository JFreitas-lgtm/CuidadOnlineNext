// Publicação estática: copia arquivos, sem compilação nem dependências.
import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
if (output !== root + sep + 'dist') throw new Error('Diretório de saída inválido.');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const file of ['index.html', 'src', 'assets']) {
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}
console.log('Site estático gerado em dist/.');
