# Central Verification Policy - Quick Reference Card

## 🚀 Quick Start

### Enable Policy (Admin)
1. Open Admin Portal
2. Societies → Click society
3. Toggle "Require Central Verification" → ON
4. Confirm → Done ✅

### Disable Policy (Admin)
1. Open Admin Portal
2. Societies → Click society
3. Toggle "Require Central Verification" → OFF
4. Done ✅

---

## 📡 API Endpoints

```bash
# Get policy for a society
GET /api/policy/central-verification/:societyId
Authorization: Bearer <token>

# Update policy (admin only)
PUT /api/policy/central-verification/:societyId
Authorization: Bearer <admin-token>
Body: { "enabled": true }

# Get all policies (admin only)
GET /api/policy/central-verification
Authorization: Bearer <admin-token>

# Check my society's policy (agent)
GET /api/policy/my-society
Authorization: Bearer <agent-token>
```

---

## 💻 Code Snippets

### Check Policy in Code
```javascript
const { getSocietyVerificationPolicy } = require('../middleware/centralVerificationEnforcement.middleware');

const policy = await getSocietyVerificationPolicy(societyId);
if (policy.requireCentralVerification) {
  // Handle enforcement
}
```

### Apply Enforcement Middleware
```javascript
const { checkCentralVerificationIfRequired } = require('../middleware/centralVerificationEnforcement.middleware');

router.post('/agent/action',
  protect,  // Existing auth
  checkCentralVerificationIfRequired,  // Optional enforcement
  controller.action
);
```

### Agent App Policy Check (Flutter/Dart)
```dart
Future<void> _checkPolicy() async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/policy/my-society'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  final data = json.decode(response.body);
  if (data['success'] && data['data']['requireCentralVerification']) {
    _showVerificationBanner();
  }
}
```

---

## 🗄️ Database

### Society Document Structure
```javascript
{
  _id: ObjectId("..."),
  societyId: "SOC-2024-0001",
  name: "Sunrise Apartments",
  requireCentralVerification: false,  // Default: false
  // ... other fields ...
}
```

### Query Examples
```javascript
// Find societies with policy enabled
db.societies.find({ requireCentralVerification: true })

// Disable policy for all societies
db.societies.updateMany(
  { requireCentralVerification: true },
  { $set: { requireCentralVerification: false } }
)
```

---

## ⚠️ Important Rules

### ✅ DO
- Keep policy OFF by default
- Show confirmation when enabling
- Provide clear user messages
- Log policy changes

### ❌ DON'T
- Auto-enable for any society
- Remove Aadhaar verification
- Apply middleware everywhere
- Block agents without notice

---

## 🧪 Testing Commands

```bash
# Test health endpoint
curl http://localhost:5001/health

# Get policy (replace tokens)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/policy/central-verification/SOC-2024-0001

# Enable policy
curl -X PUT \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' \
  http://localhost:5001/api/policy/central-verification/SOC-2024-0001

# Run test script
.\test-policy-api.ps1
```

---

## 🔄 Rollback

### Quick Disable
```bash
# Via API
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}' \
  http://localhost:5001/api/policy/central-verification/:societyId
```

### Database Update
```javascript
// Disable all policies
db.societies.updateMany(
  {},
  { $set: { requireCentralVerification: false } }
)
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid request (bad data) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (not admin OR not verified when policy ON) |
| 404 | Society not found |
| 500 | Server error |

---

## 🎯 Error Responses

### Policy Enforcement Error (403)
```json
{
  "success": false,
  "error": "CENTRAL_VERIFICATION_REQUIRED",
  "message": "Your society requires central verification. Please complete verification first.",
  "requiresAction": "CENTRAL_VERIFICATION",
  "policyEnabled": true
}
```

### Invalid Request (400)
```json
{
  "success": false,
  "message": "Invalid request: enabled must be a boolean"
}
```

---

## 📖 Documentation Files

- `POLICY_COMPLETE.md` - Complete summary
- `CENTRAL_VERIFICATION_POLICY_GUIDE.md` - Full documentation
- `POLICY_IMPLEMENTATION_SUMMARY.md` - Technical details
- `POLICY_ARCHITECTURE.md` - System architecture diagram
- `test-policy-api.ps1` - Testing script

---

## 🆘 Troubleshooting

### Policy not updating?
- Check admin token is valid
- Verify societyId exists
- Check browser console for errors

### Enforcement not working?
- Verify middleware is applied to route
- Check policy is enabled in database
- Ensure agent has societyId populated

### Server not starting?
- Check port 5001 is free: `netstat -ano | findstr :5001`
- Kill process: `taskkill /PID <pid> /F`
- Restart: `npm start`

---

## 📞 Quick Help

**Backend Running?** `curl http://localhost:5001/health`  
**Database Connected?** Check console for "✅ MongoDB connected"  
**Policy Endpoint Working?** `curl http://localhost:5001/api/policy/central-verification`  

---

**Version:** 1.0.0  
**Last Updated:** January 20, 2026  
**Status:** ✅ Production Ready
