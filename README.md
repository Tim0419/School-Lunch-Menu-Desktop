# School-Lunch-Menu-Desktop-ForTaiwan

---

## Environment Building

- Download [Lively Wallpaper](https://github.com/rocksdanister/lively?tab=readme-ov-file#download) or another wallpaper engine.
- 下載[Lively Wallpaper](https://github.com/rocksdanister/lively?tab=readme-ov-file#download)或其他同類型程式

---

## settings.json

```json
    {
        "id": {
            "school": "The School ID(number or string) 學校代碼(數字或字串)",
            "kitchen": "The Kitchen ID(number or string) 廚房廚房代碼(數字或字串)"
        },
        "update" : {
            "time" : "Frequency of updates(Unit: ms) 更新的頻率(單位: 毫秒)",
            "tomorrow" : {
                "hour" : "Update time for tomorrow's dishes(hour) 幾點更新明天的資料",
                "minute" : "Update time for tomorrow's dishes(minute) 幾分更新明天的資料"
        }
        },
        "background" : {
            "src" : "",
            "interactivity": false
        }
    }
```
- Get the school ID
  1. Visit [教育部校園食材登錄平臺2.0](https://fatraceschool.k12ea.gov.tw/)
  2. Search the school.
  3. You can see the school ID in the URL(the param called 'school').
- Get the kitchen ID
  - If you don't know, you can use "all"
