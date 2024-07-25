const Imap = require('imap');
const { parseHeader } = require('imap');
const inspect = require('util').inspect;

const userEmail = process.env.SMTP_USER;
const mailPassword = process.env.MAIL_PASSWORD;

const imapConfig = {
    user: userEmail,
    password: mailPassword,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
}

async function fetchEmails() {
    return new Promise((resolve, reject) => {
        imap.once('ready', function() {
            openInbox(function(err, box) {
                if (err) {
                    console.error('Error opening inbox:', err);
                    return reject(err);
                }

                // Определяем дату 2 месяца назад
                const twoMonthsAgo = new Date();
                twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

                imap.search(['ALL', ['SINCE', twoMonthsAgo]], function(err, results) {
                    if (err) {
                        console.error('Error searching emails:', err);
                        return reject(err);
                    }

                    console.log('Search results:', results);

                    // Сортировка сообщений по времени получения и выбор последних 3
                    results.sort((a, b) => b - a);
                    const latestResults = results.slice(0, 3);

                    if (latestResults.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    let emails = [];
                    let fetch = imap.fetch(latestResults, { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'], struct: true });

                    fetch.on('message', function(msg, seqno) {
                        console.log('Fetching message #%d', seqno);
                        let email = { from: '', subject: '', date: '', text: '', attachments: [] };

                        msg.on('body', function(stream, info) {
                            let buffer = '';
                            stream.on('data', function(chunk) {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', function() {
                                if (info.which === 'TEXT') {
                                    email.text = buffer;
                                } else {
                                    let headers = parseHeader(buffer);
                                    console.log('headers: ', headers)
                                    email.from = headers.from[0] || '';
                                    email.subject = headers.subject[0] || '';
                                    email.date = headers.date[0] || '';
                                }
                            });
                        });

                        msg.once('attributes', function(attrs) {
                            if (attrs.struct && attrs.struct.length) {
                                attrs.struct.forEach(function(part) {
                                    if (part.disposition && part.disposition.type === 'ATTACHMENT') {
                                        email.attachments.push({
                                            filename: part.disposition.params.filename,
                                            size: part.size
                                        });
                                    }
                                });
                            }
                        });

                        msg.once('end', function() {
                            emails.push(email);
                            if (emails.length === latestResults.length) {
                                imap.end();
                            }
                        });
                    });

                    fetch.once('error', function(err) {
                        console.error('Fetch error:', err);
                        imap.end(); // Ensure the connection is closed on error
                        reject(err);
                    });

                    fetch.once('end', function() {
                        console.log('Fetching done.');
                        if (emails.length === latestResults.length) {
                            resolve(emails); // Resolve with the list of emails
                        } else {
                            imap.end();
                        }
                    });
                });
            });
        });

        imap.once('error', function(err) {
            console.error('IMAP error:', err);
            reject(err);
        });

        imap.once('end', function() {
            console.log('IMAP connection ended');
        });

        imap.connect();
    });
}

module.exports = { fetchEmails };
