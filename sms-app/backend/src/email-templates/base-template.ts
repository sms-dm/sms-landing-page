export const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .wrapper {
      width: 100%;
      background-color: #f5f5f5;
      padding: 20px 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header { 
      background-color: #0F172A; 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .logo-section {
      margin-bottom: 20px;
    }
    .logo {
      width: 150px;
      height: auto;
    }
    .header h1 {
      margin: 10px 0 5px 0;
      font-size: 24px;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #00CED1;
    }
    .content { 
      padding: 30px 20px; 
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e9ecef;
      font-size: 12px;
      color: #6c757d;
    }
    .footer-logo {
      width: 80px;
      height: auto;
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #00CED1;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #00B8C3;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-section">
          <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sms-logo.png" alt="SMS Logo" class="logo">
        </div>
        <h1>${title}</h1>
        <p>Smart Maintenance System</p>
        <p style="font-size: 12px; font-style: italic; color: #00CED1; margin-top: 5px;">The Future of Maintenance Today</p>
      </div>
      
      ${content}
      
      <div class="footer">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sms-logo.png" alt="SMS Logo" class="footer-logo">
        <p style="margin: 5px 0;">Powered by Smart Maintenance System</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} SMS. All rights reserved.</p>
        <p style="margin: 5px 0; font-size: 11px;">
          This email was sent by the Smart Maintenance System. 
          Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;