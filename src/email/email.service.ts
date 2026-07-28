import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async envoyerEmail(destinataire: string, sujet: string, contenuHtml: string) {
    const cleApi = process.env.RESEND_API_KEY;
    if (!cleApi) {
      this.logger.warn(
        "RESEND_API_KEY n'est pas configurée — email non envoyé (mode simulation).",
      );
      return { simule: true };
    }

    const reponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleApi}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'EduCheni <onboarding@resend.dev>',
        to: destinataire,
        subject: sujet,
        html: contenuHtml,
      }),
    });

    if (!reponse.ok) {
      const erreur = await reponse.text();
      this.logger.error(`Échec envoi email à ${destinataire} : ${erreur}`);
      throw new Error("Impossible d'envoyer l'email pour le moment");
    }

    return reponse.json();
  }

  async envoyerReinitialisationMotDePasse(
    destinataire: string,
    prenom: string,
    lienReinitialisation: string,
  ) {
    const contenuHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#0B4F52;">Réinitialisation de ton mot de passe</h2>
        <p>Bonjour ${prenom},</p>
        <p>Tu as demandé à réinitialiser ton mot de passe sur EduCheni. Clique sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 1 heure) :</p>
        <p style="margin:24px 0;">
          <a href="${lienReinitialisation}" style="background:#0B4F52;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Réinitialiser mon mot de passe</a>
        </p>
        <p style="color:#666;font-size:13px;">Si tu n'as pas demandé cette réinitialisation, ignore simplement cet email.</p>
      </div>`;
    return this.envoyerEmail(destinataire, 'Réinitialisation de ton mot de passe — EduCheni', contenuHtml);
  }
}
