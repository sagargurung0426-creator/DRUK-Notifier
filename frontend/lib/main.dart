import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const DrukNotifierApp());
}

class DrukNotifierApp extends StatefulWidget {
  const DrukNotifierApp({Key? key}) : super(key: key);

  @override
  State<DrukNotifierApp> createState() => _DrukNotifierAppState();
}

class _DrukNotifierAppState extends State<DrukNotifierApp> {
  bool _isDzongkha = false;

  void _toggleLanguage() {
    setState(() {
      _isDzongkha = !_isDzongkha;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Druk Notifier',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.amber,
        scaffoldBackgroundColor: const Color(0xFFF5F6F8),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFF9900),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: HomeScreen(
        isDzongkha: _isDzongkha,
        onLanguageToggle: _toggleLanguage,
      ),
    );
  }
}

class Announcement {
  final String id;
  final String agency;
  final String category;
  final String dzongkhag;
  final String titleEn;
  final String titleDz;
  final String contentEn;
  final String contentDz;
  final bool isUrgent;
  final String publishedAt;

  Announcement({
    required this.id,
    required this.agency,
    required this.category,
    required this.dzongkhag,
    required this.titleEn,
    required this.titleDz,
    required this.contentEn,
    required this.contentDz,
    required this.isUrgent,
    required this.publishedAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] ?? '',
      agency: json['agency'] ?? 'Royal Government of Bhutan',
      category: json['category'] ?? 'General',
      dzongkhag: json['dzongkhag'] ?? 'National',
      titleEn: json['title_en'] ?? '',
      titleDz: json['title_dz'] ?? '',
      contentEn: json['content_en'] ?? '',
      contentDz: json['content_dz'] ?? '',
      isUrgent: json['is_urgent'] ?? false,
      publishedAt: json['published_at'] ?? DateTime.now().toIso8601String(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  final bool isDzongkha;
  final VoidCallback onLanguageToggle;

  const HomeScreen({
    Key? key,
    required this.isDzongkha,
    required this.onLanguageToggle,
  }) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedCategory = 'All';
  String _selectedDzongkhag = 'All';
  bool _isLoading = true;
  String? _errorMessage;
  List<Announcement> _announcements = [];

  final List<String> _categories = ['All', 'Travel', 'Education', 'Finance', 'Health'];
  final List<String> _dzongkhags = ['All', 'Thimphu', 'Punakha', 'Paro', 'Chhukha'];

  final String _baseUrl = 'https://druk-notifier.onrender.com/api/v1/feed';

  @override
  void initState() {
    super.initState();
    _fetchLiveAnnouncements();
  }

  Future<void> _fetchLiveAnnouncements() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final uri = Uri.parse(_baseUrl).replace(queryParameters: {
        'category': _selectedCategory,
        'dzongkhag': _selectedDzongkhag,
      });

      final response = await http.get(uri).timeout(const Duration(seconds: 7));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        final List rawData = decoded['data'] ?? [];
        setState(() {
          _announcements = rawData.map((e) => Announcement.fromJson(e)).toList();
          _isLoading = false;
        });
      } else {
        throw Exception('Server error');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = widget.isDzongkha
            ? 'རྒྱུད་འབྲེལ་མ་ཐོབ། ཡང་བསྐྱར་རྩོལ་སྒྲུབ་འབད།'
            : 'Unable to fetch updates. Please check connection.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isDzongkha ? 'འབྲུག་བརྡ་སྤྲོད།' : 'Druk Notifier'),
        actions: [
          TextButton(
            onPressed: widget.onLanguageToggle,
            child: Text(
              widget.isDzongkha ? 'English' : 'རྫོང་ཁ།',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          )
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: Column(
              children: [
                SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = cat == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(cat),
                          selected: isSelected,
                          selectedColor: const Color(0xFFFF9900),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : Colors.black87,
                          ),
                          onSelected: (selected) {
                            setState(() {
                              _selectedCategory = cat;
                            });
                            _fetchLiveAnnouncements();
                          },
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      widget.isDzongkha ? 'རྫོང་ཁག:' : 'Dzongkhag:',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 12),
                    DropdownButton<String>(
                      value: _selectedDzongkhag,
                      items: _dzongkhags.map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (newValue) {
                        if (newValue != null) {
                          setState(() {
                            _selectedDzongkhag = newValue;
                          });
                          _fetchLiveAnnouncements();
                        }
                      },
                    ),
                  ],
                )
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchLiveAnnouncements,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return ListView.builder(
        itemCount: 4,
        padding: const EdgeInsets.all(12),
        itemBuilder: (context, index) => const SkeletonCard(),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: Main.center,
            children: [
              const Icon(Icons.wifi_off, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text(_errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _fetchLiveAnnouncements,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF9900),
                ),
                child: Text(widget.isDzongkha ? 'ལོག་སྟེ་རྩོལ་བསྐྱེད།' : 'Retry'),
              )
            ],
          ),
        ),
      );
    }

    if (_announcements.isEmpty) {
      return Center(
        child: Text(
          widget.isDzongkha
              ? 'གནས་ཚུལ་གསར་པ་མིན་འདུག།'
              : 'No announcements found.',
        ),
      );
    }

    return ListView.builder(
      itemCount: _announcements.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (context, index) {
        final item = _announcements[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: Cross.start,
              children: [
                Row(
                  mainAxisAlignment: Main.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.agency,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (item.isUrgent)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          widget.isDzongkha ? 'འཕྲལ་ལུས།' : 'URGENT',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 10),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  widget.isDzongkha ? item.titleDz : item.titleEn,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.isDzongkha ? item.contentDz : item.contentEn,
                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: Main.spaceBetween,
                  children: [
                    Chip(
                      label: Text(
                        item.dzongkhag,
                        style: const TextStyle(fontSize: 10),
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    Text(
                      item.publishedAt.length >= 10
                          ? item.publishedAt.substring(0, 10)
                          : item.publishedAt,
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                )
              ],
            ),
          ),
        );
      },
    );
  }
}

class SkeletonCard extends StatelessWidget {
  const SkeletonCard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: Cross.start,
          children: [
            Container(width: 120, height: 12, color: Colors.black12),
            const SizedBox(height: 12),
            Container(width: double.infinity, height: 16, color: Colors.black12),
            const SizedBox(height: 8),
            Container(width: 200, height: 14, color: Colors.black12),
          ],
        ),
      ),
    );
  }
}
