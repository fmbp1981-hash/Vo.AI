import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get proposal with all related data
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            destino: true,
            dataPartida: true,
            dataRetorno: true,
            orcamento: true,
            pessoas: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Parse content if it's a JSON string
    let parsedContent = proposal.content
    if (typeof proposal.content === 'string') {
      try {
        parsedContent = JSON.parse(proposal.content)
      } catch (e) {
        console.error('Error parsing proposal content:', e)
      }
    }

    // Generate HTML for PDF
    const htmlContent = generateProposalHTML({
      proposal,
      content: parsedContent,
      lead: proposal.lead,
      user: proposal.user
    })

    // In a real implementation, you would use a library like Puppeteer, 
    // jsPDF, or a service like PDFShift to convert HTML to PDF
    // For now, we'll return the HTML content

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="proposta-${proposal.lead.nome.replace(/\s+/g, '-')}.html"`
      }
    })

  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar PDF',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

function generateProposalHTML({ proposal, content, lead, user }: any) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta: ${proposal.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0056D2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0056D2;
            margin-bottom: 5px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .proposal-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
        }
        .info-value {
            color: #333;
            font-size: 14px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #0056D2;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background: #0056D2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .total-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #0056D2;
            border-top: 2px solid #0056D2;
            padding-top: 10px;
            margin-top: 15px;
        }
        .terms-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-top: 30px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft { background: #6c757d; color: white; }
        .status-sent { background: #007bff; color: white; }
        .status-viewed { background: #ffc107; color: #212529; }
        .status-signed { background: #28a745; color: white; }
        .status-rejected { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Vo.AI</div>
        <div class="subtitle">AGIR Viagens - Proposta Comercial</div>
        <div style="margin-top: 15px;">
            <span class="status-badge status-${proposal.status}">${getStatusText(proposal.status)}</span>
        </div>
    </div>

    <div class="proposal-info">
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Número da Proposta</div>
                <div class="info-value">#${id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Data de Emissão</div>
                <div class="info-value">${currentDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cliente</div>
                <div class="info-value">${lead.nome}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${lead.email || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${lead.telefone || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Consultor</div>
                <div class="info-value">${user.name}</div>
            </div>
        </div>
    </div>

    <div class="section-title">Detalhes da Viagem</div>
    <div class="proposal-info">
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Destino</div>
                <div class="info-value">${lead.destino || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Período</div>
                <div class="info-value">${formatDateRange(lead.dataPartida, lead.dataRetorno)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Viajantes</div>
                <div class="info-value">${lead.pessoas || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Orçamento</div>
                <div class="info-value">${lead.orcamento || '-'}</div>
            </div>
        </div>
    </div>

    <div class="section-title">Itens da Proposta</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${generateItemsRows(content?.items || [])}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>R$ ${formatCurrency(content?.subtotal || 0)}</span>
        </div>
        <div class="total-row">
            <span>Impostos (${content?.taxRate || 0}%):</span>
            <span>R$ ${formatCurrency(content?.taxAmount || 0)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total:</span>
            <span>R$ ${formatCurrency(content?.totalAmount || proposal.totalValue || 0)}</span>
        </div>
    </div>

    ${proposal.terms ? `
    <div class="section-title">Termos e Condições</div>
    <div class="terms-section">
        ${proposal.terms}
    </div>
    ` : ''}

    ${proposal.notes ? `
    <div class="section-title">Observações</div>
    <div class="proposal-info">
        ${proposal.notes}
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Vo.AI - AGIR Viagens</strong></p>
        <p>Proposta válida por 48 horas</p>
        <p>Gerado em ${currentDate}</p>
    </div>
</body>
</html>
  `
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    viewed: 'Visualizada',
    signed: 'Assinada',
    rejected: 'Rejeitada'
  }
  return statusMap[status] || status
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return '-'
  if (!startDate) return `Até ${formatDate(endDate)}`
  if (!endDate) return `A partir de ${formatDate(startDate)}`
  return `${formatDate(startDate)} a ${formatDate(endDate)}`
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function generateItemsRows(items: any[]) {
  if (!items || items.length === 0) {
    return '<tr><td colspan="5" style="text-align: center;">Nenhum item encontrado</td></tr>'
  }

  return items.map(item => `
    <tr>
        <td>${item.description || '-'}</td>
        <td>${item.category || '-'}</td>
        <td>${item.quantity || 0}</td>
        <td>R$ ${formatCurrency(item.unitPrice || 0)}</td>
        <td>R$ ${formatCurrency(item.totalPrice || 0)}</td>
    </tr>
  `).join('')
}