import { cp, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const index = join(root, 'index.html')

for (const route of ['painel/login', 'painel', 'painel/historico', 'painel/contatos', 'painel/configuracoes', 'painel/usuarios', 'painel/veiculos/novo', 'painel/veiculos', 'painel/global', 'painel/global/catalogo', 'estoque', 'sobre', 'contato', 'veiculos']) {
  const target = join(root, route, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await cp(index, target)
}

await writeFile(join(root, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n')
await writeFile(join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>/</loc></url><url><loc>/estoque</loc></url><url><loc>/sobre</loc></url><url><loc>/contato</loc></url></urlset>\n')
