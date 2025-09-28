const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use the provided MongoDB Atlas URI
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://mario:mario123@cluster0.a8og4qr.mongodb.net/fir_management?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🌐 Attempting to connect to MongoDB Atlas...');
    console.log('🔗 URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000, // 60 seconds
      connectTimeoutMS: 60000, // 60 seconds
      maxPoolSize: 5, // Reduce pool size
      bufferCommands: false, // Disable mongoose buffering
      retryWrites: true,
      w: 'majority',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    console.log(`⚡ Ready to serve requests!`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed!');
    console.error('📋 Error details:');
    console.error(`   • Message: ${error.message}`);
    console.error(`   • Code: ${error.code || 'N/A'}`);
    console.error(`   • Name: ${error.name || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Possible causes:');
      console.error('   • Network connectivity issues');
      console.error('   • MongoDB Atlas cluster is paused');
      console.error('   • IP address not whitelisted in Atlas');
      console.error('   • Firewall blocking the connection');
    }
    
    console.log('⚠️  Server will start but authentication will not work');
    console.log('💡 To fix this:');
    console.log('   1. Check if MongoDB Atlas cluster is running');
    console.log('   2. Whitelist your IP address in Atlas Network Access');
    console.log('   3. Verify username/password are correct');
    console.log('   4. Check if cluster is paused');
    console.log('');
    console.log('🔄 Retrying connection in 30 seconds...');
    
    // Don't exit, let the server start but mark connection as failed
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB Atlas connection...');
      connectDB();
    }, 30000);
  }
};

module.exports = connectDB;
