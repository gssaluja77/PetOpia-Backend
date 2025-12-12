import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

const emailSender = async (toAddress, from, subject, content) => {
  const mailOptions = {
    from: `${from} <${process.env.EMAIL}>`,
    to: toAddress,
    subject: subject,
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
