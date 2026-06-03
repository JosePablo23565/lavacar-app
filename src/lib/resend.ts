import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error al enviar email:', error);
      return { success: false, error };
    }

    console.log('Email enviado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error };
  }
}