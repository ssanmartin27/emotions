export function getOTPEmailTemplate(token: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to Emo-Kids</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #FF6678;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-body p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 20px 0;
        }
        .token-container {
            background-color: #f8f9fa;
            border: 2px dashed #FF6678;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .token {
            font-size: 32px;
            font-weight: 700;
            color: #FF6678;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .email-footer p {
            color: #6c757d;
            font-size: 14px;
            margin: 5px 0;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .expiry-notice p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Emo-Kids</h1>
        </div>
        <div class="email-body">
            <p>Hello!</p>
            <p>You requested a sign-in code for your Emo-Kids account. Use the code below to complete your sign-in:</p>
            
            <div class="token-container">
                <p class="token">${token}</p>
            </div>
            
            <div class="expiry-notice">
                <p>⏱️ This code will expire in 10 minutes for security purposes.</p>
            </div>
            
            <p>If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div class="email-footer">
            <p>This is an automated message from Emo-Kids</p>
            <p>Please do not reply to this email</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export function getPasswordResetEmailTemplate(token: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password in Emo-Kids</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #FF6678;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-body p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 20px 0;
        }
        .token-container {
            background-color: #f8f9fa;
            border: 2px dashed #FF6678;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .token {
            font-size: 32px;
            font-weight: 700;
            color: #FF6678;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .email-footer p {
            color: #6c757d;
            font-size: 14px;
            margin: 5px 0;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .expiry-notice p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .security-notice {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .security-notice p {
            color: #721c24;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Emo-Kids</h1>
        </div>
        <div class="email-body">
            <p>Hello!</p>
            <p>You requested to reset your password for your Emo-Kids account. Use the code below to reset your password:</p>
            
            <div class="token-container">
                <p class="token">${token}</p>
            </div>
            
            <div class="expiry-notice">
                <p>⏱️ This code will expire in 10 minutes for security purposes.</p>
            </div>
            
            <div class="security-notice">
                <p>🔒 If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
            </div>
        </div>
        <div class="email-footer">
            <p>This is an automated message from Emo-Kids</p>
            <p>Please do not reply to this email</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

