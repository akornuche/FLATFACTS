# test-endpoints.ps1
# PowerShell script to test our backend endpoints

$BaseUrl = "http://localhost:3000/api"

Write-Host "🧪 Testing FlatFacts Backend Endpoints" -ForegroundColor Green
Write-Host ""

# Test 1: Send OTP
Write-Host "1. Testing Send OTP..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/send-otp" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Verify OTP (will fail without real OTP)
Write-Host "2. Testing Verify OTP (will fail without real OTP)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        otp = "123456"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/verify-otp" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Expected Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Onboarding (will fail without real UID)
Write-Host "3. Testing Onboarding (will fail without real UID)..." -ForegroundColor Yellow
try {
    $body = @{
        uid = "fake-uid-123"
        username = "testuser"
        avatar = "avatar1"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/onboarding" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Expected Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Get User Profile (will fail without real UID)
Write-Host "4. Testing Get User Profile (will fail without real UID)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/user-profile?uid=fake-uid-123" -Method GET
    Write-Host "✅ Success: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Expected Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Endpoint testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Cyan
Write-Host "- OTP verification will fail without a real OTP from the send-otp endpoint" -ForegroundColor White
Write-Host "- Onboarding and user profile will fail without real UIDs" -ForegroundColor White
Write-Host "- This is expected behavior for testing without real data" -ForegroundColor White 