// Helper to generate styled HTML email
const getEmailTemplate = (title, messageBody, actionType, actionData) => {
  // actionType: 'otp' or 'link'
  // actionData: The OTP code or the Reset URL
  
  const primaryColor = "#16a34a"; // Green-600
  const backgroundColor = "#f3f4f6"; // Gray-100

  let actionHtml = '';

  if (actionType === 'otp') {
    actionHtml = `
      <div style="margin: 30px 0;">
        <span style="
          display: inline-block;
          font-family: monospace;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          color: ${primaryColor};
          background-color: #f0fdf4;
          border: 2px dashed ${primaryColor};
          padding: 15px 30px;
          border-radius: 8px;
        ">${actionData}</span>
      </div>
    `;
  } else if (actionType === 'link') {
    actionHtml = `
      <div style="margin: 30px 0;">
        <a href="${actionData}" style="
          background-color: ${primaryColor};
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 6px;
          display: inline-block;
          font-size: 16px;
        ">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        Or copy this link: <br/> 
        <a href="${actionData}" style="color: ${primaryColor};">${actionData}</a>
      </p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${backgroundColor}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${primaryColor}; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 40px; text-align: center; color: #374151; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Family Tree App</h1>
        </div>
        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
          <p>${messageBody}</p>
          
          ${actionHtml}

          <p style="color: #6b7280; font-size: 14px;">This code/link expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Family Tree App. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getEmailTemplate;