const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(compiled.outputText, filename);
};

async function main() {
  console.log('[RUN] Corriendo suites de pruebas...\n');

  // Suite 1: Login ViewModel
  const { ejecutarPruebasDirectas } = require('../src/features/auth/__tests__/loginViewModel.test.ts');
  await ejecutarPruebasDirectas();

  // Suite 2: Auth Integration
  const { correrPruebasIntegracionAuth } = require('../src/features/auth/__tests__/authIntegration.test.ts');
  await correrPruebasIntegracionAuth();

  // Suite 3: Dashboard & Licencias (Sprint 2)
  const { correrPruebas } = require('../src/features/dashboard/__tests__/dashboardAndLicencias.test.ts');
  await correrPruebas();

  console.log('\n[EXITO] TODAS LAS SUITES DE PRUEBAS COMPLETADAS CON EXITO!');
}

main().catch((err) => {
  console.error('\n[ERROR] Error durante la ejecucion de pruebas:', err);
  process.exit(1);
});
