import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../utils/constants.dart';

class AgentProfileScreen extends StatefulWidget {
  final String agentEmail;
  
  const AgentProfileScreen({super.key, required this.agentEmail});

  @override
  State<AgentProfileScreen> createState() => _AgentProfileScreenState();
}

class _AgentProfileScreenState extends State<AgentProfileScreen> {
  Map<String, dynamic>? _agentData;
  bool _isLoading = true;
  bool _isVerifying = false;
  Map<String, dynamic>? _centralVerification;

  @override
  void initState() {
    super.initState();
    _loadAgentProfile();
    _loadCentralStatus();
  }

  Future<void> _loadAgentProfile() async {
    setState(() => _isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/agent/${widget.agentEmail}'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() => _agentData = data['agent']);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _agentData = null);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadCentralStatus() async {
    if (_agentData == null || _agentData!['_id'] == null) return;

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/central-status/${_agentData!['_id']}'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted && data['centralVerified'] == true) {
          setState(() => _centralVerification = data['data']);
        }
      }
    } catch (e) {
      // Silently fail - this is optional
    }
  }

  Future<void> _startCentralVerification() async {
    if (_agentData == null) return;

    setState(() => _isVerifying = true);

    try {
      // Generate document hash from agent data
      final agentDataStr = '${_agentData!['email']}_${_agentData!['name']}';
      final documentHash = agentDataStr.hashCode.toString();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/preverify/start'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'documentHash': documentHash,
          'faceEmbeddingId': _agentData!['faceEmbeddingId'],
          'deviceFingerprint': 'agent_app_${_agentData!['_id']}',
          'agentId': _agentData!['_id'],
          'performedBy': _agentData!['_id'],
          'performedByModel': 'Agent',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() => _centralVerification = data['data']);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ Central verification initiated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Failed to verify');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start verification: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Profile')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_agentData == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.upload_file, size: 80, color: Colors.grey.shade400),
                const SizedBox(height: 20),
                const Text('Documents Not Uploaded', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                const Text('Please upload your documents to complete registration.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 30),
                ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final verified = _agentData!['verified'] == true;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: RefreshIndicator(
        onRefresh: _loadAgentProfile,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              CircleAvatar(
                radius: 60,
                backgroundColor: verified ? Colors.green.shade100 : Colors.orange.shade100,
                child: Icon(verified ? Icons.verified_user : Icons.pending, size: 60, color: verified ? Colors.green : Colors.orange),
              ),
              const SizedBox(height: 20),
              Text(_agentData!['name'], style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: verified ? Colors.green : Colors.orange, borderRadius: BorderRadius.circular(20)),
                child: Text(verified ? 'VERIFIED' : 'PENDING', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 30),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Profile Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const Divider(),
                      _buildInfoTile(Icons.person, 'Name', _agentData!['name']),
                      _buildInfoTile(Icons.email, 'Email', _agentData!['email']),
                      _buildInfoTile(Icons.business, 'Company', _agentData!['company'] ?? 'Not Specified'),
                      _buildInfoTile(Icons.badge, 'Agent ID', _agentData!['id']),
                      _buildInfoTile(Icons.verified, 'Status', verified ? 'Verified' : 'Pending', color: verified ? Colors.green : Colors.orange),
                      _buildInfoTile(Icons.star, 'Score', '${_agentData!['score'] ?? 0}/5.0', color: Colors.amber),
                    ],
                  ),
                ),
              ),
              if (!verified) const SizedBox(height: 20),
              if (!verified)
                Card(
                  color: Colors.orange.shade50,
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.orange),
                        SizedBox(width: 12),
                        Expanded(child: Text('Documents under review. QR code will be available after verification.', style: TextStyle(color: Colors.orange))),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              // Central Verification Section (Optional)
              Card(
                elevation: 1,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.verified_outlined, size: 20, color: Colors.blue.shade700),
                          const SizedBox(width: 8),
                          const Text('Central Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const Spacer(),
                          if (_centralVerification != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _centralVerification!['verificationStatus'] == 'verified' 
                                    ? Colors.green.shade50 
                                    : Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _centralVerification!['verificationStatus'].toString().toUpperCase(),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _centralVerification!['verificationStatus'] == 'verified' 
                                      ? Colors.green.shade700 
                                      : Colors.orange.shade700,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Optional central verification for faster trust',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                      if (_centralVerification != null) ...[
                        const SizedBox(height: 12),
                        const Divider(),
                        const SizedBox(height: 8),
                        _buildInfoRow('MAID', _centralVerification!['maid']),
                        _buildInfoRow('Risk Score', '${_centralVerification!['riskScore']}/100'),
                        _buildInfoRow('Trust Level', _centralVerification!['trustLevel'].toString().toUpperCase()),
                      ],
                      const SizedBox(height: 12),
                      if (_centralVerification == null)
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: _isVerifying ? null : _startCentralVerification,
                            icon: _isVerifying 
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.shield_outlined, size: 18),
                            label: Text(_isVerifying ? 'Verifying...' : 'Verify Yourself (Recommended)'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.blue.shade700,
                              side: BorderSide(color: Colors.blue.shade300),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        )
                      else
                        Row(
                          children: [
                            Icon(
                              _centralVerification!['verificationStatus'] == 'verified' 
                                  ? Icons.check_circle 
                                  : Icons.pending,
                              size: 16,
                              color: _centralVerification!['verificationStatus'] == 'verified' 
                                  ? Colors.green 
                                  : Colors.orange,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _centralVerification!['verificationStatus'] == 'verified'
                                  ? 'You are centrally verified'
                                  : 'Verification in progress',
                              style: TextStyle(
                                fontSize: 13,
                                color: _centralVerification!['verificationStatus'] == 'verified' 
                                    ? Colors.green.shade700 
                                    : Colors.orange.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: color ?? Colors.grey),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: color)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
