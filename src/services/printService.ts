import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Sale } from '../database/salesService';

export interface PrintOptions {
  includeLogo?: boolean;
  includeQRCode?: boolean;
  includeFooter?: boolean;
  paperSize?: '80mm' | '58mm' | 'A4';
  copies?: number;
}

export interface ReceiptData {
  sale: Sale;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    cnpj: string;
    website?: string;
  };
  printOptions?: PrintOptions;
}

class PrintService {
  private defaultCompanyInfo = {
    name: 'SmartPDV Store',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    cnpj: '12.345.678/0001-90',
    website: 'www.smartpdv.com'
  };

  /**
   * Gera o HTML do comprovante
   */
  private generateReceiptHTML(data: ReceiptData): string {
    const { sale, companyInfo, printOptions } = data;
    const company = { ...this.defaultCompanyInfo, ...companyInfo };
    const options = { 
      includeLogo: true, 
      includeQRCode: true, 
      includeFooter: true, 
      paperSize: '80mm' as const,
      copies: 1,
      ...printOptions 
    };

    const formatCurrency = (value: number) => {
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getPaymentMethodName = (method: string) => {
      const methods: Record<string, string> = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        cartao_credito: 'Cartão de Crédito',
        cartao_debito: 'Cartão de Débito',
        vale: 'Vale'
      };
      return methods[method] || method;
    };

    const itemsHTML = sale.items.map(item => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = (item.discount || 0) + (item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0);
      const finalItemTotal = itemTotal - itemDiscount;

      return `
        <tr>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ccc;">
            <div style="font-weight: bold;">${item.name}</div>
            <div style="font-size: 12px; color: #666;">
              ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}
              ${itemDiscount > 0 ? `<br>Desconto: -${formatCurrency(itemDiscount)}` : ''}
            </div>
          </td>
          <td style="text-align: right; font-weight: bold; padding: 2px 0; border-bottom: 1px dotted #ccc;">
            ${formatCurrency(finalItemTotal)}
          </td>
        </tr>
      `;
    }).join('');

    const qrCodeHTML = options.includeQRCode ? `
      <div style="text-align: center; margin: 10px 0;">
        <div style="font-size: 10px; color: #666; margin-bottom: 5px;">QR Code para Pagamento</div>
        <div style="width: 100px; height: 100px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999;">
          QR Code<br>PIX
        </div>
      </div>
    ` : '';

    const logoHTML = options.includeLogo ? `
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 18px; font-weight: bold; color: #333;">🛒</div>
        <div style="font-size: 14px; font-weight: bold; color: #6200ee;">${company.name}</div>
      </div>
    ` : '';

    const footerHTML = options.includeFooter ? `
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; text-align: center; color: #666;">
        <div>${company.address}</div>
        <div>Tel: ${company.phone} | CNPJ: ${company.cnpj}</div>
        ${company.website ? `<div>${company.website}</div>` : ''}
        <div style="margin-top: 5px;">Obrigado pela preferência!</div>
      </div>
    ` : '';

    const paperWidth = options.paperSize === '80mm' ? '80mm' : options.paperSize === '58mm' ? '58mm' : '210mm';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comprovante de Venda</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
              font-size: 12px;
              line-height: 1.2;
              color: #333;
              width: ${paperWidth};
              max-width: ${paperWidth};
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .sale-info {
              margin-bottom: 15px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .totals {
              border-top: 2px solid #333;
              padding-top: 10px;
              margin-bottom: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .final-total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #333;
              padding-top: 5px;
            }
            .customer-info {
              margin-bottom: 15px;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .payment-info {
              margin-bottom: 15px;
              padding: 10px;
              background: #f0f8ff;
              border-radius: 5px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${logoHTML}
          
          <div class="header">
            <h2 style="margin: 0; font-size: 16px;">COMPROVANTE DE VENDA</h2>
            <div style="font-size: 12px; color: #666;">
              Venda #${sale.id}
            </div>
            <div style="font-size: 12px; color: #666;">
              ${formatDate(sale.date)}
            </div>
          </div>

          ${sale.customerName ? `
            <div class="customer-info">
              <strong>Cliente:</strong> ${sale.customerName}
            </div>
          ` : ''}

          <div class="payment-info">
            <strong>Forma de Pagamento:</strong> ${getPaymentMethodName(sale.paymentMethod)}
            ${sale.appliedCoupon ? `
              <br><strong>Cupom:</strong> ${sale.appliedCoupon.code} 
              (${sale.appliedCoupon.type === 'percentage' ? 
                `${sale.appliedCoupon.value}%` : 
                `R$ ${sale.appliedCoupon.value.toFixed(2)}`})
            ` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr style="border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 5px 0;">ITEM</th>
                <th style="text-align: right; padding: 5px 0;">VALOR</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="total-row">
                <span>Descontos:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            <div class="total-row final-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(sale.finalTotal)}</span>
            </div>
          </div>

          ${qrCodeHTML}

          ${sale.notes ? `
            <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border-radius: 5px; font-size: 11px;">
              <strong>Observações:</strong><br>
              ${sale.notes}
            </div>
          ` : ''}

          ${footerHTML}
        </body>
      </html>
    `;
  }

  /**
   * Imprime o comprovante
   */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      const html = this.generateReceiptHTML(data);
      
      if (Platform.OS === 'web') {
        // Para web, abre em nova aba
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
          return true;
        }
        return false;
      } else {
        // Para mobile, usa expo-print
        const { uri } = await Print.printToFileAsync({ html });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Comprovante de Venda'
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error);
      return false;
    }
  }

  /**
   * Gera PDF do comprovante
   */
  async generateReceiptPDF(data: ReceiptData): Promise<string | null> {
    try {
      const html = this.generateReceiptHTML(data);
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return null;
    }
  }

  /**
   * Compartilha o comprovante
   */
  async shareReceipt(data: ReceiptData): Promise<boolean> {
    try {
      const pdfUri = await this.generateReceiptPDF(data);
      if (pdfUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Comprovante'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao compartilhar comprovante:', error);
      return false;
    }
  }

  /**
   * Envia comprovante por email (simulado)
   */
  async emailReceipt(data: ReceiptData, email: string): Promise<boolean> {
    try {
      const pdfUri = await this.generateReceiptPDF(data);
      if (pdfUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Enviar por Email',
          UTI: 'com.adobe.pdf'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Configura informações da empresa
   */
  updateCompanyInfo(companyInfo: Partial<ReceiptData['companyInfo']>): void {
    this.defaultCompanyInfo = { ...this.defaultCompanyInfo, ...companyInfo };
  }
}

export const printService = new PrintService(); 