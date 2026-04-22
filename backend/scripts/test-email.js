const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sendTestReceiptEmail } = require('../utils/mailer');

const recipient = String(process.argv[2] || process.env.SMTP_TEST_TO || '').trim();

if (!recipient) {
  console.error('Missing test recipient. Use: npm run test:email -- your@email.com');
  process.exit(1);
}

sendTestReceiptEmail({ to: recipient })
  .then((result) => {
    if (!result?.sent) {
      console.error(`Test email was not sent: ${result?.reason || 'unknown-reason'}`);
      process.exit(1);
    }

    console.log(`Test email sent to ${recipient}`);
  })
  .catch((error) => {
    console.error('Test email failed:', error.message || error);
    process.exit(1);
  });
