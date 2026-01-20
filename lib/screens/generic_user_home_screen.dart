import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import 'login_screen_unified.dart';

/// Generic home screen for new user types (maid, delivery, service_worker, visitor)
class GenericUserHomeScreen extends StatefulWidget {
  final UserModel user;

  const GenericUserHomeScreen({
    Key? key,
    required this.user,
  }) : super(key: key);

  @override
  State<GenericUserHomeScreen> createState() => _GenericUserHomeScreenState();
}

class _GenericUserHomeScreenState extends State<GenericUserHomeScreen> {
  final AuthService _authService = AuthService();

  String get _userTypeTitle {
    switch (widget.user.role.toLowerCase()) {
      case 'maid':
        return 'Maid Dashboard';
      case 'delivery':
        return 'Delivery Dashboard';
      case 'service_worker':
        return 'Service Worker Dashboard';
      case 'visitor':
        return 'Visitor Dashboard';
      default:
        return 'Dashboard';
    }
  }

  IconData get _userTypeIcon {
    switch (widget.user.role.toLowerCase()) {
      case 'maid':
        return Icons.cleaning_services;
      case 'delivery':
        return Icons.delivery_dining;
      case 'service_worker':
        return Icons.engineering;
      case 'visitor':
        return Icons.people;
      default:
        return Icons.person;
    }
  }

  Color get _primaryColor {
    switch (widget.user.role.toLowerCase()) {
      case 'maid':
        return const Color(0xFF10B981);
      case 'delivery':
        return const Color(0xFFF59E0B);
      case 'service_worker':
        return const Color(0xFFEF4444);
      case 'visitor':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: _primaryColor,
        elevation: 0,
        title: Text(
          _userTypeTitle,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () => _handleLogout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Card
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: _primaryColor,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _userTypeIcon,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Welcome, ${widget.user.name}!',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.user.email,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // User Info Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(_userTypeIcon, color: _primaryColor, size: 28),
                          const SizedBox(width: 12),
                          const Text(
                            'Profile Information',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      _buildInfoRow('Name', widget.user.name),
                      const Divider(height: 24),
                      _buildInfoRow('Email', widget.user.email),
                      const Divider(height: 24),
                      _buildInfoRow('Role', _capitalize(widget.user.role)),
                      if (widget.user.phone != null && widget.user.phone!.isNotEmpty) ...[
                        const Divider(height: 24),
                        _buildInfoRow('Phone', widget.user.phone!),
                      ],
                      if (widget.user.societyId != null && widget.user.societyId!.isNotEmpty) ...[
                        const Divider(height: 24),
                        _buildInfoRow('Society ID', widget.user.societyId!),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Quick Actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Quick Actions',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildActionButton(
                        icon: Icons.qr_code_scanner,
                        label: 'Scan QR Code',
                        color: _primaryColor,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('QR Scanner coming soon')),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildActionButton(
                        icon: Icons.history,
                        label: 'View History',
                        color: Colors.grey[700]!,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('History coming soon')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
            const Spacer(),
            Icon(Icons.arrow_forward_ios, color: color, size: 16),
          ],
        ),
      ),
    );
  }

  String _capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _authService.logout();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreenUnified()),
      );
    }
  }
}
