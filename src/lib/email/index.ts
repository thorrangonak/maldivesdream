import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";
import { formatCurrency } from "@/lib/utils";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}
const FROM = process.env.EMAIL_FROM || "bookings@maldivesdream.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Maldives Dream";

interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  reservationCode: string;
  hotelName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomQty: number;
  totalAmount: number;
  currency: string;
}

/** Send booking confirmation to guest */
export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: data.guestEmail,
      subject: `Booking Confirmed — ${data.hotelName} | ${APP_NAME}`,
      html: buildConfirmationHtml(data),
    });
    logger.info("Booking confirmation email sent", { email: data.guestEmail, code: data.reservationCode });
  } catch (err) {
    logger.error("Failed to send booking confirmation", { error: String(err), code: data.reservationCode });
  }
}

/** Send admin notification about new booking */
export async function sendAdminBookingNotification(data: BookingEmailData, adminEmail: string) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: adminEmail,
      subject: `New Booking: ${data.reservationCode} — ${data.hotelName}`,
      html: `
        <h2>New Reservation</h2>
        <p><strong>Code:</strong> ${data.reservationCode}</p>
        <p><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
        <p><strong>Hotel:</strong> ${data.hotelName}</p>
        <p><strong>Room:</strong> ${data.roomTypeName} x${data.roomQty}</p>
        <p><strong>Dates:</strong> ${data.checkIn} — ${data.checkOut} (${data.nights} nights)</p>
        <p><strong>Total:</strong> ${formatCurrency(data.totalAmount, data.currency)}</p>
      `,
    });
  } catch (err) {
    logger.error("Failed to send admin notification", { error: String(err) });
  }
}

function buildConfirmationHtml(data: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #0ea5e9;">
    <h1 style="color: #0ea5e9; margin: 0; font-size: 24px;">🌊 ${APP_NAME}</h1>
  </div>

  <div style="padding: 32px 0;">
    <h2 style="color: #0f172a; margin: 0 0 8px;">Booking Confirmed!</h2>
    <p style="color: #64748b; margin: 0 0 24px;">Dear ${data.guestName}, your reservation has been confirmed.</p>

    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; color: #64748b; font-size: 13px;">CONFIRMATION CODE</p>
      <p style="margin: 0 0 20px; font-size: 28px; font-weight: 700; color: #0ea5e9; letter-spacing: 2px;">${data.reservationCode}</p>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Hotel</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.hotelName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Room</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.roomTypeName} × ${data.roomQty}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Check-in</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.checkIn}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Check-out</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.checkOut}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Nights</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.nights}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; font-weight: 700; font-size: 16px;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: #0ea5e9;">${formatCurrency(data.totalAmount, data.currency)}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 14px;">
      You can manage your booking at
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/manage-booking" style="color: #0ea5e9;">Manage Booking</a>
      using your confirmation code and email address.
    </p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>${APP_NAME} — Your Maldives Paradise Awaits</p>
  </div>
</body>
</html>`;
}
