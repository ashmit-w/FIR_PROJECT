const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FIR = require('../models/FIR.model');
const PoliceStation = require('../models/PoliceStation.model');
const User = require('../models/User.model');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://mario:mario123@cluster0.a8og4qr.mongodb.net/fir_management?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample sections for FIRs
const sampleSections = [
  { act: 'IPC', section: '302' }, // Murder
  { act: 'IPC', section: '307' }, // Attempt to murder
  { act: 'IPC', section: '376' }, // Rape
  { act: 'IPC', section: '420' }, // Cheating
  { act: 'IPC', section: '379' }, // Theft
  { act: 'IPC', section: '392' }, // Robbery
  { act: 'IPC', section: '498A' }, // Dowry harassment
  { act: 'NDPS', section: '20' }, // Narcotics
  { act: 'IT ACT', section: '66C' }, // Identity theft
  { act: 'IPC', section: '354' }, // Assault on women
];

// Get a random section
const getRandomSection = () => {
  return sampleSections[Math.floor(Math.random() * sampleSections.length)];
};

// Get random seriousness days
const getRandomSeriousnessDays = () => {
  const options = [60, 90, 180];
  return options[Math.floor(Math.random() * options.length)];
};

// Generate a unique FIR number
const generateFIRNumber = (stationCode, index) => {
  const currentYear = new Date().getFullYear();
  const paddedIndex = String(index).padStart(3, '0');
  return `${paddedIndex}/${currentYear}`;
};

// Main seeding function
const seedFIRs = async () => {
  try {
    console.log('🌱 Starting FIR seeding process...\n');

    // Get or create an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('📝 Creating admin user...');
      adminUser = await User.create({
        username: 'admin_seed',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin'
      });
      console.log(`✅ Admin user created: ${adminUser.username}`);
    } else {
      console.log(`✅ Using existing admin user: ${adminUser.username}`);
    }

    // Get all active police stations
    const policeStations = await PoliceStation.find({ isActive: true });
    console.log(`\n📊 Found ${policeStations.length} active police stations\n`);

    if (policeStations.length === 0) {
      console.log('⚠️  No police stations found. Please create police stations first.');
      return;
    }

    // Get existing FIRs to avoid duplicates
    const existingFIRs = await FIR.find({ isActive: true });
    const existingFIRNumbers = new Set(existingFIRs.map(fir => fir.firNumber));
    const existingStationIds = new Set(existingFIRs.map(fir => fir.policeStationId.toString()));

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Create one FIR for each police station
    for (let i = 0; i < policeStations.length; i++) {
      const station = policeStations[i];
      
      // Skip if FIR already exists for this station
      if (existingStationIds.has(station._id.toString())) {
        console.log(`⏭️  Skipping ${station.name} - FIR already exists`);
        skippedCount++;
        continue;
      }

      try {
        // Generate unique FIR number
        let firNumber;
        let attempt = 1;
        do {
          firNumber = generateFIRNumber(station.code, attempt);
          attempt++;
        } while (existingFIRNumbers.has(firNumber) && attempt < 1000);

        if (attempt >= 1000) {
          console.log(`⚠️  Could not generate unique FIR number for ${station.name}`);
          errorCount++;
          continue;
        }

        // Create filing date (random date in the past 6 months, but not in the future)
        const now = new Date();
        const filingDate = new Date(now);
        const monthsAgo = Math.floor(Math.random() * 6) + 1; // 1-6 months ago
        filingDate.setMonth(filingDate.getMonth() - monthsAgo);
        filingDate.setDate(Math.floor(Math.random() * 28) + 1); // Random day 1-28
        filingDate.setHours(Math.floor(Math.random() * 24));
        filingDate.setMinutes(Math.floor(Math.random() * 60));
        filingDate.setSeconds(0);
        filingDate.setMilliseconds(0);
        
        // Ensure date is not in the future
        if (filingDate > now) {
          filingDate.setTime(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Random date in past 30 days
        }

        // Create FIR
        const fir = await FIR.create({
          firNumber,
          sections: [getRandomSection()],
          policeStation: station.name,
          policeStationId: station._id,
          filingDate,
          seriousnessDays: getRandomSeriousnessDays(),
          disposalStatus: 'Registered',
          createdBy: adminUser._id,
          assignedTo: adminUser._id,
          isActive: true
        });

        // Add to existing sets to avoid duplicates
        existingFIRNumbers.add(firNumber);
        existingStationIds.add(station._id.toString());

        console.log(`✅ Created FIR ${fir.firNumber} for ${station.name} (${station.subdivision})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating FIR for ${station.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log(`   ✅ Created: ${createdCount} FIRs`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (already exist)`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

// Run the seeding
const run = async () => {
  try {
    await connectDB();
    await seedFIRs();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = { seedFIRs };

