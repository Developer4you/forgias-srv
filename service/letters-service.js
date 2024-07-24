const Imap = require('imap');
const inspect = require('util').inspect;

const  userEmail=process.env.SMTP_USER
const  mailPassword=process.env.MAIL_PASSWORD

const imapConfig = {
    user: userEmail,
    password: mailPassword,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

function fetchEmails() {
    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err;
            imap.search(['UNSEEN', ['SINCE', new Date()]], function(err, results) {
                if (err) throw err;
                let f = imap.fetch(results, { bodies: '' });
                f.on('message', function(msg, seqno) {
                    console.log('Message #%d', seqno);
                    msg.on('body', function(stream, info) {
                        let buffer = '';
                        stream.on('data', function(chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function() {
                            console.log('Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        });
                    });
                    msg.once('attributes', function(attrs) {
                        console.log('Attributes: %s', inspect(attrs, false, 8));
                    });
                    msg.once('end', function() {
                        console.log('Finished message.');
                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function() {
                    console.log('Done fetching all messages!');
                    imap.end();
                });
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();
}

module.exports = { openInbox, fetchEmails };