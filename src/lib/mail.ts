import sgMail from '@sendgrid/mail';

// Configuration de SendGrid avec la clé API
const apiKey = process.env.SENDGRID_API_KEY || '';
sgMail.setApiKey(apiKey);

// Fonction pour envoyer un email OTP
export async function sendOtpEmail(to: string, otp: string, name?: string) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    // Vérification des configurations requises
    if (!apiKey) {
      console.error('SendGrid API Key non configurée');
      return false;
    }
    
    if (!fromEmail) {
      console.error('Adresse email d\'expéditeur non configurée');
      return false;
    }
    
    console.log(`Tentative d'envoi d'email à ${to} depuis ${fromEmail}`);
    
    const msg = {
      to,
      from: fromEmail,
      subject: 'Votre code de connexion CollocShare',
      text: `Bonjour ${name || 'utilisateur'},\n\nVotre code de connexion est : ${otp}\n\nCe code est valable pendant 10 minutes.\n\nL'équipe CollocShare`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Votre code de connexion</h2>
          <p>Bonjour ${name || 'utilisateur'},</p>
          <p>Voici votre code de connexion pour CollocShare :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>Ce code est valable pendant 10 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe CollocShare</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    console.log('Email envoyé avec succès', response[0].statusCode);
    return true;
  } catch (error: any) {
    console.error('Erreur d\'envoi d\'email:', error);
    
    // Logs détaillés pour le débogage
    if (error.response) {
      console.error('Détails de l\'erreur SendGrid:');
      console.error(error.response.body);
    }
    
    return false;
  }
}

// Fonction pour envoyer un email d'invitation
export async function sendInvitationEmail(
  to: string, 
  inviteUrl: string, 
  colocationName: string,
  inviterName: string
) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    // Vérification des configurations requises
    if (!apiKey) {
      console.error('SendGrid API Key non configurée');
      return false;
    }
    
    if (!fromEmail) {
      console.error('Adresse email d\'expéditeur non configurée');
      return false;
    }
    
    console.log(`Tentative d'envoi d'invitation à ${to} depuis ${fromEmail}`);
    
    const msg = {
      to,
      from: fromEmail,
      subject: `Invitation à rejoindre "${colocationName}" sur CollocShare`,
      text: `Bonjour,\n\n${inviterName} vous invite à rejoindre la colocation "${colocationName}" sur CollocShare.\n\nPour accepter cette invitation, veuillez cliquer sur le lien suivant : ${inviteUrl}\n\nCette invitation expire dans 7 jours.\n\nSi vous n'avez pas demandé cette invitation, vous pouvez l'ignorer.\n\nL'équipe CollocShare`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation à rejoindre une colocation</h2>
          <p>${inviterName} vous invite à rejoindre la colocation <strong>"${colocationName}"</strong> sur CollocShare.</p>
          <p>Pour accepter cette invitation, veuillez cliquer sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Rejoindre la colocation
            </a>
          </div>
          <p>Cette invitation expire dans 7 jours.</p>
          <p>Si vous n'avez pas demandé cette invitation, vous pouvez l'ignorer.</p>
          <p>Cordialement,<br>L'équipe CollocShare</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    console.log('Invitation envoyée avec succès', response[0].statusCode);
    return true;
  } catch (error: any) {
    console.error('Erreur d\'envoi d\'invitation:', error);
    
    // Logs détaillés pour le débogage
    if (error.response) {
      console.error('Détails de l\'erreur SendGrid:');
      console.error(error.response.body);
    }
    
    return false;
  }
} 