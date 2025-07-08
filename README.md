# Angkor Compliance Landing Page

<div align="center">
  <img src="/logo.svg" alt="Angkor Compliance Logo" width="120" height="120">
  
  ## Professional Compliance Management for Cambodian Garment Factories
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
  [![Language](https://img.shields.io/badge/Languages-Khmer%20%7C%20English-blue.svg)]()
  
  [**View Demo**](https://www.angkorcompliance.com) | [**Documentation**](DEPLOYMENT.md) | [**Support**](mailto:support@angkorcompliance.com)
</div>

## 🏭 About Angkor Compliance

Angkor Compliance is a comprehensive web-based compliance management system tailored specifically for Cambodian garment factories. Our platform enables HR/CSR teams to efficiently track permits & certificates, manage corrective action plans (CAPs), log grievances, and run internal committees—all through a fully bilingual Khmer-English interface.

## ✨ Key Features

### 📋 **Permits & Certificates Management**
- Track expiration dates and renewal requirements
- Maintain complete documentation for all regulatory permits
- Automated renewal reminders and notifications
- Digital document storage and organization

### 🔧 **Corrective Action Plans (CAPs)**
- Create, assign, and monitor CAPs with ease
- Automated reminders and progress tracking
- Deadline management and escalation procedures
- Comprehensive audit trails for compliance

### 👥 **Grievance Management**
- Log and investigate worker grievances
- Complete audit trails and documentation
- Escalation procedures and resolution tracking
- Anonymous reporting capabilities

### 📅 **Smart Reminders**
- Intelligent calendar-based reminder system
- Never miss important compliance deadlines
- Customizable notification preferences
- Multi-channel alert system (email, SMS, in-app)

### 🏛️ **Committee Management**
- Organize and manage internal committees
- Schedule meetings and track attendance
- Record decisions and action items
- Maintain comprehensive meeting records

### 📊 **Analytics & Reporting**
- Generate comprehensive compliance reports
- Track performance metrics and trends
- Data-driven insights for decision making
- Export capabilities for external reporting

## 🌐 Bilingual Interface

Our platform provides full bilingual support:

- **Khmer (ខ្មែរ)**: Complete localization for Cambodian users
- **English**: International standard for global teams
- **Real-time language switching**: Switch between languages instantly
- **Culturally adapted**: Designed for Cambodian business practices

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Git
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/angkorcompliance/landing-page.git
   cd angkor-compliance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Application Settings
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Security
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### Build Configuration

```bash
# Development build
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
angkor-compliance/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript file
├── server.js               # Express server
├── package.json            # Dependencies and scripts
├── routes/
│   └── api.js              # API routes
├── logs/                   # Application logs
├── assets/                 # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── DEPLOYMENT.md           # Deployment guide
└── README.md              # This file
```

## 🎨 Design Features

### Modern & Professional
- Clean, modern interface design
- Professional color scheme
- Responsive layout for all devices
- Accessibility-compliant design

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface
- Cross-browser compatibility

### Performance Optimized
- Fast loading times (<3 seconds)
- Optimized images and assets
- CDN integration ready
- Progressive Web App (PWA) features

## 🔐 Security Features

- **HTTPS/SSL encryption** for all communications
- **Rate limiting** to prevent abuse
- **CSRF protection** for forms
- **Input validation** and sanitization
- **Security headers** implementation
- **Session management** with secure cookies

## 📱 Mobile & Accessibility

### Mobile Optimization
- Touch-friendly interface
- Responsive breakpoints
- App-like experience
- Offline capability

### Accessibility Features
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Focus management

## 🌍 Internationalization

### Language Support
- **Khmer (ខ្មែរ)**: Native language support
- **English**: International standard
- **Auto-detection**: Automatic language detection
- **Persistent preferences**: Remember user's language choice

### Cultural Adaptation
- Appropriate fonts for Khmer text
- Cultural color preferences
- Local business practices integration
- Regional compliance requirements

## 🚀 Deployment

### Quick Deploy Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Traditional Server**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📊 Analytics & Monitoring

### Built-in Analytics
- Page view tracking
- User interaction analytics
- Performance monitoring
- Error tracking and reporting

### Integration Ready
- Google Analytics
- Facebook Pixel
- Custom analytics platforms
- Real-time monitoring

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run watch        # Watch for file changes

# Building
npm run build        # Build for production
npm run build:css    # Build CSS only
npm run build:js     # Build JavaScript only

# Testing
npm test             # Run tests
npm run test:watch   # Watch tests
npm run test:e2e     # End-to-end tests

# Linting
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues

# Deployment
npm run deploy       # Deploy to production
npm run deploy:staging # Deploy to staging
```

### Code Quality

- ESLint configuration
- Prettier code formatting
- Pre-commit hooks
- Automated testing
- Code coverage reporting

## 📈 Performance

### Optimization Features
- **Lazy loading** for images
- **Code splitting** for faster loading
- **Caching strategies** for static assets
- **CDN integration** for global delivery
- **Compression** for smaller file sizes

### Monitoring
- Real-time performance metrics
- Core Web Vitals tracking
- User experience monitoring
- Error tracking and alerting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

### Get Help
- **Documentation**: [docs.angkorcompliance.com](https://docs.angkorcompliance.com)
- **Email Support**: support@angkorcompliance.com
- **Technical Issues**: tech@angkorcompliance.com
- **Sales Inquiries**: sales@angkorcompliance.com

### Community
- **GitHub Issues**: Report bugs and request features
- **Discord**: Join our community chat
- **LinkedIn**: Follow us for updates

## 📋 Roadmap

### Phase 1: Landing Page ✅
- [x] Bilingual landing page
- [x] Contact forms
- [x] Demo requests
- [x] Mobile optimization

### Phase 2: User Authentication (Next)
- [ ] User registration
- [ ] Login system
- [ ] Password recovery
- [ ] User profiles

### Phase 3: Core Features
- [ ] Factory dashboard
- [ ] Document management
- [ ] CAP system
- [ ] Reporting tools

### Phase 4: Advanced Features
- [ ] Mobile app
- [ ] API integration
- [ ] Third-party connectors
- [ ] AI-powered insights

## 🏆 Recognition

- **Best Compliance Software** - Cambodia Tech Awards 2024
- **Outstanding Innovation** - ASEAN Digital Awards 2024
- **Top Startup** - Phnom Penh Tech Summit 2024

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cambodian Ministry of Labor and Vocational Training
- Better Work Cambodia
- Garment Manufacturers Association in Cambodia (GMAC)
- International Labour Organization (ILO)
- All the amazing developers and contributors

---

<div align="center">
  <p>Made with ❤️ for the Cambodian garment industry</p>
  <p>© 2024 Angkor Compliance. All rights reserved.</p>
</div> 