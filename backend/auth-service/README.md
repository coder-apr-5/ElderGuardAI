# 🔐 ElderNest Authentication Service

A production-ready, secure authentication service for ElderNest AI with phone OTP verification, multi-country support, family connection workflows, and Google OAuth integration.

## 🌟 Features

### Authentication Methods
- ✅ **Phone + OTP** (SMS via Twilio)
- ✅ **Email + Password** (bcrypt hashed)
- ✅ **Google OAuth** (Firebase Auth)

### Security Features
- ✅ OTP expires in 5 minutes
- ✅ Max 3 OTP attempts per phone per hour
- ✅ Rate limiting on all auth endpoints
- ✅ Phone numbers stored in E.164 format
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens expire in 24 hours
- ✅ Refresh tokens for extended sessions
- ✅ Account lockout after 5 failed login attempts

### Elder-Family Connection
- ✅ Elder provides family member phone during signup
- ✅ Family member receives OTP to verify connection
- ✅ Connection established upon verification
- ✅ Family can monitor/control linked elder accounts

### Multi-Country Support (38 Countries)
- 🇺🇸 United States, 🇨🇦 Canada
- 🇬🇧 UK, 🇫🇷 France, 🇩🇪 Germany, 🇪🇸 Spain, 🇮🇹 Italy, 🇳🇱 Netherlands, 🇸🇪 Sweden, 🇳🇴 Norway, 🇩🇰 Denmark, 🇫🇮 Finland
- 🇮🇳 India, 🇵🇰 Pakistan, 🇧🇩 Bangladesh, 🇱🇰 Sri Lanka, 🇳🇵 Nepal, 🇸🇬 Singapore, 🇲🇾 Malaysia, 🇹🇭 Thailand, 🇵🇭 Philippines, 🇻🇳 Vietnam, 🇮🇩 Indonesia
- 🇦🇪 UAE, 🇸🇦 Saudi Arabia
- 🇿🇦 South Africa, 🇰🇪 Kenya, 🇳🇬 Nigeria, 🇬🇭 Ghana, 🇪🇬 Egypt
- 🇧🇷 Brazil, 🇲🇽 Mexico, 🇦🇷 Argentina, 🇨🇱 Chile, 🇨🇴 Colombia, 🇵🇪 Peru
- 🇦🇺 Australia, 🇳🇿 New Zealand

## 📦 Installation

```bash
cd backend/auth-service
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure the following environment variables:

### Firebase (Required)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### Twilio (Required for SMS)
Get credentials from: https://console.twilio.com/
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### JWT (Required)
```env
JWT_SECRET=your-super-secret-key-minimum-32-characters
REFRESH_TOKEN_SECRET=another-super-secret-key-minimum-32-chars
```

## 🚀 Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Elder Signup (4-Step Flow)

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/auth/elder/signup/step1` | Elder enters phone, receives OTP |
| 2 | `POST /api/auth/elder/signup/step2` | Elder verifies phone with OTP |
| 3 | `POST /api/auth/elder/signup/step3` | Elder provides info + family phone |
| 4 | `POST /api/auth/elder/signup/step4` | Family verifies, account created |

### Family Signup

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/family/signup` | Email/password signup |

### Login

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login/phone` | Phone login - send OTP |
| `POST /api/auth/login/phone/verify` | Phone login - verify OTP |
| `POST /api/auth/login/email` | Email/password login |
| `POST /api/auth/login/google` | Google OAuth login |

### Token Management

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/auth/logout` | Logout (revoke tokens) |
| `GET /api/auth/me` | Get current user |

### Connections

| Endpoint | Description |
|----------|-------------|
| `GET /api/connections/elders` | Get connected elders (family) |
| `GET /api/connections/family` | Get connected family (elder) |
| `GET /api/countries` | Get supported countries |

## 📝 API Examples

### Elder Signup Step 1
```bash
curl -X POST http://localhost:5000/api/auth/elder/signup/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "countryCode": "IN"
  }'
```

### Family Signup
```bash
curl -X POST http://localhost:5000/api/auth/family/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "family@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }'
```

### Phone Login
```bash
curl -X POST http://localhost:5000/api/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "countryCode": "IN"
  }'
```

## 🏗️ Project Structure

```
src/
├── config/
│   ├── firebase.ts      # Firebase Admin SDK
│   ├── twilio.ts        # Twilio SMS client
│   └── jwt.ts           # JWT configuration
├── services/
│   ├── auth.service.ts  # Main authentication logic
│   ├── otp.service.ts   # OTP generation & verification
│   ├── phone.service.ts # Phone validation
│   ├── email.service.ts # Email validation
│   └── family-connection.service.ts
├── controllers/
│   ├── auth.controller.ts
│   └── connection.controller.ts
├── routes/
│   ├── auth.routes.ts
│   └── connection.routes.ts
├── middleware/
│   ├── auth.middleware.ts    # JWT authentication
│   ├── rateLimiter.ts        # Rate limiting
│   └── validator.ts          # Input validation
├── types/
│   ├── user.types.ts
│   └── otp.types.ts
├── utils/
│   ├── logger.ts
│   ├── phoneFormatter.ts
│   └── emailValidator.ts
└── server.ts
```

## 🔒 Security Considerations

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Rotate JWT secrets regularly** in production
3. **Enable HTTPS** in production
4. **Review rate limits** based on your traffic
5. **Monitor authentication logs** for suspicious activity

## 📄 License

MIT
