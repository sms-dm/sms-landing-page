import { BaseEmailTemplate } from './base-template';
import { ActivationCodeTemplate } from './activation-code.template';
import { OnboardingCompleteTemplate } from './onboarding-complete.template';
import { VerificationReminderTemplate } from './verification-reminder.template';

export enum EmailTemplateType {
  ACTIVATION_CODE = 'activation-code',
  ONBOARDING_COMPLETE = 'onboarding-complete',
  VERIFICATION_REMINDER = 'verification-reminder',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset'
}

export class EmailTemplateFactory {
  private static templates: Map<EmailTemplateType, BaseEmailTemplate> = new Map<EmailTemplateType, BaseEmailTemplate>();

  static {
    // Initialize templates
    this.templates.set(EmailTemplateType.ACTIVATION_CODE, new ActivationCodeTemplate());
    this.templates.set(EmailTemplateType.ONBOARDING_COMPLETE, new OnboardingCompleteTemplate());
    this.templates.set(EmailTemplateType.VERIFICATION_REMINDER, new VerificationReminderTemplate());
  }

  static getTemplate(type: EmailTemplateType): BaseEmailTemplate | null {
    return this.templates.get(type) || null;
  }

  static renderTemplate(type: EmailTemplateType, data: any): { subject: string; html: string } {
    const template = this.getTemplate(type);
    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }
    return template.render(data);
  }

  static registerTemplate(type: EmailTemplateType, template: BaseEmailTemplate): void {
    this.templates.set(type, template);
  }
}