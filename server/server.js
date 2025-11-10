require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { autoLinkGoals } = require('./utils/autoLinkGoals');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 TalentSphere HRMS Server Running        ║
  ║                                               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
  ║   Port: ${PORT}                                  ║
  ║   Local: http://localhost:${PORT}               ║
  ║   Network: http://192.168.1.2:${PORT}          ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
  
  // Auto-link goals to projects on startup
  autoLinkGoals().then(result => {
    if (result.linked > 0) {
      console.log(`  🔗 Auto-linked ${result.linked} goals to projects`);
    }
  });
  
  // Run auto-linking every 5 minutes
  setInterval(async () => {
    const result = await autoLinkGoals();
    if (result.linked > 0) {
      console.log(`  🔗 Auto-linked ${result.linked} goals to projects`);
    }
  }, 5 * 60 * 1000); // 5 minutes
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
