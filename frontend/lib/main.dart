import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const DrukNotifierApp());
}

class DrukNotifierApp extends StatelessWidget {
  const DrukNotifierApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Druk Notifier',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.orange,
        scaffoldBackgroundColor: Colors.grey[100],
      ),
      home: const DrukNotifierHome(),
    );
  }
}

class DrukNotifierHome extends StatefulWidget {
  const DrukNotifierHome({Key? key}) : super(key: key);

  @override
  State<DrukNotifierHome> createState() => _DrukNotifierHomeState();
}

class _DrukNotifierHomeState extends State<DrukNotifierHome> {
  String selectedCategory = 'All';
  String selectedDzongkhag = 'All';
  late Future<List<dynamic>> futureFeed;

  final List<String> categories = ['All', 'News', 'Government', 'Education', 'Health', 'Finance'];
  final List<String> dzongkhags = ['All', 'Thimphu', 'Phuentsholing', 'Punakha', 'Paro'];

  @override
  void initState() {
    super.initState();
    futureFeed = fetchFeed(selectedCategory, selectedDzongkhag);
  }

  // Fetch live updates from your Render backend API
  Future<List<dynamic>> fetchFeed(String category, String dzongkhag) async {
    try {
      final uri = Uri.parse(
        'https://druk-notifier.onrender.com/api/v1/feed?category=$category&dzongkhag=$dzongkhag',
      );
      final response = await http.get(uri);
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        return jsonResponse['data'] ?? [];
      }
    } catch (e) {
      debugPrint("Error fetching live feed: $e");
    }
    return [];
  }

  void _refreshFeed() {
    setState(() {
      futureFeed = fetchFeed(selectedCategory, selectedDzongkhag);
    });
  }

  Future<void> _launchURL(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Druk Notifier',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange[800],
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshFeed,
            tooltip: 'Refresh Updates',
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category Filter Chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: categories.map((cat) {
                  final isSelected = selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      selectedColor: Colors.orange,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.w500,
                      ),
                      onSelected: (selected) {
                        setState(() {
                          selectedCategory = cat;
                          _refreshFeed();
                        });
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Dzongkhag Filter Dropdown
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Text(
                  'Dzongkhag: ',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54),
                ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: selectedDzongkhag,
                  items: dzongkhags.map((dz) {
                    return DropdownMenuItem<String>(
                      value: dz,
                      child: Text(dz),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        selectedDzongkhag = val;
                        _refreshFeed();
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Feed Items List
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: futureFeed,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Error loading updates: ${snapshot.error}'));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(
                    child: Text(
                      'No updates available from sources.',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  );
                }

                final items = snapshot.data!;
                return ListView.builder(
                  itemCount: items.length,
                  padding: const EdgeInsets.all(8),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isUrgent = item['is_urgent'] == true;

                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      child: InkWell(
                        onTap: () {
                          if (item['link'] != null && item['link'] != '#') {
                            _launchURL(item['link']);
                          }
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      item['agency'] ?? 'Official Source',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  if (isUrgent)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.red,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'Urgent',
                                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['title_en'] ?? 'Untitled Update',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                item['content_en'] ?? '',
                                style: TextStyle(fontSize: 14, color: Colors.grey[800]),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Chip(
                                    label: Text(item['dzongkhag'] ?? 'All'),
                                    backgroundColor: Colors.grey[200],
                                    labelStyle: const TextStyle(fontSize: 11),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  const Text(
                                    'Tap to read full notice →',
                                    style: TextStyle(color: Colors.blue, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
