import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface ProposalData {
  id: string;
  clientName: string;
  consultantName: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  itinerary: {
    day: number;
    title: string;
    activities: string[];
    accommodation?: string;
    meals?: string[];
  }[];
  inclusions: string[];
  exclusions: string[];
  terms: string[];
  validUntil: string;
}

export class ProposalPDFGenerator {
  private doc: typeof PDFDocument.prototype;

  constructor() {
    this.doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: 'Proposta de Viagem',
        Author: 'Vo.AI - AGIR Viagens'
      }
    });
  }

  private addHeader() {
    // Header com cores da marca
    this.doc
      .fontSize(24)
      .fillColor('#D4AF37') // Dourado
      .text('Vo.AI', 50, 50)
      .fontSize(12)
      .fillColor('#00D4FF') // Azul Ciano
      .text('Powered by AGIR Viagens', 50, 80);
    
    this.doc.moveDown(2);
  }

  private addClientInfo(data: ProposalData) {
    this.doc
      .fontSize(18)
      .fillColor('#1A1A1A')
      .text('Proposta de Viagem', { align: 'center' })
      .moveDown();

    this.doc
      .fontSize(12)
      .fillColor('#4A4A4A')
      .text(`Cliente: ${data.clientName}`)
      .text(`Consultor: ${data.consultantName}`)
      .text(`Destino: ${data.destination}`)
      .text(`Período: ${data.startDate} - ${data.endDate}`)
      .text(`Orçamento: R$ ${data.budget.toLocaleString('pt-BR')}`)
      .text(`Válido até: ${data.validUntil}`)
      .moveDown(2);
  }

  private addItinerary(data: ProposalData) {
    this.doc
      .fontSize(16)
      .fillColor('#D4AF37')
      .text('Roteiro Detalhado')
      .moveDown();

    data.itinerary.forEach((day) => {
      this.doc
        .fontSize(14)
        .fillColor('#00D4FF')
        .text(`Dia ${day.day} - ${day.title}`)
        .fontSize(11)
        .fillColor('#4A4A4A');

      day.activities.forEach((activity) => {
        this.doc.text(`• ${activity}`, { indent: 20 });
      });

      if (day.accommodation) {
        this.doc.text(`Hospedagem: ${day.accommodation}`, { indent: 20 });
      }

      if (day.meals && day.meals.length > 0) {
        this.doc.text(`Refeições: ${day.meals.join(', ')}`, { indent: 20 });
      }

      this.doc.moveDown();
    });
  }

  private addInclusionsExclusions(data: ProposalData) {
    this.doc.addPage();

    this.doc
      .fontSize(16)
      .fillColor('#D4AF37')
      .text('Incluído no Pacote')
      .moveDown();

    this.doc.fontSize(11).fillColor('#4A4A4A');
    data.inclusions.forEach((item) => {
      this.doc.text(`✓ ${item}`, { indent: 20 });
    });

    this.doc.moveDown(2);

    this.doc
      .fontSize(16)
      .fillColor('#D4AF37')
      .text('Não Incluído')
      .moveDown();

    this.doc.fontSize(11).fillColor('#4A4A4A');
    data.exclusions.forEach((item) => {
      this.doc.text(`✗ ${item}`, { indent: 20 });
    });
  }

  private addTerms(data: ProposalData) {
    this.doc.moveDown(2);

    this.doc
      .fontSize(16)
      .fillColor('#D4AF37')
      .text('Termos e Condições')
      .moveDown();

    this.doc.fontSize(10).fillColor('#4A4A4A');
    data.terms.forEach((term, index) => {
      this.doc.text(`${index + 1}. ${term}`, { align: 'justify' });
      this.doc.moveDown(0.5);
    });
  }

  private addFooter(data: ProposalData) {
    const pageCount = this.doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);
      
      this.doc
        .fontSize(8)
        .fillColor('#888888')
        .text(
          `Proposta ${data.id} | Página ${i + 1} de ${pageCount}`,
          50,
          this.doc.page.height - 50,
          { align: 'center' }
        );
    }
  }

  async generate(data: ProposalData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      // Build PDF
      this.addHeader();
      this.addClientInfo(data);
      this.addItinerary(data);
      this.addInclusionsExclusions(data);
      this.addTerms(data);
      this.addFooter(data);

      this.doc.end();
    });
  }
}

// Helper para gerar proposta com dados mockados
export async function generateProposal(proposalData: ProposalData): Promise<Buffer> {
  const generator = new ProposalPDFGenerator();
  return generator.generate(proposalData);
}
