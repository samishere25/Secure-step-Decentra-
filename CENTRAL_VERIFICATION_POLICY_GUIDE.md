# Central Verification Policy - Configuration Guide

## Overview
The Central Verification Policy is an **optional, admin-configurable toggle** that allows societies to enforce central verification as an additional security layer. This feature is **disabled by default** and does not replace existing Aadhaar verification.

---

## Key Features

### ✅ Safe Defaults
- **OFF by default** for all societies
- No automatic enablement
- Backward compatible with existing data
- Does NOT break current workflows

### 🛡️ Non-Destructive
- Does NOT replace Aadhaar verification
- Does NOT weaken existing security
- Acts as an **additional** layer only
- Existing agents remain functional

### 🎛️ Admin Controlled
- Only admins can enable/disable
- Per-society configuration
- Clear confirmation dialogs
- Reversible at any time

---

## Database Schema

### Society Model Update
**File:** `backend/src/models/Society.js`

```javascript
requireCentralVerification: {
  type: Boolean,
  default: false,
  description: 'Optional policy - when enabled, agents must complete central verification'
}
```

**Migration:** Not required - field defaults to `false` for all existing societies.

---

## API Endpoints

### 1. Get Policy for Specific Society
```http
GET /api/policy/central-verification/:societyId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "societyId": "SOC-2024-0001",
    "societyName": "Sunrise Apartments",
    "requireCentralVerification": false,
    "description": "When enabled, agents must complete central verification (does not replace Aadhaar verification)"
  }
}
```

### 2. Update Policy (Admin Only)
```http
PUT /api/policy/central-verification/:societyId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Central verification policy enabled",
  "data": {
    "societyId": "SOC-2024-0001",
    "societyName": "Sunrise Apartments",
    "requireCentralVerification": true,
    "updatedAt": "2026-01-20T10:30:00Z"
  }
}
```

### 3. Get All Policies (Admin Only)
```http
GET /api/policy/central-verification
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "societyId": "SOC-2024-0001",
      "name": "Sunrise Apartments",
      "requireCentralVerification": false,
      "isActive": true
    },
    {
      "societyId": "SOC-2024-0002",
      "name": "Green Valley Society",
      "requireCentralVerification": true,
      "isActive": true
    }
  ]
}
```

### 4. Check My Society Policy (Agent Use)
```http
GET /api/policy/my-society
Authorization: Bearer <agent-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "societyId": "SOC-2024-0001",
    "societyName": "Sunrise Apartments",
    "requireCentralVerification": false,
    "hasCentralVerification": false,
    "message": "Central verification is optional for your society"
  }
}
```

---

## Admin Portal UI

### Location
Society Detail View → Policy Settings Card

### UI Elements

#### Toggle Switch
```
🛡️ Require Central Verification                    [  OFF  ]
Optional policy – when enabled, agents must 
complete central verification (does not replace 
Aadhaar verification). OFF by default. For 
future enforcement only.
```

#### Confirmation Dialog (When Enabling)
```
⚠️ Enable Central Verification Policy?

When enabled, this policy will require agents 
to complete central verification.

This does NOT replace existing Aadhaar verification.

Continue?
[Cancel] [OK]
```

#### Success Messages
```
✅ Central Verification Policy ENABLED
Agents will now be required to complete 
central verification.

✅ Central Verification Policy DISABLED
Requirement removed - existing behavior restored.
```

---

## Enforcement Logic

### Middleware: checkCentralVerificationIfRequired
**File:** `backend/middleware/centralVerificationEnforcement.middleware.js`

**Behavior:**
1. **Policy OFF:** Skip all checks, proceed normally ✅
2. **Policy ON:**
   - Check if agent has `centralVerificationId`
   - Verify central identity exists and is verified
   - Block access if not verified (403 error)

**Error Responses:**
```json
{
  "success": false,
  "error": "CENTRAL_VERIFICATION_REQUIRED",
  "message": "Your society requires central verification. Please complete verification first.",
  "requiresAction": "CENTRAL_VERIFICATION",
  "policyEnabled": true
}
```

```json
{
  "success": false,
  "error": "CENTRAL_VERIFICATION_PENDING",
  "message": "Central verification status: pending. Access restricted until verified.",
  "requiresAction": "WAIT_FOR_VERIFICATION",
  "policyEnabled": true,
  "currentStatus": "pending"
}
```

### How to Apply Middleware

**Example:** Protect a route with optional enforcement
```javascript
const { checkCentralVerificationIfRequired } = require('../middleware/centralVerificationEnforcement.middleware');

// Apply to agent routes
router.post('/agent/action', 
  authenticateToken,           // Existing auth
  checkCentralVerificationIfRequired,  // Optional enforcement
  agentController.action
);
```

