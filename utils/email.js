require('dotenv').config()

module.exports = {sendEmailVerificationMail: sendEmailVerificationMail, sendEmailResetPass: sendEmailResetPass, sendEmailBookingCancelled: sendEmailBookingCancelled, sendEmailOrgDeleted: sendEmailOrgDeleted, sendEmailUserDeleted: sendEmailUserDeleted}

const path = require('path')
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var _ = require('lodash');
const utilPatches = require('../utils/patches.js');

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

function sendEmailResetPass(toEmail, UUID) {

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
        subject: 'Reset Password',
        template: 'email_formats/forgot_password',
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

function sendEmailBookingCancelled(toEmail, orgObj, bookingObj) {

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
    
    const slot_details = orgObj.working_hours[bookingObj.date.getDay()][Number(bookingObj.slot_no) - 1];
    const mailData = {
        from: process.env.MAIL_CLIENT_EMAIL,
        to: toEmail,
        subject: 'Booking Cancelled',
        template: 'email_formats/booking_cancelled',
        context: {
            protocol: process.env.HTTP_PROTOCOL,
            domain: process.env.DOMAIN_NAME,
            org_name: _.startCase(orgObj.name),
            date: bookingObj.date.toDateString(),
            time: `${utilPatches.addZeroToStart(slot_details[0][0])}:${utilPatches.addZeroToStart(slot_details[0][1])} - ${utilPatches.addZeroToStart(slot_details[1][0])}:${utilPatches.addZeroToStart(slot_details[1][1])}`,
            price: bookingObj.price,
        }
    };
    
    transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
    });
}

function sendEmailOrgDeleted(toEmail, orgObj, bookingObj) {

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
    
    const slot_details = orgObj.working_hours[bookingObj.date.getDay()][Number(bookingObj.slot_no) - 1];
    const mailData = {
        from: process.env.MAIL_CLIENT_EMAIL,
        to: toEmail,
        subject: 'Booking Cancelled',
        template: 'email_formats/org_deleted',
        context: {
            protocol: process.env.HTTP_PROTOCOL,
            domain: process.env.DOMAIN_NAME,
            org_name: _.startCase(orgObj.name),
            date: bookingObj.date.toDateString(),
            time: `${utilPatches.addZeroToStart(slot_details[0][0])}:${utilPatches.addZeroToStart(slot_details[0][1])} - ${utilPatches.addZeroToStart(slot_details[1][0])}:${utilPatches.addZeroToStart(slot_details[1][1])}`,
            price: bookingObj.price,
        }
    };
    
    transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
    });
}

function sendEmailUserDeleted(toEmail, cancelledBookings) {

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
        subject: 'Account Deleted',
        template: 'email_formats/user_deleted',
        context: {
            protocol: process.env.HTTP_PROTOCOL,
            domain: process.env.DOMAIN_NAME,
            cancelledBookings: cancelledBookings
        }
    };
    
    transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
    });
}