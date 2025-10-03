# Auth smoke test script
# Creates a signup user then calls /api/auth/session using same cookie session.

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$signupBody = @{ 
  email = 'testuser@example.com'
  password = 'secret123'
  role = 'farmer'
  firstName = 'Test'
  lastName = 'User'
} | ConvertTo-Json

Write-Host 'Signing up user...'
$signupResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' -Method Post -Body $signupBody -ContentType 'application/json' -WebSession $session -Headers @{ 'Accept'='application/json' }
Write-Host 'Signup status code:' $signupResponse.StatusCode
Write-Host 'Signup raw body:' $signupResponse.Content
Write-Host 'Cookies after signup:' ($session.Cookies | ForEach-Object { $_.Name + '=' + $_.Value }) -Separator '; '

Write-Host 'Querying /api/auth/session with retained cookie...'
$sessionResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/session' -Method Get -WebSession $session -Headers @{ 'Accept'='application/json' }
Write-Host 'Session status code:' $sessionResponse.StatusCode
Write-Host 'Session raw body:' $sessionResponse.Content
