const mongoose = require('mongoose');
const PoliceStation = require('./models/PoliceStation.model');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const samplePoliceStations = [
  {
    name: 'Panaji Police Station',
    code: 'PAN',
    subdivision: 'Panaji',
    district: 'North Goa',
    state: 'Goa',
    address: 'Panaji, Goa',
    contactNumber: '0832-2221234',
    inCharge: {
      name: 'Inspector John Doe',
      designation: 'Station House Officer',
      contactNumber: '9876543210'
    }
  },
  {
    name: 'Mapusa Police Station',
    code: 'MAP',
    subdivision: 'Mapusa',
    district: 'North Goa',
    state: 'Goa',
    address: 'Mapusa, Goa',
    contactNumber: '0832-2261234',
    inCharge: {
      name: 'Inspector Jane Smith',
      designation: 'Station House Officer',
      contactNumber: '9876543211'
    }
  },
  {
    name: 'Calangute Police Station',
    code: 'CAL',
    subdivision: 'Calangute',
    district: 'North Goa',
    state: 'Goa',
    address: 'Calangute, Goa',
    contactNumber: '0832-2271234',
    inCharge: {
      name: 'Inspector Mike Johnson',
      designation: 'Station House Officer',
      contactNumber: '9876543212'
    }
  }
];

const seedPoliceStations = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing police stations
    await PoliceStation.deleteMany({});
    console.log('Cleared existing police stations');

    // Insert sample police stations
    const createdStations = await PoliceStation.insertMany(samplePoliceStations);
    console.log(`Created ${createdStations.length} police stations`);

    console.log('Police stations seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding police stations:', error);
    process.exit(1);
  }
};

seedPoliceStations();
