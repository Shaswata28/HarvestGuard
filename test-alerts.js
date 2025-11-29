/**
 * Manual test script for Smart Alert System
 * Tests alert generation with mock high-risk weather data
 */

import { MongoClient } from 'mongodb';
import { smartAlertService } from './server/services/smartAlert.service.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/HarvestGuard';

async function testSmartAlerts() {
  console.log('🚀 Starting Smart Alert System Test\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // 1. Create or find a test farmer
    console.log('📝 Step 1: Creating test farmer...');
    const farmersCollection = db.collection('farmers');
    
    let farmer = await farmersCollection.findOne({ phone: '+8801700000000' });
    
    if (!farmer) {
      const result = await farmersCollection.insertOne({
        phone: '+8801700000000',
        password: 'test123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhamrai',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      farmer = { _id: result.insertedId, phone: '+8801700000000' };
    }
    
    console.log(`✅ Farmer ID: ${farmer._id}\n`);
    
    // 2. Create test crops with high-risk conditions
    console.log('📝 Step 2: Creating test crops...');
    const cropsCollection = db.collection('cropBatches');
    
    // Clear existing test crops
    await cropsCollection.deleteMany({ farmerId: farmer._id });
    
    // Add harvested crop in open storage (HIGH RISK)
    const harvestedCrop = await cropsCollection.insertOne({
      farmerId: farmer._id,
      cropType: 'ধান',
      stage: 'harvested',
      finalWeightKg: 500,
      actualHarvestDate: new Date('2025-11-20'),
      storageLocation: 'open_space',
      storageDivision: 'Dhaka',
      storageDistrict: 'Dhaka',
      enteredDate: new Date()
    });
    console.log(`✅ Added harvested crop (open storage): ${harvestedCrop.insertedId}`);
    
    // Add growing crop near harvest (MEDIUM RISK)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // 5 days from now
    
    const growingCrop = await cropsCollection.insertOne({
      farmerId: farmer._id,
      cropType: 'গম',
      stage: 'growing',
      estimatedWeightKg: 300,
      expectedHarvestDate: futureDate,
      enteredDate: new Date()
    });
    console.log(`✅ Added growing crop (harvest in 5 days): ${growingCrop.insertedId}\n`);
    
    // 3. Create mock high-risk weather data
    console.log('📝 Step 3: Creating mock high-risk weather...');
    const mockWeather = {
      location: { lat: 23.8103, lon: 90.4125 },
      temperature: 40,      // High temperature (Critical threshold: 42°C)
      feelsLike: 45,
      humidity: 90,         // Very high humidity (Critical threshold: 90%)
      pressure: 1010,
      windSpeed: 15,        // Strong winds (High threshold: 15 m/s)
      windDirection: 180,
      rainfall: 120,        // Heavy rainfall (High threshold: 100mm)
      weatherCondition: 'Rain',
      weatherDescription: 'heavy rain',
      weatherIcon: '10d',
      visibility: 3000,
      cloudiness: 95,
      sunrise: new Date().toISOString(),
      sunset: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      source: 'test'
    };
    
    console.log('Weather Conditions:');
    console.log(`  🌡️  Temperature: ${mockWeather.temperature}°C`);
    console.log(`  💧 Humidity: ${mockWeather.humidity}%`);
    console.log(`  🌧️  Rainfall: ${mockWeather.rainfall}mm`);
    console.log(`  💨 Wind Speed: ${mockWeather.windSpeed} m/s\n`);
    
    // 4. Generate smart alerts
    console.log('📝 Step 4: Generating smart alerts...\n');
    console.log('═'.repeat(60));
    
    const alerts = await smartAlertService.generateAlertsForFarmer(
      farmer._id,
      mockWeather
    );
    
    console.log('═'.repeat(60));
    console.log(`\n✅ Generated ${alerts.length} alert(s)\n`);
    
    // 5. Display alerts
    if (alerts.length === 0) {
      console.log('⚠️  No alerts generated. Weather conditions may not meet risk thresholds.');
    } else {
      alerts.forEach((alert, index) => {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📢 Alert ${index + 1}:`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`🌾 Crop: ${alert.cropType}`);
        console.log(`📊 Stage: ${alert.stage}`);
        console.log(`⚠️  Risk Level: ${alert.riskLevel}`);
        console.log(`\n💬 Message:`);
        console.log(`   ${alert.message}`);
        console.log(`\n✅ Actions:`);
        alert.actions.forEach((action, i) => {
          console.log(`   ${i + 1}. ${action}`);
        });
        console.log(`\n🌡️  Weather Conditions:`);
        console.log(`   Temperature: ${alert.weatherConditions.temperature}°C`);
        console.log(`   Humidity: ${alert.weatherConditions.humidity}%`);
        console.log(`   Rainfall: ${alert.weatherConditions.rainfall}mm`);
        console.log(`   Wind Speed: ${alert.weatherConditions.windSpeed} m/s`);
        
        if (alert.storageInfo) {
          console.log(`\n📦 Storage Info:`);
          console.log(`   Location: ${alert.storageInfo.location}`);
          console.log(`   Division: ${alert.storageInfo.division}`);
          console.log(`   District: ${alert.storageInfo.district}`);
        }
      });
      console.log(`\n${'─'.repeat(60)}\n`);
    }
    
    // 6. Check stored advisories
    console.log('📝 Step 5: Checking stored advisories...');
    const advisoriesCollection = db.collection('advisories');
    const storedAdvisories = await advisoriesCollection
      .find({ farmerId: farmer._id, source: 'weather' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`✅ Found ${storedAdvisories.length} stored advisory(ies)\n`);
    
    if (storedAdvisories.length > 0) {
      console.log('Recent Advisories:');
      storedAdvisories.forEach((adv, i) => {
        console.log(`\n${i + 1}. ${adv.payload.message.substring(0, 80)}...`);
        console.log(`   Status: ${adv.status}`);
        console.log(`   Created: ${adv.createdAt}`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 To test in frontend:');
    console.log(`   1. Login with phone: +8801700000000`);
    console.log(`   2. Password: test123`);
    console.log(`   3. Check Dashboard for alerts`);
    console.log(`   4. Open browser console for SMS simulation logs\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testSmartAlerts().catch(console.error);
