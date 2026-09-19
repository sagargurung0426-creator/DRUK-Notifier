import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  String searchQuery = '';
  bool urgentOnly = false;
  bool showBookmarksOnly = false;

  List<dynamic> allFeedItems = [];
  List<String> bookmarkedIds = [];
  bool isLoading = true;

  final TextEditingController searchController = TextEditingController();

  final List<String> categories = ['All', 'News', 'Government', 'Education', 'Health', 'Finance', 'Travel'];
  final List<String> dzongkhags = [
    'All', 'Thimphu', 'Phuentsholing', 'Punakha', 'Paro', 'Wangdue Phodrang', 
    'Bumthang', 'Trashigang', 'Gelephu', 'Samtse', 'Mongar', 'Chukha'
  ];

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
    _fetchFeed();
  }

  // Load saved bookmarks from local storage
  Future<void> _loadBookmarks() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      bookmarkedIds = prefs.getStringList('bookmarked_ids') ?? [];
    });
  }

  // Toggle bookmark for an item ID
  Future<void> _toggleBookmark(String id) async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      if (bookmarkedIds.contains(id)) {
        bookmarkedIds.remove(id);
      } else {
        bookmarkedIds.add(id);
      }
    });
    await prefs.setStringList('bookmarked_ids', bookmarkedIds);
  }

  // Fetch live updates with offline fallback caching
  Future<void> _fetchFeed() async {
    setState(() {
      isLoading = true;
    });

    final prefs = await SharedPreferences.getInstance();
    const cacheKey = 'cached_feed_json';

    try {
      final uri = Uri.parse(
        'https://druk-notifier.onrender.com/api/v1/feed?category=$selectedCategory&dzongkhag=$selectedDzongkhag',
      );
      final response = await http.get(uri);
      
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];
        
        // Save to offline cache
        await prefs.setString(cacheKey, json.encode(data));

        setState(() {
          allFeedItems = data;
          isLoading = false;
        });
        return;
      }
    } catch (e) {
      debugPrint("Network error, loading offline cache: $e");
    }

    // Fallback to offline cache if network fails
    final cachedString = prefs.getString(cacheKey);
    if (cachedString != null) {
      setState(() {
        allFeedItems = json.decode(cachedString);
        isLoading = false;
      });
    } else {
      setState(() {
        allFeedItems = [];
        isLoading = false;
      });
    }
  }

  Future<void> _launchURL(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _shareNotice(String title, String link) {
    Share.share("Check out this notice from Druk Notifier:\n\n$title\n\nRead more: $link");
  }

  @override
  Widget build(BuildContext context) {
    // Filter items locally based on Search, Urgent toggle, and Bookmarks
    final filteredItems = allFeedItems.where((item) {
      final title = (item['title_en'] ?? '').toLowerCase();
      final content = (item['content_en'] ?? '').toLowerCase();
      final agency = (item['agency'] ?? '').toLowerCase();
      
      final matchesSearch = title.contains(searchQuery) || 
                            content.contains(searchQuery) || 
                            agency.contains(searchQuery);

      final matchesUrgent = !urgentOnly || item['is_urgent'] == true;
      final matchesBookmarks = !showBookmarksOnly || bookmarkedIds.contains(item['id']);

      return matchesSearch && matchesUrgent && matchesBookmarks;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Druk Notifier',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange[800],
        actions: [
          IconButton(
            icon: Icon(
              showBookmarksOnly ? Icons.bookmark : Icons.bookmark_border,
              color: Colors.white,
            ),
            onPressed: () {
              setState(() {
                showBookmarksOnly = !showBookmarksOnly;
              });
            },
            tooltip: showBookmarksOnly ? 'Show All Notices' : 'Show Saved Bookmarks',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _fetchFeed,
            tooltip: 'Refresh Updates',
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: searchController,
              decoration: InputDecoration(
                hintText: 'Search roadblocks, traffic, exams...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          setState(() {
                            searchController.clear();
                            searchQuery = '';
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (value) {
                setState(() {
                  searchQuery = value.toLowerCase();
                });
              },
            ),
          ),

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
                          _fetchFeed();
                        });
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Dzongkhag Filter Dropdown & Urgent Filter Toggle
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('District: ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: selectedDzongkhag,
                      items: dzongkhags.map((dz) {
                        return DropdownMenuItem<String>(value: dz, child: Text(dz));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            selectedDzongkhag = val;
                            _fetchFeed();
                          });
                        }
                      },
                    ),
                  ],
                ),
                FilterChip(
                  label: const Text('⚠️ Urgent Only'),
                  selected: urgentOnly,
                  onSelected: (val) {
                    setState(() {
                      urgentOnly = val;
                    });
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Feed List
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredItems.isEmpty
                    ? Center(
                        child: Text(
                          showBookmarksOnly ? 'No saved bookmarks found.' : 'No updates available.',
                          style: const TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        itemCount: filteredItems.length,
                        padding: const EdgeInsets.all(8),
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          final isUrgent = item['is_urgent'] == true;
                          final isBookmarked = bookmarkedIds.contains(item['id']);

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
                                        Row(
                                          children: [
                                            IconButton(
                                              icon: Icon(
                                                isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                                                color: isBookmarked ? Colors.orange : Colors.grey,
                                                size: 20,
                                              ),
                                              onPressed: () => _toggleBookmark(item['id']),
                                              tooltip: 'Bookmark',
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.share, color: Colors.grey, size: 20),
                                              onPressed: () => _shareNotice(item['title_en'], item['link']),
                                              tooltip: 'Share',
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
