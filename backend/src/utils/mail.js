import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmangelink.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "Mail.taskmanger@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("Email  send service failed siliently");
    console.log(error);
  }
};

const emailVerificationMailContent = (username, verficationUrl) => {
  return {
    body: {
      name: username,
      intro: "Wellcome to Our App! We are Excited to have to on board.",
      action: {
        instructions:
          "To verify your email please click on the following button",
        button: {
          color: "#1aae5aff",
          text: "Verify your email",
          link: verficationUrl,
        },
      },
      outro:
        "Need help, or have questions? just replay this email ,we'd  love to help you ",
    },
  };
};

const forgotPasswordMailContent = (username, passwordRestUrl) => {
  return {
    body: {
      name: username,
      intro: "we got a request to reset the password of your account",
      action: {
        instructions:
          "To reset your password please click on the following button",
        button: {
          color: "rgb(59, 39, 77)",
          text: "Reset password",
          link: passwordRestUrl,
        },
      },
      outro:
        "Need help, or have questions? just replay this email ,we'd  love to help you",
    },
  };
};

export { forgotPasswordMailContent, emailVerificationMailContent, sendEmail };
