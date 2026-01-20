#!/usr/bin/env pwsh
# Test Central Verification Policy API

$baseUrl = "http://localhost:5001/api"
$adminToken = "YOUR_ADMIN_TOKEN_HERE"  # Replace with actual admin JWT token
$agentToken = "YOUR_AGENT_TOKEN_HERE"   # Replace with actual agent JWT token

Write-Host "`n=== Central Verification Policy API Tests ===" -ForegroundColor Cyan

# Test 1: Get policy for a society (requires auth)
Write-Host "`n1. GET Policy for Society SOC-2024-0001" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/policy/central-verification/SOC-2024-0001" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Enable policy (admin only)
Write-Host "`n2. PUT Enable Policy for Society SOC-2024-0001" -ForegroundColor Yellow
try {
    $body = @{
        enabled = $true
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/policy/central-verification/SOC-2024-0001" `
        -Method PUT `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify policy was enabled
Write-Host "`n3. GET Policy Again to Verify" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/policy/central-verification/SOC-2024-0001" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -ContentType "application/json"
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Policy Enabled: $($data.data.requireCentralVerification)" -ForegroundColor $(if ($data.data.requireCentralVerification) { "Green" } else { "Red" })
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Disable policy
Write-Host "`n4. PUT Disable Policy" -ForegroundColor Yellow
try {
    $body = @{
        enabled = $false
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/policy/central-verification/SOC-2024-0001" `
        -Method PUT `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get all policies (admin only)
Write-Host "`n5. GET All Society Policies" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/policy/central-verification" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Total Societies: $($data.count)" -ForegroundColor Gray
    Write-Host "Societies with Policy Enabled: $(($data.data | Where-Object { $_.requireCentralVerification }).Count)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Agent checks their society policy
Write-Host "`n6. GET My Society Policy (Agent)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/policy/my-society" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $agentToken" } `
        -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nNote: Replace YOUR_ADMIN_TOKEN_HERE and YOUR_AGENT_TOKEN_HERE with actual JWT tokens" -ForegroundColor Yellow
