import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Sale } from '../database/salesService';

export interface PrintOptions {
  includeLogo?: boolean;
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
            }
          </style>
        </head>
        <body>
          ${logoHTML}
          <div class="header">
            <div style="font-size: 16px; font-weight: bold;">Comprovante de Venda</div>
            <div style="font-size: 12px;">${formatDate(sale.date)}</div>
            <div style="font-size: 12px;">${company.name}</div>
          </div>
          <div class="sale-info">
            <div>ID da Venda: <strong>${sale.id}</strong></div>
            ${sale.customerName ? `<div>Cliente: <strong>${sale.customerName}</strong></div>` : ''}
            <div>Método de Pagamento: <strong>${getPaymentMethodName(sale.paymentMethod)}</strong></div>
          </div>
          <table class="items-table">
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row">Subtotal: <span>${formatCurrency(sale.subtotal)}</span></div>
            <div class="total-row">Desconto: <span>- ${formatCurrency(sale.discount)}</span></div>
            <div class="total-row final-total">Total: <span>${formatCurrency(sale.finalTotal)}</span></div>
          </div>
          ${footerHTML}
        </body>
      </html>
    `;
  }

  /**
   * Imprime o comprovante
   */
  async printReceipt(data: ReceiptData) {
    const html = this.generateReceiptHTML(data);
    await Print.printAsync({ html });
  }

  /**
   * Compartilha o comprovante em PDF
   */
  async shareReceipt(data: ReceiptData) {
    const html = this.generateReceiptHTML(data);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  }
}

export const printService = new PrintService();
