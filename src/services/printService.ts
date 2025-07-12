import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface SaleReceipt {
  id: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
}

export class PrintService {
  static async generateReceiptHTML(receipt: SaleReceipt): Promise<string> {
    const itemsHTML = receipt.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>R$ ${item.price.toFixed(2)}</td>
          <td>R$ ${item.total.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comprovante de Venda</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }
            .info {
              margin: 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SmartPDV</h1>
            <p>Sistema de Ponto de Venda</p>
          </div>
          
          <div class="info">
            <strong>Venda #${receipt.id}</strong><br>
            <strong>Data:</strong> ${receipt.date}<br>
            ${receipt.customerName ? `<strong>Cliente:</strong> ${receipt.customerName}<br>` : ''}
            <strong>Forma de Pagamento:</strong> ${receipt.paymentMethod}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div class="totals">
            <div>Subtotal: R$ ${receipt.subtotal.toFixed(2)}</div>
            ${receipt.discount > 0 ? `<div>Desconto: -R$ ${receipt.discount.toFixed(2)}</div>` : ''}
            <div class="total-row">Total: R$ ${receipt.total.toFixed(2)}</div>
          </div>
          
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>SmartPDV - Sistema Inteligente de Vendas</p>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  static async printReceipt(receipt: SaleReceipt): Promise<void> {
    try {
      const html = await this.generateReceiptHTML(receipt);
      
      if (Platform.OS === 'web') {
        // Para web, abrir em nova aba
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        // Para mobile, usar expo-print
        const { uri } = await Print.printToFileAsync({ html });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Comprovante de Venda',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error);
      throw new Error('Falha ao gerar comprovante');
    }
  }

  static async generatePDF(receipt: SaleReceipt): Promise<string> {
    try {
      const html = await this.generateReceiptHTML(receipt);
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar PDF');
    }
  }
} 