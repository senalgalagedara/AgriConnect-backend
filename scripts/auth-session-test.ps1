# Simple auth session test script
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$body = @{ 
  email = 'sessiontest@example.com'
  password = 'secret123'
  role = 'farmer'
  firstName = 'Session'
  lastName = 'Test'
} | ConvertTo-Json

Write-Host 'Signing up user...'
$signup = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' -Method Post -Body $body -ContentType 'application/json' -WebSession $session -Headers @{ 'Accept'='application/json' }
Write-Host 'Signup Status:' $signup.StatusCode
Write-Host 'Set-Cookie:' ($signup.Headers['Set-Cookie'])

Write-Host 'Calling /api/auth/session with cookie...'
$sessionResp = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/session' -Method Get -WebSession $session -Headers @{ 'Accept'='application/json' }
Write-Host 'Session Status:' $sessionResp.StatusCode
Write-Host 'Session Body:' $sessionResp.Content
