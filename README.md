# Web học tập - Học kỳ 3 (26-27)

Website ôn tập gồm 3 mục: Trang chủ, Trắc nghiệm môn học, Tài liệu môn học.
Đưa nguyên thư mục này lên GitHub (GitHub Pages) để chạy. Tên file và thư mục không dấu, phân biệt chữ hoa/thường.

## Cấu trúc

```
web-hoc-tap/
├─ index.html              trang web duy nhất (3 mục)
├─ giao-dien/
│  ├─ style.css            giao diện dùng chung      
│  └─ app.js               code dùng chung cho mọi môn
├─ du-lieu/
│  ├─ danh-sach-mon.json   danh sách môn học
│  └─ <ma-mon>.json        câu hỏi của từng môn (vd: mang-may-tinh.json)
└─ tai-lieu/
   └─ <ma-mon>/            file PDF tóm tắt của môn đó (chỉ tóm tắt tự làm)
```

## Thêm hoặc sửa nội dung
- Sửa câu hỏi: sửa file `du-lieu/<ma-mon>.json`, kiểm tra bằng một trang "JSON validator" rồi đưa lên lại.
- Thêm môn có câu hỏi: đặt file `<ma-mon>.json` vào `du-lieu/`, rồi điền `file_cau_hoi` của môn đó trong `danh-sach-mon.json`.
- Thêm tài liệu: chép PDF vào `tai-lieu/<ma-mon>/`, rồi thêm một dòng vào mảng `tai_lieu` của môn đó, dạng
  `{ "ten": "Chương 1 - Tổng quan mạng máy tính", "loai": "Tóm tắt", "file": "tai-lieu/mang-may-tinh/chuong-01-tong-quan-mang-may-tinh.pdf" }`.
  Nên đổi tên PDF sang không dấu khi chép vào đây.

## Định dạng file câu hỏi (<ma-mon>.json)
```json
{
  "mon": "Mạng máy tính",
  "ma_mon": "mang-may-tinh",
  "phien_ban": 1,
  "chuong": [
    {
      "id": "c1",
      "nhom": "Bài giảng",
      "ten": "Chương 1 - Tổng quan mạng máy tính",
      "cau": [
        {
          "id": "c1-01",
          "hoi": "Nội dung câu hỏi",
          "dap_an": ["ĐÁP ÁN ĐÚNG luôn đặt đầu tiên", "sai 1", "sai 2", "sai 3"],
          "giai_thich": "Giải thích",
          "kho": false,
          "nguon": "Chương 1, mục 3.4 (slide-vi 01)"
        }
      ]
    }
  ]
}
```
- `id` câu không trùng và không đổi khi sửa (tính năng "làm tiếp" ghi nhớ theo id).
- Website tự đảo thứ tự đáp án khi hiển thị.

## Lưu ý
- Mở `index.html` bằng cách bấm đúp sẽ KHÔNG đọc được file .json (trình duyệt chặn). Xem trên GitHub Pages hoặc chạy server nhỏ (vd: VS Code + Live Server).
- Các file `.gitkeep` (nếu còn) đã hết tác dụng vì thư mục đã có file; xóa được.
- Tiến độ "làm tiếp", điểm lần trước và công tắc xáo trộn chỉ lưu trong trình duyệt của từng máy.
