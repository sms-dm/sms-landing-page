import { getBaseTemplate } from './base-template';

interface ActivationHelpVerificationData {
  verificationCode: string;
  expiryMinutes?: number;
}

export function generateActivationHelpVerificationEmail(data: ActivationHelpVerificationData): { subject: string; html: string } {
  const subject = 'SMS Activation Help - Verification Code';
  
  const content = `
    <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="color: #001E3C; margin-bottom: 20px; font-size: 24px;">Verification Required</h2>
      
      <p style="color: #333; margin-bottom: 20px;">
        You requested help with your SMS activation code. Please use the verification code below to proceed:
      </p>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; text-align: center; border: 2px solid #0096FF;">
        <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your verification code is:</p>
        <h1 style="color: #0096FF; font-size: 36px; letter-spacing: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">
          ${data.verificationCode}
        </h1>
        <p style="color: #666; margin-top: 10px; font-size: 14px;">
          This code expires in ${data.expiryMinutes || 15} minutes
        </p>
      </div>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>Security Notice:</strong> Never share this code with anyone. SMS support will never ask for your verification code.
        </p>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <p style="color: #666; font-size: 14px;">
        If you didn't request this code, please ignore this email.
      </p>
    </div>
  `;
  
  const html = getBaseTemplate({
    title: 'Verification Code',
    content,
    footerText: 'This is an automated security email from Smart Maintenance Systems.'
  });
  
  return { subject, html };
}