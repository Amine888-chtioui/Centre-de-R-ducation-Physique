package com.centrer.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final DateTimeFormatter REMINDER_DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter REMINDER_TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm", Locale.FRENCH);

    private final JavaMailSender mailSender;

    @Value("${centre.address:Bouznika, Maroc}")
    private String centreAddress;

    /**
     * @Async : s'exécute sur un thread séparé pour que l'appelant (AuthService)
     * n'attende pas la latence SMTP avant de répondre au client HTTP.
     */
    @Async
    public void sendPasswordResetCode(String toEmail, String code) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Votre code de réinitialisation de mot de passe");
            helper.setText(buildResetCodeEmail(code), true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Échec de l'envoi du code de réinitialisation à {}", toEmail, e);
        }
    }

    /**
     * Volontairement synchrone (pas de @Async) : contrairement au reset de mot de passe,
     * l'appelant (ReminderScheduler) a besoin de savoir si l'envoi a réussi avant de
     * marquer le rappel comme envoyé, pour pouvoir réessayer au prochain passage en cas
     * d'échec SMTP sans jamais renvoyer un rappel déjà réussi.
     */
    public void sendAppointmentReminder(
            String toEmail,
            String patientFullName,
            LocalDateTime appointmentDateTime,
            String appointmentType
    ) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
        helper.setTo(toEmail);
        helper.setSubject("Rappel de votre rendez-vous");
        helper.setText(buildReminderEmail(patientFullName, appointmentDateTime, appointmentType), true);
        mailSender.send(mimeMessage);
    }

    /**
     * Styles inline uniquement (table-based) : les clients mail n'appliquent
     * ni feuille de style externe ni variables CSS.
     */
    private String buildResetCodeEmail(String code) {
        return "<!DOCTYPE html>"
            + "<html lang=\"fr\">"
            + "<body style=\"margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Roboto,Arial,sans-serif;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f4f6fb;padding:32px 16px;\">"
            + "<tr><td align=\"center\">"
            + "<table role=\"presentation\" width=\"480\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(20,30,60,0.08);\">"

            // En-tête
            + "<tr><td style=\"background-color:#2f6fed;padding:28px 32px;text-align:center;\">"
            + "<span style=\"display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:rgba(255,255,255,0.15);color:#ffffff;font-size:22px;\">&#128274;</span>"
            + "<h1 style=\"margin:14px 0 0;color:#ffffff;font-size:19px;font-weight:700;\">Centre de Rééducation Physique</h1>"
            + "</td></tr>"

            // Corps
            + "<tr><td style=\"padding:36px 32px 12px;text-align:center;\">"
            + "<h2 style=\"margin:0 0 12px;color:#08060d;font-size:20px;font-weight:700;\">Réinitialisation de votre mot de passe</h2>"
            + "<p style=\"margin:0 0 28px;color:#6b7a99;font-size:15px;line-height:1.6;\">"
            + "Voici votre code de vérification. Saisissez-le sur le site pour choisir un nouveau mot de passe."
            + "</p>"
            + "</td></tr>"

            // Code
            + "<tr><td style=\"padding:0 32px 28px;text-align:center;\">"
            + "<div style=\"display:inline-block;background-color:#eef3ff;border:1px solid #d7e3ff;border-radius:12px;padding:18px 36px;\">"
            + "<span style=\"font-family:ui-monospace,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#2f6fed;\">"
            + code
            + "</span>"
            + "</div>"
            + "</td></tr>"

            + "<tr><td style=\"padding:0 32px 32px;text-align:center;\">"
            + "<p style=\"margin:0;color:#6b7a99;font-size:13px;\">Ce code est valable <strong>10 minutes</strong> et à usage unique.</p>"
            + "</td></tr>"

            // Séparateur + pied de page
            + "<tr><td style=\"padding:0 32px;\"><hr style=\"border:none;border-top:1px solid #e5e4e7;margin:0;\"></td></tr>"
            + "<tr><td style=\"padding:20px 32px 28px;text-align:center;\">"
            + "<p style=\"margin:0;color:#9aa5bd;font-size:12px;line-height:1.6;\">"
            + "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : "
            + "votre mot de passe ne sera pas modifié."
            + "</p>"
            + "</td></tr>"

            + "</table>"
            + "</td></tr>"
            + "</table>"
            + "</body></html>";
    }

    private String buildReminderEmail(
            String patientFullName,
            LocalDateTime appointmentDateTime,
            String appointmentType
    ) {
        String date = capitalize(appointmentDateTime.format(REMINDER_DATE_FMT));
        String time = appointmentDateTime.format(REMINDER_TIME_FMT);

        return "<!DOCTYPE html>"
            + "<html lang=\"fr\">"
            + "<body style=\"margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Roboto,Arial,sans-serif;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f4f6fb;padding:32px 16px;\">"
            + "<tr><td align=\"center\">"
            + "<table role=\"presentation\" width=\"480\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(20,30,60,0.08);\">"

            // En-tête
            + "<tr><td style=\"background-color:#2f6fed;padding:28px 32px;text-align:center;\">"
            + "<span style=\"display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:rgba(255,255,255,0.15);color:#ffffff;font-size:22px;\">&#128197;</span>"
            + "<h1 style=\"margin:14px 0 0;color:#ffffff;font-size:19px;font-weight:700;\">Centre de Rééducation Physique</h1>"
            + "</td></tr>"

            // Intro
            + "<tr><td style=\"padding:32px 32px 8px;\">"
            + "<p style=\"margin:0 0 20px;color:#08060d;font-size:15px;line-height:1.6;\">"
            + "Bonjour <strong>" + HtmlUtils.htmlEscape(patientFullName) + "</strong>,"
            + "</p>"
            + "<p style=\"margin:0 0 24px;color:#6b7a99;font-size:15px;line-height:1.6;\">"
            + "Nous vous rappelons que vous avez un rendez-vous au Centre de Rééducation Physique."
            + "</p>"
            + "</td></tr>"

            // Détails du rendez-vous
            + "<tr><td style=\"padding:0 32px 24px;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#eef3ff;border:1px solid #d7e3ff;border-radius:12px;\">"
            + reminderDetailRow("&#128197;", "Date", date)
            + reminderDetailRow("&#128336;", "Heure", time)
            + reminderDetailRow("&#128104;&#8205;&#9877;&#65039;", "Type de séance", HtmlUtils.htmlEscape(appointmentType))
            + reminderDetailRow("&#128205;", "Adresse", HtmlUtils.htmlEscape(centreAddress))
            + "</table>"
            + "</td></tr>"

            + "<tr><td style=\"padding:0 32px 32px;\">"
            + "<p style=\"margin:0;color:#6b7a99;font-size:13px;line-height:1.6;\">"
            + "Merci de vous présenter quelques minutes avant votre rendez-vous."
            + "</p>"
            + "</td></tr>"

            // Séparateur + pied de page
            + "<tr><td style=\"padding:0 32px;\"><hr style=\"border:none;border-top:1px solid #e5e4e7;margin:0;\"></td></tr>"
            + "<tr><td style=\"padding:20px 32px 28px;text-align:center;\">"
            + "<p style=\"margin:0;color:#9aa5bd;font-size:12px;line-height:1.6;\">Cordialement,<br>Centre de Rééducation Physique</p>"
            + "</td></tr>"

            + "</table>"
            + "</td></tr>"
            + "</table>"
            + "</body></html>";
    }

    private String reminderDetailRow(String emoji, String label, String value) {
        return "<tr><td style=\"padding:14px 18px;font-size:14px;line-height:1.5;\">"
            + "<span>" + emoji + "</span> "
            + "<strong style=\"color:#08060d;\">" + label + " : </strong>"
            + "<span style=\"color:#334066;\">" + value + "</span>"
            + "</td></tr>";
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase(Locale.FRENCH) + text.substring(1);
    }
}
