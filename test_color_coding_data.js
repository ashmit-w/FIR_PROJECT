const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test data to demonstrate all color coding states
const testFIRs = [
  // SAFE CASES (>15 days remaining) - Green
  {
    firNumber: '001/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Panaji PS',
    filingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    seriousnessDays: 90,
    description: 'Safe case - 60 days remaining'
  },
  {
    firNumber: '002/2025',
    sections: [{ act: 'IPC', section: '379' }],
    policeStation: 'Mapusa PS',
    filingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    seriousnessDays: 60,
    description: 'Safe case - 40 days remaining'
  },
  {
    firNumber: '003/2025',
    sections: [{ act: 'IPC', section: '406' }],
    policeStation: 'Margao Town PS',
    filingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    seriousnessDays: 180,
    description: 'Safe case - 170 days remaining'
  },

  // WARNING CASES (10-15 days remaining) - Yellow
  {
    firNumber: '004/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Vasco PS',
    filingDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
    seriousnessDays: 90,
    description: 'Warning case - 10 days remaining'
  },
  {
    firNumber: '005/2025',
    sections: [{ act: 'IPC', section: '384' }],
    policeStation: 'Ponda PS',
    filingDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), // 75 days ago
    seriousnessDays: 90,
    description: 'Warning case - 15 days remaining'
  },
  {
    firNumber: '006/2025',
    sections: [{ act: 'IPC', section: '506' }],
    policeStation: 'Quepem PS',
    filingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
    seriousnessDays: 60,
    description: 'Warning case - 10 days remaining'
  },

  // CRITICAL CASES (5-9 days remaining) - Orange
  {
    firNumber: '007/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Bicholim PS',
    filingDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
    seriousnessDays: 90,
    description: 'Critical case - 5 days remaining'
  },
  {
    firNumber: '008/2025',
    sections: [{ act: 'IPC', section: '379' }],
    policeStation: 'Pernem PS',
    filingDate: new Date(Date.now() - 82 * 24 * 60 * 60 * 1000), // 82 days ago
    seriousnessDays: 90,
    description: 'Critical case - 8 days remaining'
  },
  {
    firNumber: '009/2025',
    sections: [{ act: 'IPC', section: '406' }],
    policeStation: 'Porvorim PS',
    filingDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
    seriousnessDays: 60,
    description: 'Critical case - 5 days remaining'
  },

  // URGENT CASES (1-4 days remaining) - Red
  {
    firNumber: '010/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Calangute PS',
    filingDate: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000), // 89 days ago
    seriousnessDays: 90,
    description: 'Urgent case - 1 day remaining'
  },
  {
    firNumber: '011/2025',
    sections: [{ act: 'IPC', section: '384' }],
    policeStation: 'Anjuna PS',
    filingDate: new Date(Date.now() - 87 * 24 * 60 * 60 * 1000), // 87 days ago
    seriousnessDays: 90,
    description: 'Urgent case - 3 days remaining'
  },
  {
    firNumber: '012/2025',
    sections: [{ act: 'IPC', section: '506' }],
    policeStation: 'Colva PS',
    filingDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000), // 58 days ago
    seriousnessDays: 60,
    description: 'Urgent case - 2 days remaining'
  },

  // OVERDUE CASES (0 or negative days) - Dark Red/Exceeded
  {
    firNumber: '013/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Cuncolim PS',
    filingDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
    seriousnessDays: 90,
    description: 'Overdue case - 5 days exceeded'
  },
  {
    firNumber: '014/2025',
    sections: [{ act: 'IPC', section: '379' }],
    policeStation: 'Sanguem PS',
    filingDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
    seriousnessDays: 90,
    description: 'Overdue case - 10 days exceeded'
  },
  {
    firNumber: '015/2025',
    sections: [{ act: 'IPC', section: '406' }],
    policeStation: 'Curchorem PS',
    filingDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000), // 65 days ago
    seriousnessDays: 60,
    description: 'Overdue case - 5 days exceeded'
  },

  // MIXED DISPOSAL STATUSES
  {
    firNumber: '016/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Marcaim PS',
    filingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    seriousnessDays: 90,
    description: 'Chargesheeted case - 45 days remaining',
    disposalStatus: 'Chargesheeted'
  },
  {
    firNumber: '017/2025',
    sections: [{ act: 'IPC', section: '384' }],
    policeStation: 'Shiroda PS',
    filingDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    seriousnessDays: 90,
    description: 'Finalized case - 30 days exceeded',
    disposalStatus: 'Finalized',
    disposalDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    firNumber: '018/2025',
    sections: [{ act: 'IPC', section: '506' }],
    policeStation: 'Dabolim PS',
    filingDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    seriousnessDays: 60,
    description: 'Chargesheeted case - 25 days remaining',
    disposalStatus: 'Chargesheeted'
  },

  // DIFFERENT SERIOUSNESS DAYS
  {
    firNumber: '019/2025',
    sections: [{ act: 'IPC', section: '420' }],
    policeStation: 'Mormugao PS',
    filingDate: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000), // 170 days ago
    seriousnessDays: 180,
    description: '180-day case - 10 days remaining'
  },
  {
    firNumber: '020/2025',
    sections: [{ act: 'IPC', section: '379' }],
    policeStation: 'WSPS',
    filingDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
    seriousnessDays: 60,
    description: '60-day case - 5 days remaining'
  }
];

async function createTestData() {
  try {
    console.log('🧪 Creating test data for color coding demonstration...');
    
    // First login to get a token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create each test FIR
    for (const firData of testFIRs) {
      try {
        const response = await axios.post(`${API_BASE_URL}/firs`, firData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          console.log(`✅ Created FIR ${firData.firNumber} - ${firData.description}`);
          successCount++;
          
          // Update disposal status if specified
          if (firData.disposalStatus && firData.disposalStatus !== 'Registered') {
            const updateData = {
              status: firData.disposalStatus
            };
            
            if (firData.disposalDate) {
              updateData.disposalDate = firData.disposalDate.toISOString();
            }
            
            await axios.put(`${API_BASE_URL}/firs/${response.data.data._id}`, updateData, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`  ↳ Updated disposal status to ${firData.disposalStatus}`);
          }
        } else {
          console.log(`❌ Failed to create FIR ${firData.firNumber}:`, response.data.message);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error creating FIR ${firData.firNumber}:`, error.response?.data?.message || error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Test Data Creation Summary:');
    console.log(`✅ Successfully created: ${successCount} FIRs`);
    console.log(`❌ Failed to create: ${errorCount} FIRs`);
    console.log(`📋 Total test FIRs: ${testFIRs.length}`);
    
    console.log('\n🎨 Color Coding Demonstration:');
    console.log('🟢 Green (Safe): >15 days remaining - FIRs 001, 002, 003');
    console.log('🟡 Yellow (Warning): 10-15 days remaining - FIRs 004, 005, 006');
    console.log('🟠 Orange (Critical): 5-9 days remaining - FIRs 007, 008, 009');
    console.log('🔴 Red (Urgent): 1-4 days remaining - FIRs 010, 011, 012');
    console.log('🔴 Dark Red (Overdue): 0 or negative days - FIRs 013, 014, 015');
    console.log('📋 Different Statuses: Registered (blue), Chargesheeted (green), Finalized (purple)');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.log('❌ Network error - no response received:', error.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run the test data creation
createTestData();
