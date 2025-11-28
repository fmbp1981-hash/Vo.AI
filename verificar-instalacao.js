#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('\n🔍 VERIFICANDO INSTALAÇÃO DO VO.AI\n')
console.log('='.repeat(50))

let errors = 0
let warnings = 0

// Check 1: package.json exists
console.log('\n✓ Verificando estrutura do projeto...')
if (fs.existsSync('package.json')) {
  console.log('  ✅ package.json encontrado')
} else {
  console.log('  ❌ package.json NÃO encontrado')
  errors++
}

// Check 2: node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules instalado')
} else {
  console.log('  ❌ node_modules NÃO instalado - Execute: npm install')
  errors++
}

// Check 3: .env exists
console.log('\n✓ Verificando configurações...')
if (fs.existsSync('.env')) {
  console.log('  ✅ Arquivo .env encontrado')
  
  // Check .env content
  const envContent = fs.readFileSync('.env', 'utf-8')
  
  if (envContent.includes('OPENAI_API_KEY="sk-')) {
    console.log('  ✅ OPENAI_API_KEY configurada')
  } else if (envContent.includes('OPENAI_API_KEY')) {
    console.log('  ⚠️  OPENAI_API_KEY encontrada mas sem valor válido')
    console.log('      Configure no arquivo .env')
    warnings++
  } else {
    console.log('  ❌ OPENAI_API_KEY NÃO configurada')
    errors++
  }
  
  if (envContent.includes('DATABASE_URL')) {
    console.log('  ✅ DATABASE_URL configurada')
  } else {
    console.log('  ❌ DATABASE_URL NÃO configurada')
    errors++
  }
  
  if (envContent.includes('NEXTAUTH_SECRET')) {
    console.log('  ✅ NEXTAUTH_SECRET configurada')
  } else {
    console.log('  ⚠️  NEXTAUTH_SECRET não configurada')
    warnings++
  }
} else {
  console.log('  ❌ Arquivo .env NÃO encontrado')
  console.log('      Copie .env.example para .env')
  errors++
}

// Check 4: Prisma setup
console.log('\n✓ Verificando banco de dados...')
if (fs.existsSync('prisma/schema.prisma')) {
  console.log('  ✅ Schema Prisma encontrado')
} else {
  console.log('  ❌ Schema Prisma NÃO encontrado')
  errors++
}

if (fs.existsSync('node_modules/.prisma')) {
  console.log('  ✅ Prisma Client gerado')
} else {
  console.log('  ⚠️  Prisma Client não gerado - Execute: npm run db:setup')
  warnings++
}

if (fs.existsSync('dev.db') || fs.existsSync('prisma/dev.db')) {
  console.log('  ✅ Database criada')
} else {
  console.log('  ⚠️  Database não encontrada - Execute: npm run db:setup')
  warnings++
}

// Check 5: Source files
console.log('\n✓ Verificando código fonte...')
const srcDirs = ['src/app', 'src/components', 'src/lib']
srcDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir} encontrado`)
  } else {
    console.log(`  ❌ ${dir} NÃO encontrado`)
    errors++
  }
})

// Check 6: API routes
console.log('\n✓ Verificando rotas de API...')
const apiRoutes = [
  'src/app/api/leads/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/roteiros/generate/route.ts',
]
apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`  ✅ ${route.split('/').slice(-2).join('/')} `)
  } else {
    console.log(`  ⚠️  ${route.split('/').slice(-2).join('/')} não encontrada`)
    warnings++
  }
})

// Summary
console.log('\n' + '='.repeat(50))
console.log('\n📊 RESUMO DA VERIFICAÇÃO\n')

if (errors === 0 && warnings === 0) {
  console.log('✅ TUDO OK! Sistema pronto para uso.')
  console.log('\n▶️  Execute: npm run dev')
  console.log('▶️  Acesse: http://localhost:3000')
} else if (errors === 0) {
  console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`)
  console.log('\nSistema pode funcionar, mas recomenda-se corrigir os avisos.')
  console.log('\n▶️  Execute: npm run db:setup')
} else {
  console.log(`❌ ${errors} erro(s) crítico(s) encontrado(s)`)
  console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`)
  console.log('\n🔧 AÇÕES NECESSÁRIAS:')
  console.log('   1. npm install')
  console.log('   2. Configure .env com sua OPENAI_API_KEY')
  console.log('   3. npm run db:setup')
  console.log('   4. npm run dev')
  process.exit(1)
}

console.log('\n' + '='.repeat(50) + '\n')
