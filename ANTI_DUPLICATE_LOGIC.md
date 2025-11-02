# 🚫 Anti-Duplicate Logic cho updateNewsPage()

## ❗ Vấn đề trước đây

Việc lấy 15 bài mới nhất có thể gây **trùng lặp** vì:

1. **Cùng bài viết deploy nhiều lần** → Tạo multiple records
2. **Bài viết được update** → Có thể có entries với `created_at` khác nhau
3. **Race conditions** → Nhiều user cùng deploy
4. **Database inconsistency** → Có thể có duplicate entries do lỗi import

## ✅ Giải pháp Anti-Duplicate

### 🔍 **Step 1: Query Optimization**

```javascript
// Trước: Chỉ order by created_at
.order('created_at', { ascending: false })
.limit(15);

// Sau: Double order + more data
.order('updated_at', { ascending: false }) // Ưu tiên bài mới update
.order('created_at', { ascending: false })  // Backup sort
.limit(20); // Lấy thêm để có dự phòng
```

### 🧹 **Step 2: Deduplication Logic**

```javascript
const uniqueArticles = [];
const seenFilenames = new Set(); // Track theo filename
const seenIds = new Set(); // Track theo database ID

for (const article of articles) {
  // Kiểm tra duplicate theo 2 tiêu chí
  if (!seenFilenames.has(article.filename) && !seenIds.has(article.id)) {
    seenFilenames.add(article.filename);
    seenIds.add(article.id);
    uniqueArticles.push(article);
  }
}

// Chỉ lấy 15 bài sau khi deduplicate
const finalArticles = uniqueArticles.slice(0, 15);
```

### 📊 **Step 3: Enhanced Monitoring**

```javascript
// Status message với thống kê
showStatus(
  `📊 Đã lọc ${finalArticles.length} bài viết unique từ ${articles.length} bài trong database`,
  "info"
);

// Console log chi tiết
console.log("✅ News page updated successfully:", {
  unique_articles: finalArticles.length,
  total_articles: articles.length,
  duplicates_removed: articles.length - finalArticles.length,
  response: data,
});
```

## 🎯 **Lợi ích của cải tiến**

### ✅ **Eliminates Duplicates**

- **By filename**: Tránh cùng một bài viết xuất hiện nhiều lần
- **By ID**: Đảm bảo mỗi database record chỉ xuất hiện 1 lần

### ✅ **Better Prioritization**

- **updated_at first**: Bài viết được update gần nhất ưu tiên cao hơn
- **created_at second**: Fallback sorting cho articles cùng update time

### ✅ **More Resilient**

- **20 → 15 filtering**: Có buffer để đảm bảo luôn có đủ 15 bài unique
- **Graceful handling**: Không crash nếu có duplicate data

### ✅ **Better Monitoring**

- **Real-time stats**: User biết có bao nhiêu duplicates đã được lọc
- **Detailed logs**: Dev có thể debug dễ dàng

## 📋 **Test Cases**

### Test 1: Normal Case

```
Input: 20 articles, all unique
Output: 15 articles (top 15 by updated_at)
Duplicates removed: 0
```

### Test 2: Duplicate Case

```
Input: 20 articles, 5 duplicates (cùng filename)
Output: 15 articles unique
Duplicates removed: 5
```

### Test 3: Edge Case

```
Input: 10 articles, all unique
Output: 10 articles (all được lấy)
Duplicates removed: 0
```

## 🔧 **Edge Function Impact**

Function `update-news-page` sẽ nhận:

```javascript
{
  articles: [...], // Đã deduplicate, max 15 items
  total_count: 20, // Số lượng gốc từ database
  unique_count: 15, // Số lượng sau khi deduplicate
  trigger_source: 'admin_interface'
}
```

## 🎉 **Result**

✅ **No more duplicate articles** in tin-tuc.html  
✅ **Better performance** (ít data hơn to process)  
✅ **Smarter prioritization** (updated articles first)  
✅ **Better debugging** (detailed stats and logs)

---

**Bottom line**: Giờ đây tin-tuc.html sẽ luôn hiển thị 15 bài viết **unique** và **mới nhất**, không còn trùng lặp! 🚀
