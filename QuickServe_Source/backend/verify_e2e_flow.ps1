# E2E REST API Integration Verification Flow

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Starting E2E API Flow Verification..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

try {
    # Generate unique date to prevent schedule overlap
    $randomDays = Get-Random -Minimum 10 -Maximum 100
    $bookingDate = (Get-Date).AddDays($randomDays).ToString("yyyy-MM-dd")

    # 1. Customer Logins
    $custLoginBody = @{
        email = "customer@quickserve.com"
        password = "customer123"
    } | ConvertTo-Json
    $custLoginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $custLoginBody -ContentType "application/json"
    $custToken = $custLoginRes.token
    $custHeaders = @{ Authorization = "Bearer $custToken" }
    Write-Host "Customer Logged In successfully." -ForegroundColor Green

    # Get Customer Address & Services
    $addresses = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/addresses" -Method Get -Headers $custHeaders
    if ($addresses.Count -eq 0 -or $null -eq $addresses) {
        Write-Host "No active address found. Creating default customer address..." -ForegroundColor Yellow
        $newAddrBody = @{
            streetAddress = "123 Broadway St"
            city = "New York"
            state = "NY"
            zipCode = "10001"
            landmark = "Near Times Square"
            isDefault = $true
        } | ConvertTo-Json
        $newAddr = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/addresses" -Method Post -Headers $custHeaders -Body $newAddrBody -ContentType "application/json"
        $addrId = $newAddr.id
    } else {
        if ($addresses -is [System.Array]) {
            $addrId = $addresses[0].id
        } else {
            $addrId = $addresses.id
        }
    }

    # Test Address Deletion soft-delete flow
    Write-Host "Testing saved address creation & soft-deletion flow..." -ForegroundColor Yellow
    $tempAddrBody = @{
        streetAddress = "Temporary Delete Ave"
        city = "New York"
        state = "NY"
        zipCode = "10002"
        landmark = "Trash Bin"
        isDefault = $false
    } | ConvertTo-Json
    $tempAddr = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/addresses" -Method Post -Headers $custHeaders -Body $tempAddrBody -ContentType "application/json"
    $tempId = $tempAddr.id
    Write-Host "Temp Address created with ID: $tempId"

    # Now delete the address
    Invoke-RestMethod -Uri "http://localhost:8080/api/customer/addresses/$tempId" -Method Delete -Headers $custHeaders
    Write-Host "Temp Address delete request sent."

    # Verify it is no longer listed
    $postDeleteAddresses = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/addresses" -Method Get -Headers $custHeaders
    $found = $false
    if ($postDeleteAddresses -is [System.Array]) {
        foreach ($a in $postDeleteAddresses) {
            if ($a.id -eq $tempId) { $found = $true }
        }
    } else {
        if ($postDeleteAddresses.id -eq $tempId) { $found = $true }
    }

    if ($found) {
        throw "Soft deletion failed: address still returned in active list!"
    } else {
        Write-Host "Address soft-deletion verification successful (removed from list)." -ForegroundColor Green
    }

    $services = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/services" -Method Get -Headers $custHeaders
    $serviceId = $services[0].id
    $slots = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/time-slots" -Method Get -Headers $custHeaders
    $slotId = $slots[0].id

    Write-Host "Using Address ID: $addrId, Service ID: $serviceId, TimeSlot ID: $slotId, Date: $bookingDate"

    # Create Booking Request
    $bookingBody = @{
        serviceId = $serviceId
        addressId = $addrId
        bookingDate = $bookingDate
        timeSlotId = $slotId
        notes = "Check pipe leakage in bathroom"
    } | ConvertTo-Json

    $booking = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/bookings" -Method Post -Headers $custHeaders -Body $bookingBody -ContentType "application/json"
    $bookingId = $booking.id
    Write-Host "Booking created successfully. ID: $bookingId. Status: $($booking.status)" -ForegroundColor Green

    # 2. Admin Logins
    $adminLoginBody = @{
        email = "admin@quickserve.com"
        password = "admin123"
    } | ConvertTo-Json
    $adminLoginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $adminLoginRes.token
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }
    Write-Host "Admin Logged In successfully." -ForegroundColor Green

    # Verify Admin Notification is created
    Write-Host "Verifying Admin notification for booking #$bookingId..." -ForegroundColor Yellow
    $adminNotifications = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/notifications" -Method Get -Headers $adminHeaders
    $foundNotif = $false
    foreach ($n in $adminNotifications) {
        if ($n.message -like "*Booking #$bookingId*") {
            $foundNotif = $true
            Write-Host "Found Admin notification: '$($n.title)' -> '$($n.message)'" -ForegroundColor Green
        }
    }
    if (-not $foundNotif) {
        throw "Admin notification not found for booking ID $bookingId!"
    }

    # Self-healing: verify Bob Professional
    Write-Host "Ensuring Bob Professional (Profile ID 1) is verified..."
    $verifyRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/professionals/1/verify?status=VERIFIED" -Method Post -Headers $adminHeaders
    Write-Host "Bob Professional verification status: $($verifyRes.verificationStatus)" -ForegroundColor Green

    # Get Bob Professional
    $professionals = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/professionals" -Method Get -Headers $adminHeaders
    $verifiedProfs = $professionals | Where-Object { $_.user.email -eq "professional@quickserve.com" }
    $profId = $verifiedProfs[0].user.id
    Write-Host "Admin manually assigning Bob Professional (ID $profId) to Booking ID $bookingId..."

    $assignedBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/bookings/$bookingId/assign/$profId" -Method Post -Headers $adminHeaders
    Write-Host "Assigned successfully. Status: $($assignedBooking.status)" -ForegroundColor Green

    # 3. Professional Logins
    $profEmail = "professional@quickserve.com"
    Write-Host "Logging in as professional: $profEmail" -ForegroundColor Yellow
    $profLoginBody = @{
        email = $profEmail
        password = "professional123"
    } | ConvertTo-Json
    $profLoginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $profLoginBody -ContentType "application/json"
    $profToken = $profLoginRes.token
    $profHeaders = @{ Authorization = "Bearer $profToken" }
    Write-Host "Professional Logged In successfully." -ForegroundColor Green

    # Accept booking
    $acceptedBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/professional/bookings/$bookingId/accept" -Method Post -Headers $profHeaders
    Write-Host "Professional accepted booking. Status: $($acceptedBooking.status)" -ForegroundColor Green

    # Transition to On The Way
    $otwBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/professional/bookings/$bookingId/on-the-way" -Method Post -Headers $profHeaders
    Write-Host "Professional status: $($otwBooking.status)" -ForegroundColor Green

    # Transition to Arrived
    $arrivedBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/professional/bookings/$bookingId/arrive" -Method Post -Headers $profHeaders
    Write-Host "Professional status: $($arrivedBooking.status)" -ForegroundColor Green

    # Transition to In Progress
    $ipBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/professional/bookings/$bookingId/start" -Method Post -Headers $profHeaders
    Write-Host "Professional status: $($ipBooking.status)" -ForegroundColor Green

    # Transition to Completed with 150 material charges and details
    $completeBooking = Invoke-RestMethod -Uri "http://localhost:8080/api/professional/bookings/$bookingId/complete?materialCharges=150&workDetails=Repaired pipeline connection" -Method Post -Headers $profHeaders
    Write-Host "Professional completed booking. Status: $($completeBooking.status)" -ForegroundColor Green
    Write-Host "Pricing splits: Base=$($completeBooking.basePrice), Visit=$($completeBooking.visitCharge), Materials=$($completeBooking.materialCharges), Tax=$($completeBooking.tax), Final=$($completeBooking.finalAmount)" -ForegroundColor Cyan

    # 4. Customer files a support complaint ticket
    Write-Host "Customer filing complaint ticket..."
    $complaint = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/bookings/$bookingId/complaint?title=Minor leak remaining&description=Water still dripping slightly" -Method Post -Headers $custHeaders
    $complaintId = $complaint.id
    Write-Host "Complaint ticket #$complaintId created. Status: $($complaint.status)" -ForegroundColor Green

    # 5. Admin resolves complaint ticket
    Write-Host "Admin resolving complaint ticket #$complaintId..."
    $resolvedComplaint = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/complaints/$complaintId/resolve?resolutionNotes=Sent follow up technician" -Method Post -Headers $adminHeaders
    Write-Host "Resolved successfully. Status: $($resolvedComplaint.status)" -ForegroundColor Green

    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host "E2E API FLOW VERIFICATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
} catch {
    Write-Host "E2E API Verification failed with error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Error Response Body: $body" -ForegroundColor Red
    }
}
