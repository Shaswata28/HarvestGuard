# PowerShell script to test Smart Alert System
# This creates test data and triggers alerts with mock high-risk weather

$BASE_URL = "http://localhost:5000"

Write-Host "🚀 Smart Alert System Test" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Step 1: Register test farmer
Write-Host "📝 Step 1: Creating test farmer..." -ForegroundColor Yellow
$farmerData = @{
    phone = "+8801700000000"
    password = "test123"
    name = "Test Farmer"
    division = "Dhaka"
    district = "Dhaka"
    upazila = "Dhamrai"
    language = "bn"
} | ConvertTo-Json

try {
    $farmer = Invoke-RestMethod -Uri "$BASE_URL/api/farmers/register" -Method POST -ContentType "application/json" -Body $farmerData -ErrorAction SilentlyContinue
    $FARMER_ID = $farmer._id
    Write-Host "✅ Farmer created: $FARMER_ID" -ForegroundColor Green
} catch {
    # Farmer might already exist, try to login
    $loginData = @{
        phone = "+8801700000000"
        password = "test123"
    } | ConvertTo-Json
    
    $loginResult = Invoke-RestMethod -Uri "$BASE_URL/api/farmers/login" -Method POST -ContentType "application/json" -Body $loginData
    $FARMER_ID = $loginResult.farmer._id
    Write-Host "✅ Using existing farmer: $FARMER_ID" -ForegroundColor Green
}

Write-Host ""

# Step 2: Add high-risk harvested crop (open storage)
Write-Host "📝 Step 2: Adding harvested crop in open storage..." -ForegroundColor Yellow
$harvestedCrop = @{
    farmerId = $FARMER_ID
    cropType = "ধান"
    stage = "harvested"
    finalWeightKg = 500
    actualHarvestDate = "2025-11-20T00:00:00.000Z"
    storageLocation = "open_space"
    storageDivision = "Dhaka"
    storageDistrict = "Dhaka"
} | ConvertTo-Json

$crop1 = Invoke-RestMethod -Uri "$BASE_URL/api/crop-batches" -Method POST -ContentType "application/json" -Body $harvestedCrop
Write-Host "✅ Harvested crop added: $($crop1._id)" -ForegroundColor Green

# Step 3: Add growing crop near harvest
Write-Host "📝 Step 3: Adding growing crop (harvest in 5 days)..." -ForegroundColor Yellow
$futureDate = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$growingCrop = @{
    farmerId = $FARMER_ID
    cropType = "গম"
    stage = "growing"
    estimatedWeightKg = 300
    expectedHarvestDate = $futureDate
} | ConvertTo-Json

$crop2 = Invoke-RestMethod -Uri "$BASE_URL/api/crop-batches" -Method POST -ContentType "application/json" -Body $growingCrop
Write-Host "✅ Growing crop added: $($crop2._id)" -ForegroundColor Green
Write-Host ""

# Step 4: Trigger weather advisory (this will generate smart alerts)
Write-Host "📝 Step 4: Triggering smart alert generation..." -ForegroundColor Yellow
Write-Host "   (Using real weather API - alerts depend on actual conditions)" -ForegroundColor Gray
Write-Host ""

try {
    $advisories = Invoke-RestMethod -Uri "$BASE_URL/api/weather/advisories?farmerId=$FARMER_ID" -Method GET
    Write-Host "✅ Weather advisories generated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Weather API call failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Fetch generated smart alerts
Write-Host "📝 Step 5: Fetching smart alerts..." -ForegroundColor Yellow
Start-Sleep -Seconds 2  # Give time for alerts to be stored

$alertsUrl = "$BASE_URL/api/advisories?farmerId=$FARMER_ID" + "&source=weather&limit=10"
$alerts = Invoke-RestMethod -Uri $alertsUrl -Method GET

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 RESULTS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

if ($alerts.advisories.Count -eq 0) {
    Write-Host "⚠️  No alerts generated!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This could mean:" -ForegroundColor Gray
    Write-Host "  • Current weather conditions are not risky enough" -ForegroundColor Gray
    Write-Host "  • Humidity < 80%, Temperature < 30°C, etc." -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 To force alert generation, you need to:" -ForegroundColor Cyan
    Write-Host "  1. Wait for actual high-risk weather conditions, OR" -ForegroundColor White
    Write-Host "  2. Modify the weather service to return mock data, OR" -ForegroundColor White
    Write-Host "  3. Lower the risk thresholds in server/utils/riskCalculator.ts" -ForegroundColor White
} else {
    Write-Host "✅ Generated $($alerts.advisories.Count) alert(s)!" -ForegroundColor Green
    Write-Host ""
    
    $alerts.advisories | ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "─" * 60 -ForegroundColor Gray
        Write-Host "📢 Alert $i" -ForegroundColor Cyan
        Write-Host "─" * 60 -ForegroundColor Gray
        Write-Host ""
        Write-Host "💬 Message:" -ForegroundColor Yellow
        Write-Host "   $($_.payload.message)" -ForegroundColor White
        Write-Host ""
        Write-Host "✅ Actions:" -ForegroundColor Yellow
        $_.payload.actions | ForEach-Object -Begin { $j = 1 } -Process {
            Write-Host "   $j. $_" -ForegroundColor White
            $j++
        }
        Write-Host ""
        Write-Host "📅 Created: $($_.createdAt)" -ForegroundColor Gray
        Write-Host "📊 Status: $($_.status)" -ForegroundColor Gray
        Write-Host ""
        $i++
    }
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check server console for SMS simulation logs" -ForegroundColor White
Write-Host "  2. Login to frontend with:" -ForegroundColor White
Write-Host "     Phone: +8801700000000" -ForegroundColor Green
Write-Host "     Password: test123" -ForegroundColor Green
Write-Host "  3. Open browser console to see client-side SMS logs" -ForegroundColor White
Write-Host ""
