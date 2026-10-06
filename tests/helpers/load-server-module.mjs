import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'

// Exercise the real TS implementation while replacing only framework adapters.
// Next's cookie and cache APIs need a request context outside the Next server.
export function loadServerModule(relativePath, adapters) {
  const filename = resolve(relativePath)
  const source = readFileSync(filename, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  })
  const loadedModule = { exports: {} }
  const resolveAdapter = (name) => {
    if (!(name in adapters)) throw new Error(`Missing test adapter: ${name}`)
    return adapters[name]
  }
  runInThisContext(`(function(exports, require, module) { ${outputText}\n})`, { filename })(
    loadedModule.exports, resolveAdapter, loadedModule
  )
  return loadedModule.exports
}
