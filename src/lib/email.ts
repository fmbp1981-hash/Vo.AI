import nodemailer from 'nodemailer'

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || '465')
  const secure = port === 465

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user

  if (!user || !pass || !from) {
    throw new Error('SMTP is not configured. Set SMTP_USER, SMTP_PASS, SMTP_FROM.')
  }

  return { host, port, secure, user, pass, from }
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
}) {
  const smtp = getSmtpConfig()

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  })

  await transporter.sendMail({
    from: smtp.from,
    to: params.to,
    subject: 'Vo.AI — Redefinição de senha',
    text: `Você solicitou a redefinição de senha.\n\nAbra este link para criar uma nova senha: ${params.resetUrl}\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <p>Você solicitou a redefinição de senha.</p>
      <p><a href="${params.resetUrl}">Clique aqui para criar uma nova senha</a></p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `,
  })
}
