"use strict";

var nodemailer 	= require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var ejs = require("ejs");

module.exports = {
    renderHtml: function(template_name, template_vars_object){
        var renderData = template_vars_object.content;
        ejs.renderFile(__dirname + '/../views/email/'+template_name+'.ejs', template_vars_object, function(err, data){
            renderData = data;
        });
        return renderData;
    },

    sendMail: function(to_email, subject, template, template_vars_object, attachments) {

        if(!attachments){
            attachments = [];
        }

        var transporter = nodemailer.createTransport(smtpTransport({
            host: 'localhost',
            port: 25,
            auth: {
                user: '',
                pass: 'mnciuewrYUfwsnd872IUkjds732'
            },
            tls: {
                rejectUnauthorized: false
            }
        }));

        var htmlTemplate = this.renderHtml(template, template_vars_object);

        return transporter.sendMail({
            from: 'noreply@localhost',
            to: to_email,
            subject: subject,
            html: htmlTemplate,
            generateTextFromHTML: true,
            attachments: attachments
        });
    }
};