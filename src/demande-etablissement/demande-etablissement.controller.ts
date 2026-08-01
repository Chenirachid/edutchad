import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from '../email/email.service';

@ApiTags('Demande de rattachement établissement')
@Controller('demande-etablissement')
export class DemandeEtablissementController {
  constructor(private readonly emailService: EmailService) {}

  // Route publique volontairement non documentée dans l'interface (page /rejoindre
  // non reliée au menu) : sert de contact discret pour un nouvel établissement.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  async envoyer(
    @Body('nom') nom: string,
    @Body('etablissement') etablissement: string,
    @Body('contact') contact: string,
    @Body('message') message: string,
  ) {
    const contenuHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#0B4F52;">Nouvelle demande de rattachement — EduCheni</h2>
        <p><strong>Nom :</strong> ${nom || '—'}</p>
        <p><strong>Établissement :</strong> ${etablissement || '—'}</p>
        <p><strong>Contact (email/téléphone) :</strong> ${contact || '—'}</p>
        <p><strong>Message :</strong></p>
        <p style="white-space:pre-wrap;">${message || '—'}</p>
      </div>`;
    await this.emailService.envoyerEmail(
      'rachidcheni66@gmail.com',
      'Nouvelle demande de rattachement établissement',
      contenuHtml,
    );
    return { message: 'Demande envoyée. Vous serez recontacté prochainement.' };
  }
}