**Important:** Only apply this middleware to routes where you want optional enforcement. Most routes should NOT use it to maintain backward compatibility.

---

## Mobile App Integration

### Agent App - Policy Check

**On Profile Load:**
```dart
Future<void> _checkSocietyPolicy() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/policy/my-society'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    final data = json.decode(response.body);
    
    if (data['success'] && data['data']['requireCentralVerification']) {
      // Show prominent banner
      _showVerificationRequiredBanner();
    }
  } catch (e) {
    // Silently fail - policy check is informational
  }
}
```

**Banner UI:**
```dart
Container(
  color: Colors.orange.shade100,
  padding: EdgeInsets.all(12),
  child: Row(
    children: [
      Icon(Icons.shield_outlined, color: Colors.orange.shade900),
      SizedBox(width: 12),
      Expanded(
        child: Text(
          'Your society requires central verification. Please verify yourself.',
          style: TextStyle(color: Colors.orange.shade900),
        ),
      ),
      TextButton(
        onPressed: _startCentralVerification,
        child: Text('Verify Now'),
      ),
    ],
  ),
)
```

---

## Testing Guide

### 1. Verify Default State
```bash
# All societies should have requireCentralVerification: false
GET /api/societies
```

Expected: All societies show `requireCentralVerification: false` (or field absent)

### 2. Enable Policy (Admin)
```bash
# Enable for test society
PUT /api/policy/central-verification/SOC-2024-0001
{
  "enabled": true
}
```

Expected: Success response, policy set to `true`

### 3. Verify Enforcement
```bash
# Try agent action without central verification
# Should get 403 if policy is ON and agent not verified
POST /api/agent/protected-action
Authorization: Bearer <agent-token>
```

Expected: 
- Policy OFF → Success (normal behavior)
- Policy ON + Not Verified → 403 error
- Policy ON + Verified → Success

### 4. Disable Policy
```bash
# Disable policy
PUT /api/policy/central-verification/SOC-2024-0001
{
  "enabled": false
}
```

Expected: Agent can now access protected route again

---

## Rollback Instructions

If issues occur, disable the policy system without code changes:

### Option 1: Via API (Recommended)
```bash
# Disable policy for all societies
GET /api/policy/central-verification  # Get all societyIds
PUT /api/policy/central-verification/:societyId -d '{"enabled": false}'  # For each
```

### Option 2: Direct MongoDB
```javascript
db.societies.updateMany(
  {},
  { $set: { requireCentralVerification: false } }
);
```

### Option 3: Remove Middleware
Comment out middleware application in routes:
```javascript
// router.use(checkCentralVerificationIfRequired);  // Disabled
```

---

## Important Constraints

### ✅ DO
- Keep policy OFF by default
- Show clear warnings when enabling
- Allow admin to toggle freely
- Provide informational messages to agents
- Log policy enforcement actions

### ❌ DO NOT
- Auto-enable for any society
- Remove Aadhaar verification
- Apply middleware to all routes
- Block existing agents immediately
- Hide policy status from users

---

## Future Enhancements

1. **Grace Period:** Allow 30-day grace period after policy enablement
2. **Bulk Operations:** Enable/disable for multiple societies at once
3. **Policy History:** Track who enabled/disabled and when
4. **Notification System:** Email agents when policy is enabled
5. **Risk-Based Enforcement:** Only enforce for high-risk actions

---

## Support & Troubleshooting

### Issue: Policy not working
**Check:**
1. Middleware applied to route?
2. Society has correct societyId?
3. Agent's societyId populated correctly?
4. Database field exists (run migration)?

### Issue: Agents blocked unexpectedly
**Solution:**
1. Check policy status: `GET /api/policy/central-verification/:societyId`
2. If ON, disable: `PUT /api/policy/central-verification/:societyId -d '{"enabled": false}'`
3. Inform agents to complete verification

### Issue: Toggle not appearing in admin UI
**Check:**
1. Admin portal loaded latest JS?
2. Clear browser cache
3. Verify API endpoint responding
4. Check browser console for errors

---

## Summary

This policy system provides **future-proof, opt-in enforcement** of central verification without disrupting existing workflows. It's:

- ✅ Disabled by default
- ✅ Admin controlled
- ✅ Non-destructive
- ✅ Backward compatible
- ✅ Reversible
- ✅ Clearly documented

**Result:** System is ready for optional central verification enforcement when societies choose to enable it.
