import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM,
  to: "christian.zanchetta@proton.me",
  subject: "Sviluppa o Compra — test dominio verificato",
  html: "<p>Dominio fiscet.it verificato su Resend: invio a destinatario arbitrario OK.</p>",
});
console.log("FROM:", process.env.RESEND_FROM);
console.log("DATA:", JSON.stringify(data));
console.log("ERROR:", JSON.stringify(error));
