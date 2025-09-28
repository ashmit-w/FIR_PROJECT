import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PoliceStation from '../../../../backend/models/PoliceStation.model';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mario:mario123@cluster0.a8og4qr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all police stations
    const policeStations = await PoliceStation.find({})
      .select('_id name code subdivision')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: policeStations,
      count: policeStations.length
    });

  } catch (error) {
    console.error('Error fetching police stations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch police stations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
