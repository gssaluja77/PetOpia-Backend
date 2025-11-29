import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

const emailSender = async (toAddress, forWhat, forWhom, content) => {
  const mailOptions = {
    from: `"PetOpia" <${process.env.EMAIL}>`,
    to: toAddress,
    subject: `${forWhat} reminder for ${forWhom} from PetOpia!`,
    html: content,
  };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  try {
    await transporter.sendMail(mailOptions);
  } catch (e) {
    console.error("Failed to send email:", e);
  }
};

export default emailSender;
