require('dotenv').config()

module.exports = {sendEmailVerificationMail: sendEmailVerificationMail}

const path = require('path')
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');

function sendEmailVerificationMail(toEmail, UUID) {

    const transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
            auth: {
                user: process.env.MAIL_CLIENT_EMAIL,
                pass: process.env.MAIL_CLIENT_APP_PASS,
            },
        secure: true,
    });

    const handlebarOptions = {
        viewEngine: {
            extName: ".handlebars",
            partialsDir: path.resolve('./views'),
            defaultLayout: false,
        },
        viewPath: path.resolve('./views'),
        extName: ".handlebars",
    }
      
    transporter.use('compile', hbs(handlebarOptions));
    
    const mailData = {
        from: process.env.MAIL_CLIENT_EMAIL,
        to: toEmail,
        subject: 'Email Verification',
        template: 'email_formats/email_verification',
        context: {
            protocol: process.env.HTTP_PROTOCOL,
            domain: process.env.DOMAIN_NAME,
            UUID: UUID,
        }
    };
    
    transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
    });
}
