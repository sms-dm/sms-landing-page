export interface EmailTemplateData {
  [key: string]: any;
}

export abstract class BaseEmailTemplate {
  protected readonly primaryColor = '#0066CC';
  protected readonly successColor = '#10B981';
  protected readonly warningColor = '#F59E0B';
  protected readonly dangerColor = '#DC2626';
  protected readonly backgroundColor = '#f9f9f9';
  protected readonly textColor = '#333333';
  protected readonly lightGray = '#666666';

  abstract getSubject(data: EmailTemplateData): string;
  abstract getContent(data: EmailTemplateData): string;

  protected getBaseStyles(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: ${this.textColor};
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .email-wrapper {
        width: 100%;
        background-color: #f5f5f5;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: ${this.primaryColor};
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .header p {
        margin: 10px 0 0;
        font-size: 16px;
        opacity: 0.9;
      }
      .content {
        padding: 40px 30px;
      }
      .content h2 {
        color: ${this.textColor};
        font-size: 24px;
        margin-top: 0;
        margin-bottom: 20px;
      }
      .content p {
        margin-bottom: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background-color: ${this.primaryColor};
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        margin: 20px 0;
        transition: background-color 0.2s;
      }
      .button:hover {
        background-color: #0052a3;
      }
      .button-center {
        text-align: center;
        margin: 30px 0;
      }
      .code-box {
        background-color: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 24px;
        margin: 24px 0;
        text-align: center;
      }
      .code-box .code {
        font-family: 'Courier New', monospace;
        font-size: 32px;
        font-weight: bold;
        color: ${this.primaryColor};
        letter-spacing: 4px;
        margin: 8px 0;
      }
      .code-box .label {
        color: ${this.lightGray};
        font-size: 14px;
        margin-bottom: 8px;
      }
      .warning-box {
        background-color: #FEF3C7;
        border: 1px solid #F59E0B;
        border-radius: 6px;
        padding: 16px;
        margin: 20px 0;
      }
      .warning-box p {
        margin: 0;
        color: #92400E;
      }
      .info-box {
        background-color: #DBEAFE;
        border: 1px solid #3B82F6;
        border-radius: 6px;
        padding: 16px;
        margin: 20px 0;
      }
      .info-box p {
        margin: 0;
        color: #1E40AF;
      }
      .success-box {
        background-color: #D1FAE5;
        border: 1px solid #10B981;
        border-radius: 6px;
        padding: 16px;
        margin: 20px 0;
      }
      .success-box p {
        margin: 0;
        color: #065F46;
      }
      .footer {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #e9ecef;
      }
      .footer p {
        margin: 5px 0;
        color: ${this.lightGray};
        font-size: 14px;
      }
      .footer a {
        color: ${this.primaryColor};
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
      .social-links {
        margin: 20px 0;
      }
      .social-links a {
        display: inline-block;
        margin: 0 10px;
        color: ${this.lightGray};
        text-decoration: none;
      }
      table.details {
        width: 100%;
        margin: 20px 0;
        border-collapse: collapse;
      }
      table.details td {
        padding: 10px 0;
        border-bottom: 1px solid #e9ecef;
      }
      table.details td:first-child {
        font-weight: 600;
        color: ${this.lightGray};
        width: 40%;
      }
      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          border-radius: 0;
        }
        .content {
          padding: 30px 20px;
        }
        .header {
          padding: 30px 20px;
        }
        .header h1 {
          font-size: 24px;
        }
        .code-box .code {
          font-size: 24px;
          letter-spacing: 2px;
        }
      }
    `;
  }

  protected getLayout(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>SMS Portal</title>
        <style>
          ${this.getBaseStyles()}
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          ${content}
        </div>
      </body>
      </html>
    `;
  }

  public render(data: EmailTemplateData): { subject: string; html: string } {
    return {
      subject: this.getSubject(data),
      html: this.getLayout(this.getContent(data))
    };
  }
}