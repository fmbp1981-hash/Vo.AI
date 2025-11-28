const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

/**
 * Normaliza estágio do CSV para match com o schema
 */
function normalizeStage(stage) {
  const stageMap = {
    'Novo Lead': 'Novo Lead',
    'Qualificação': 'Qualificação',
    'Proposta': 'Proposta Enviada',
    'Proposta Enviada': 'Proposta Enviada',
    'Negociação': 'Negociação',
    'Fechado': 'Fechado',
    'Perdido': 'Perdido',
    'Pós-Venda': 'Pós-Venda',
  }

  return stageMap[stage] || 'Novo Lead'
}

/**
 * Converte string de data para DateTime
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null

  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Converte string booleana
 */
function parseBoolean(value) {
  if (!value) return false
  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'yes'
}

/**
 * Parse CSV manualmente
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Remove BOM se presente
  let header = lines[0].replace(/^\uFEFF/, '')
  const headers = header.split(',').map(h => h.trim())

  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const record = {}

    headers.forEach((header, index) => {
      record[header] = values[index] ? values[index].trim() : ''
    })

    records.push(record)
  }

  return records
}

/**
 * Importa leads do CSV
 */
async function importLeadsFromCSV(filePath) {
  console.log(`📂 Lendo arquivo: ${filePath}`)

  // Ler arquivo CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8')

  // Parse CSV
  const records = parseCSV(fileContent)

  console.log(`📊 Encontrados ${records.length} leads no CSV`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    try {
      // Verificar se já existe (por telefone normalizado ou email)
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { telefoneNormalizado: record['Telefone_Normalizado'] },
            { email: record['Email'] },
          ],
        },
      })

      if (existing) {
        console.log(`⏭️  Lead já existe: ${record['Nome']} (${record['Email']})`)
        skipped++
        continue
      }

      // Criar lead
      await prisma.lead.create({
        data: {
          userId: record['user_id'] || null,
          nome: record['Nome'],
          status: record['Status'] || 'Novo Lead',
          telefone: record['Telefone'] || null,
          telefoneNormalizado: record['Telefone_Normalizado'] || null,
          dataNascimento: record['Data_Nascimento'] || null,
          email: record['Email'] || null,
          canal: record['Canal'] || null,
          destino: record['Destino'] || null,
          periodo: record['Período'] || null,
          dataPartida: parseDate(record['Data de Partida']),
          dataRetorno: parseDate(record['Data de Retorno']),
          orcamento: record['Orçamento'] || null,
          pessoas: record['Pessoas'] || null,
          ultimaMensagem: record['Ultima Mensagem'] || null,
          dataUltimaMensagem: parseDate(record['Data Ultima Mensagem']),
          statusEnvio: record['Status_Envio'] || null,
          processado: parseBoolean(record['Processado']),
          motivoCancelamento: record['Motivo_Cancelamento'] || null,
          qualificado: parseBoolean(record['Qualificado']),
          recorrente: parseBoolean(record['Recorrente']),
          estagio: normalizeStage(record['Estágio']),
          dataFechamento: parseDate(record['Data_Fechamento']),
          dataProcessamento: parseDate(record['Data do Processamento']),
          observacoes: record['Observações'] || null,
          created: parseDate(record['Created']) || new Date(),
        },
      })

      console.log(`✅ Lead importado: ${record['Nome']}`)
      imported++
    } catch (error) {
      console.error(`❌ Erro ao importar ${record['Nome']}:`, error.message)
      errors++
    }
  }

  console.log('\n📈 Resumo da Importação:')
  console.log(`✅ Importados: ${imported}`)
  console.log(`⏭️  Ignorados (já existem): ${skipped}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📊 Total no CSV: ${records.length}`)
}

/**
 * Executa importação
 */
async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\Dell\\Downloads\\Leads-CRM.csv'

  console.log('🚀 Iniciando importação de leads...\n')

  try {
    await importLeadsFromCSV(csvPath)
    console.log('\n✅ Importação concluída com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro durante importação:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
