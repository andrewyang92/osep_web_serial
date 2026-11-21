/*
 * JSON 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "gasoJSON",
  "name": "JSON",
  "nameEn": "JSON",
  "author": "gasolin、TYiC",
  "updated": "2026-11-22",
  "tags": [
    "網路服務",
    "開放資料",
    "資料分析"
  ],
  "needs": [
    "網路"
  ],
  "color": {
    "primary": "#4a90e2",
    "secondary": "#4a90e2",
    "tertiary": "#4a90e2"
  },
  "card": "images/gasoJSON/card.png",
  "icon": "images/gasoJSON/small.png",
  "blockIcon": "images/gasoJSON/block-icon.svg",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_json",
  "tagline": "從網路下載 JSON、CSV、文字、XML 資料，查詢、篩選、修改都能在 Scratch 裡完成。",
  "overview": "很多開放資料（天氣、公車、空氣品質、政府資料）都是用 **JSON** 格式提供的。這個插件可以：\n\n- **下載**網路上的 JSON、CSV、文字、XML 檔\n- **讀取**某一筆、某個欄位的值，列出所有欄位、算筆數\n- **查詢**欄位包含某個文字、或數值大於某個數的資料\n- **修改**資料：改某一格、新增、取代、刪除某一筆\n\n### JSON 長什麼樣子\nJSON 最常見的是「很多筆資料」的清單，每一筆有好幾個欄位：\n\n```\n[{\"name\": \"小明\", \"score\": 90}, {\"name\": \"小華\", \"score\": 75}]\n```\n\n「第 1 筆」是 `{\"name\": \"小明\", \"score\": 90}`，它的 `score` 欄位是 `90`。插件的讀取積木都是用文字傳來傳去，常見的做法是把資料存進變數，再一層一層取出來。\n\n### 讀取網路資料的兩個重點\n- 下載的積木**不會等資料到**就結束了。讀資料的積木放在 [[onJSONReceived]] 底下，或在下載後加「等待 1 秒」\n- 很多網站不允許別的網頁直接讀取它的資料（跨網域限制，CORS）。[[fetchJSON]] 讀不到時會自動改用中繼伺服器（OSEP 的 Google Apps Script）再試一次；[[corsfetchJSON]] 則一開始就用中繼\n\n插件原始作者：gasolin、TYiC（[scratch3-internet](https://github.com/gasolin/scratch3-internet)）。",
  "groups": [
    {
      "name": "取得資料",
      "intro": "把資料下載（或貼上）到插件裡。插件一次只存一份資料，新的會取代舊的。",
      "blocks": [
        {
          "opcode": "fetchJSON",
          "type": "command",
          "text": "從網址[url]取得json格式資料",
          "textEn": "get json data from URL [url]",
          "args": {
            "url": {
              "type": "string",
              "value": "https://",
              "desc": "JSON 資料的網址。"
            }
          },
          "summary": "從網址下載 JSON 資料。",
          "detail": "先直接下載；被跨網域限制擋住時，自動改用中繼伺服器再試一次。下載完成時 [[onJSONReceived]] 會觸發，[[readFromJSON]] 就是這份資料。\n\n> 積木結束時資料可能還沒下載完。"
        },
        {
          "opcode": "corsfetchJSON",
          "type": "command",
          "text": "cors從網址[url]取得json格式資料",
          "textEn": "get json data from URL [url]",
          "args": {
            "url": {
              "type": "string",
              "value": "https://",
              "desc": "JSON 資料的網址。"
            }
          },
          "summary": "一開始就透過中繼伺服器下載 JSON。",
          "detail": "確定網站有跨網域限制時用這塊，可以省掉第一次失敗的時間。中繼伺服器是 Google Apps Script，大量使用時可能比較慢。英文介面的積木文字和 [[fetchJSON]] 一樣，看的是位置（第 2 塊）。"
        },
        {
          "opcode": "fetchCSV",
          "type": "command",
          "text": "從網址[url]取得csv格式資料",
          "textEn": "get csv data from URL [url]",
          "args": {
            "url": {
              "type": "string",
              "value": "https://",
              "desc": "CSV 檔的網址。"
            }
          },
          "summary": "從網址下載 CSV 檔。",
          "detail": "CSV 是用逗號分隔欄位、一行一筆的表格文字。下載後會存成 `{\"0\": \"第1行\", \"1\": \"第2行\", …}` 的樣子，每一行再用 [[splitString]] 依逗號拆開。\n\n> ! 目前的程式只在換行是兩個字元 `\\r\\n` 的寫法時才分行，一般 CSV 檔下載後**常常整份都在第 1 筆**。要用表格資料，建議改用 Google 試算表插件，或先轉成 JSON（[[openexceltojsonurl]]）。"
        },
        {
          "opcode": "fetchTXT",
          "type": "command",
          "text": "從網址[url]取得text格式資料",
          "textEn": "get text data from URL [url]",
          "args": {
            "url": {
              "type": "string",
              "value": "https://",
              "desc": "文字檔的網址。"
            }
          },
          "summary": "從網址下載純文字檔，一行一筆。",
          "detail": "存成 `{\"0\": \"第1行\", \"1\": \"第2行\", …}`。用 [[readEntryFromJSON]] 取第幾行。",
          "tips": "這種格式不是清單，[[getJsonAllNum]] 算不出行數（會是空的）。"
        },
        {
          "opcode": "fetchXML",
          "type": "command",
          "text": "從網址[url]取得xml格式資料",
          "textEn": "get xml data from URL [url]",
          "args": {
            "url": {
              "type": "string",
              "value": "https://",
              "desc": "XML 資料的網址。"
            }
          },
          "summary": "從網址下載 XML，轉成 JSON。",
          "detail": "一律透過中繼伺服器下載，再把 XML 轉成 JSON。轉出來的結構比較深（標籤的內容常放在清單裡），可以先用「說出」看看長什麼樣子再決定怎麼讀。"
        },
        {
          "opcode": "openCorsSite",
          "type": "command",
          "text": "開啟 CORS 網址",
          "textEn": "open a CORS URL",
          "summary": "開啟 cors-anywhere 的示範頁。",
          "detail": "這是舊版插件用的跨網域服務。現在插件改用 OSEP 自己的中繼，一般**不需要**用這塊。"
        },
        {
          "opcode": "clearJSONData",
          "type": "command",
          "text": "清除 JSON 資料",
          "textEn": "clear JSON data",
          "summary": "清除插件裡的資料。",
          "detail": "清除後 [[readFromJSON]] 會變成「錯誤:JSON 資料不存在」。"
        }
      ]
    },
    {
      "name": "收到資料時",
      "intro": "",
      "blocks": [
        {
          "opcode": "onJSONReceived",
          "type": "hat",
          "text": "當收到 JSON 資料時",
          "textEn": "When JSON data is recieved",
          "summary": "資料下載完成（或新增、取代資料）時，執行底下的腳本。",
          "detail": "下載類的積木、[[texttojson]]、[[jsonpush]]、[[jsonreplace]] 完成時都會觸發。把讀資料的積木放在這裡，就不用猜要等多久。"
        }
      ]
    },
    {
      "name": "讀取資料",
      "intro": "這一組的 `[資料]` 空格要放 JSON 文字：可以放 [[readFromJSON]]，或放存了 JSON 的變數。",
      "blocks": [
        {
          "opcode": "readFromJSON",
          "type": "reporter",
          "text": "讀取的 JSON 資料",
          "textEn": "JSON data",
          "args": {
            "id": {
              "type": "string",
              "value": "id",
              "desc": "積木上沒有這個空格（程式裡留下來的設定），不用理會。"
            }
          },
          "summary": "插件裡目前的整份資料。",
          "returns": "JSON 文字。還沒有資料時是「錯誤:JSON 資料不存在」。",
          "tips": "常見做法：先把它存進變數「全部」，之後都用變數，比較好讀也比較快。",
          "detail": ""
        },
        {
          "opcode": "readEntryFromJSON",
          "type": "reporter",
          "text": "JSON 資料[variable]的第[n]筆",
          "textEn": "item [n] of JSON data [variable]",
          "args": {
            "variable": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（清單）。"
            },
            "n": {
              "type": "number",
              "value": "1",
              "desc": "第幾筆，從 1 開始。"
            }
          },
          "summary": "取出清單的第幾筆。",
          "returns": "那一筆的內容。是物件時回傳 JSON 文字（可以再用 [[readAttrFromJSON]] 取欄位），是文字時直接回傳文字。資料格式不對時回傳 `Error: …`。",
          "example": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "readEntryFromJSON",
                  "args": {
                    "variable": {
                      "use": "readFromJSON"
                    },
                    "n": {
                      "num": "1"
                    }
                  }
                }
              }
            }
          ],
          "detail": ""
        },
        {
          "opcode": "readAttrFromJSON",
          "type": "reporter",
          "text": "JSON 資料[variable]參數[attr]對應的值",
          "textEn": "JSON data [variable] with attribute [attr]",
          "args": {
            "variable": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（一個物件）。"
            },
            "attr": {
              "type": "string",
              "value": "參數",
              "valueEn": "attr",
              "desc": "欄位名稱，大小寫要一樣。"
            }
          },
          "summary": "取出某個欄位的值。",
          "returns": "欄位的值。欄位不存在時是空的；資料格式不對時回傳 `Error: …`。",
          "example": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "readAttrFromJSON",
                  "args": {
                    "variable": {
                      "use": "readEntryFromJSON",
                      "args": {
                        "variable": {
                          "use": "readFromJSON"
                        },
                        "n": {
                          "num": "1"
                        }
                      }
                    },
                    "attr": "name"
                  }
                }
              }
            }
          ],
          "detail": ""
        },
        {
          "opcode": "getJsonCol",
          "type": "reporter",
          "text": "JSON 資料[variable]所有欄位名稱",
          "textEn": "all the column names of JSON data [variable]",
          "args": {
            "variable": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（一個物件，例如某一筆）。"
            }
          },
          "summary": "列出所有欄位名稱。",
          "returns": "例如 `[\"name\",\"score\"]`。",
          "tips": "要放「某一筆」，不要放整份清單：整份清單會得到 `[\"0\",\"1\",\"2\",…]`。",
          "detail": ""
        },
        {
          "opcode": "getJsonAllNum",
          "type": "reporter",
          "text": "JSON 資料[variable]的資料筆數",
          "textEn": "length of JSON data [variable]",
          "args": {
            "variable": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（清單）。"
            }
          },
          "summary": "清單一共有幾筆。",
          "returns": "數字。放的不是清單時是空的。",
          "detail": ""
        }
      ]
    },
    {
      "name": "查詢與分割",
      "intro": "在清單裡找符合條件的資料。`[欄位]` 要和資料裡的欄位名稱完全一樣。",
      "blocks": [
        {
          "opcode": "useTextSearchGetData2",
          "type": "reporter",
          "text": "查詢資料[data]中欄位[column]包含特定值[value]的所有資料",
          "textEn": "Retrieve all data in the data [data] where the field [column] contains the value [value]",
          "args": {
            "data": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（清單）。"
            },
            "column": {
              "type": "string",
              "value": "欄位名稱",
              "valueEn": "column name",
              "desc": "要比對的欄位。"
            },
            "value": {
              "type": "string",
              "value": "值",
              "valueEn": "value",
              "desc": "要找的文字。"
            }
          },
          "summary": "找出某個欄位「包含」某段文字的所有資料。",
          "returns": "符合的資料，一樣是 JSON 清單，可以再用其他積木讀取；沒有符合時是 `[]`。",
          "tips": "是「包含」不是「等於」：找「中」會找到「中山」「台中」。",
          "detail": ""
        },
        {
          "opcode": "useTextSearchGetData",
          "type": "reporter",
          "text": "查詢資料[data]的欄位[column]若包含[value]的值，取得欄位[column2]的值",
          "textEn": "in JSON data [data] get all the values of the column [column2], when the column [column] of contains value [value] ",
          "args": {
            "data": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（清單）。"
            },
            "column": {
              "type": "string",
              "value": "欄位名稱",
              "valueEn": "column name",
              "desc": "要比對的欄位。"
            },
            "value": {
              "type": "string",
              "value": "文字",
              "valueEn": "text",
              "desc": "要找的文字。"
            },
            "column2": {
              "type": "string",
              "value": "欄位名稱",
              "valueEn": "column name",
              "desc": "要取出的欄位。"
            }
          },
          "summary": "欄位包含某段文字的資料，取出它們的另一個欄位。",
          "detail": "例如在公車資料裡，「路線名稱」包含「紅」的，取出「站名」。",
          "returns": "取出的值用逗號接起來，例如 `中山,台大`。可以再用 [[splitString]] 一個一個拿。"
        },
        {
          "opcode": "useNumberCompareGetData",
          "type": "reporter",
          "text": "查詢資料[data]的欄位[column]數值是否[symbol][number]，取得欄位[column2]的值",
          "textEn": "in JSON data [data] get all the values of the column [column2], when the column [column] [symbol] [number]",
          "args": {
            "data": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "JSON 文字（清單）。"
            },
            "column": {
              "type": "string",
              "value": "欄位名稱",
              "valueEn": "column name",
              "desc": "要比較的欄位（內容是數字）。"
            },
            "symbol": {
              "type": "menu",
              "options": [
                ">",
                ">=",
                "!=",
                "=",
                "<=",
                "<"
              ],
              "value": ">",
              "values": [
                ">",
                ">=",
                "!=",
                "=",
                "<=",
                "<"
              ],
              "optionsEn": [
                ">",
                ">=",
                "!=",
                "=",
                "<=",
                "<"
              ],
              "acceptReporters": true,
              "desc": "比較方式。"
            },
            "number": {
              "type": "number",
              "value": "數值",
              "valueEn": "number",
              "desc": "要比較的數字（小數會被捨去成整數）。"
            },
            "column2": {
              "type": "string",
              "value": "欄位名稱",
              "valueEn": "column name",
              "desc": "要取出的欄位。"
            }
          },
          "summary": "欄位的數值符合條件的資料，取出它們的另一個欄位。",
          "detail": "例如「score」大於 80 的，取出「name」。",
          "returns": "取出的值用逗號接起來，例如 `小明,小美`。"
        },
        {
          "opcode": "splitString",
          "type": "reporter",
          "text": "分割[data]取第[n]筆資料",
          "textEn": "Split the [data] and extract the [n] data record",
          "args": {
            "data": {
              "type": "string",
              "value": "資料",
              "valueEn": "data",
              "desc": "用逗號分隔的文字。"
            },
            "n": {
              "type": "number",
              "value": "1",
              "desc": "第幾段，從 1 開始。"
            }
          },
          "summary": "把用逗號分隔的文字切開，取第幾段。",
          "returns": "那一段文字；超出範圍時是空的。",
          "example": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "splitString",
                  "args": {
                    "data": "蘋果,香蕉,西瓜",
                    "n": {
                      "num": "2"
                    }
                  }
                }
              }
            }
          ],
          "detail": ""
        }
      ]
    },
    {
      "name": "修改資料與工具",
      "intro": "修改的是**插件裡目前的資料**（[[readFromJSON]] 那一份），資料要是 JSON 清單。",
      "blocks": [
        {
          "opcode": "openexceltojsonurl",
          "type": "command",
          "text": "開啟試算表轉json網站",
          "textEn": "open excel to json url",
          "summary": "開啟「試算表轉 JSON」網站。",
          "detail": "把 Excel 或試算表貼上去就能轉成 JSON，再用 [[texttojson]] 放進插件。"
        },
        {
          "opcode": "texttojson",
          "type": "command",
          "text": "文字[TEXT]轉JSON",
          "textEn": "[TEXT]  to json",
          "args": {
            "TEXT": {
              "type": "string",
              "value": "[{\"id\":1,\"name\":\"john\"},{\"id\":2,\"name\":\"marry\"}]",
              "desc": "JSON 文字，例如 `[{\"id\":1,\"name\":\"john\"}]`。"
            }
          },
          "summary": "把一段 JSON 文字直接放進插件，當成目前的資料。",
          "detail": "不用網路，適合自己準備小型資料。放進去後 [[onJSONReceived]] 會觸發。插件不會檢查格式，寫錯時之後的讀取積木會回傳 `Error: …`。"
        },
        {
          "opcode": "editjson",
          "type": "command",
          "text": "修改資料第[ROW]筆欄位[COL]值為[VALUE]",
          "textEn": "edit json data row [ROW] column [COL] valumn=[VALUE]",
          "args": {
            "ROW": {
              "type": "number",
              "value": "1",
              "desc": "第幾筆，從 1 開始。"
            },
            "COL": {
              "type": "string",
              "value": " ",
              "desc": "欄位名稱；沒有這個欄位時會新增。"
            },
            "VALUE": {
              "type": "string",
              "value": " ",
              "desc": "新的值（存成文字）。"
            }
          },
          "summary": "修改第幾筆某個欄位的值。",
          "detail": ""
        },
        {
          "opcode": "jsonclear",
          "type": "command",
          "text": "資料元素全部刪除",
          "textEn": "Delete all elements",
          "summary": "刪除插件裡的所有資料。",
          "detail": "和 [[clearJSONData]] 一樣，之後要再用 [[texttojson]] 或下載積木放入新資料。"
        },
        {
          "opcode": "jsonpush",
          "type": "command",
          "text": "增加1筆資料[TEXT]在[NUM]記錄",
          "textEn": "Add 1 record [TEXT] to [NUM] record",
          "args": {
            "NUM": {
              "type": "number",
              "value": "1",
              "desc": "要插入在第幾筆的位置，從 1 開始；比筆數大時加在最後。"
            },
            "TEXT": {
              "type": "string",
              "value": "{}",
              "desc": "新的一筆，JSON 物件，例如 `{\"name\":\"小美\",\"score\":88}`。"
            }
          },
          "summary": "在第幾筆的位置插入一筆新資料。",
          "detail": "原本那一筆和後面的資料會往後移。完成後 [[onJSONReceived]] 會觸發。"
        },
        {
          "opcode": "jsonreplace",
          "type": "command",
          "text": "第[NUM]記錄更換為[TEXT]",
          "textEn": "Replace record [NUM] with record [TEXT]",
          "args": {
            "NUM": {
              "type": "number",
              "value": "1",
              "desc": "要取代第幾筆，從 1 開始。"
            },
            "TEXT": {
              "type": "string",
              "value": "{}",
              "desc": "新的一筆，JSON 物件。"
            }
          },
          "summary": "把第幾筆整筆換成新的資料。",
          "detail": "完成後 [[onJSONReceived]] 會觸發。"
        },
        {
          "opcode": "jsondeletenum",
          "type": "command",
          "text": "刪除第[NUM]筆資料",
          "textEn": "Delete the [NUM] record",
          "args": {
            "NUM": {
              "type": "number",
              "value": "1",
              "desc": "要刪除第幾筆，從 1 開始。"
            }
          },
          "summary": "刪除第幾筆資料。",
          "detail": "後面的資料會往前移。"
        },
        {
          "opcode": "copyTEXT_memory",
          "type": "command",
          "text": "複製[TEXT]到剪貼簿",
          "textEn": "copy [TEXT]to clipboard",
          "args": {
            "TEXT": {
              "type": "string",
              "value": " ",
              "desc": "要複製的文字。"
            }
          },
          "summary": "把文字複製到電腦的剪貼簿。",
          "tips": "瀏覽器只允許使用者剛操作過（例如點擊角色）才能複製，建議放在「當角色被點擊」底下。",
          "detail": ""
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "讀取網路上的 JSON",
      "intro": "下載資料，收到後把第 1 筆的 name 說出來。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "fetchJSON",
            "args": {
              "url": "https://jsonplaceholder.typicode.com/users"
            }
          }
        ],
        [
          {
            "use": "onJSONReceived"
          },
          {
            "t": "變數 [V] 設為 [N]",
            "cat": "data",
            "args": {
              "V": {
                "v": "全部",
                "menu": true
              },
              "N": {
                "use": "readFromJSON"
              }
            }
          },
          {
            "t": "說出 [M] 持續 [S] 秒",
            "cat": "looks",
            "args": {
              "M": {
                "t": "字串組合 [A] [B]",
                "cat": "operators",
                "type": "reporter",
                "args": {
                  "A": "共有幾筆：",
                  "B": {
                    "use": "getJsonAllNum",
                    "args": {
                      "variable": {
                        "t": "全部",
                        "cat": "data",
                        "type": "reporter"
                      }
                    }
                  }
                }
              },
              "S": {
                "num": "2"
              }
            }
          },
          {
            "t": "說出 [M]",
            "cat": "looks",
            "args": {
              "M": {
                "use": "readAttrFromJSON",
                "args": {
                  "variable": {
                    "use": "readEntryFromJSON",
                    "args": {
                      "variable": {
                        "t": "全部",
                        "cat": "data",
                        "type": "reporter"
                      },
                      "n": {
                        "num": "1"
                      }
                    }
                  },
                  "attr": "name"
                }
              }
            }
          }
        ]
      ],
      "explain": "jsonplaceholder.typicode.com 是練習用的假資料網站。"
    },
    {
      "title": "自己做一份成績單並查詢",
      "intro": "不用網路：用文字建立資料，找出 80 分以上的人，再新增一筆。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "texttojson",
          "args": {
            "TEXT": "[{\"name\":\"小明\",\"score\":90},{\"name\":\"小華\",\"score\":75},{\"name\":\"小美\",\"score\":85}]"
          }
        },
        {
          "t": "說出 [M] 持續 [S] 秒",
          "cat": "looks",
          "args": {
            "M": {
              "use": "useNumberCompareGetData",
              "args": {
                "data": {
                  "use": "readFromJSON"
                },
                "column": "score",
                "symbol": {
                  "v": ">",
                  "menu": true
                },
                "number": {
                  "num": "80"
                },
                "column2": "name"
              }
            },
            "S": {
              "num": "2"
            }
          }
        },
        {
          "use": "jsonpush",
          "args": {
            "NUM": {
              "num": "4"
            },
            "TEXT": "{\"name\":\"小強\",\"score\":60}"
          }
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "use": "getJsonAllNum",
              "args": {
                "variable": {
                  "use": "readFromJSON"
                }
              }
            }
          }
        }
      ],
      "explain": "第一次說出「小明,小美」，新增一筆後筆數變成 4。"
    },
    {
      "title": "一筆一筆列出來",
      "intro": "用「重複」把每一筆的 name 加到清單裡。",
      "script": [
        {
          "use": "onJSONReceived"
        },
        {
          "t": "刪除 [L] 的所有項目",
          "cat": "list",
          "args": {
            "L": {
              "v": "名單",
              "menu": true
            }
          }
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "i",
              "menu": true
            },
            "N": {
              "num": "1"
            }
          }
        },
        {
          "t": "重複 [N] 次",
          "cat": "control",
          "type": "c",
          "args": {
            "N": {
              "use": "getJsonAllNum",
              "args": {
                "variable": {
                  "use": "readFromJSON"
                }
              }
            }
          },
          "body": [
            {
              "t": "添加 [X] 到 [L]",
              "cat": "list",
              "args": {
                "X": {
                  "use": "readAttrFromJSON",
                  "args": {
                    "variable": {
                      "use": "readEntryFromJSON",
                      "args": {
                        "variable": {
                          "use": "readFromJSON"
                        },
                        "n": {
                          "t": "i",
                          "cat": "data",
                          "type": "reporter"
                        }
                      }
                    },
                    "attr": "name"
                  }
                },
                "L": {
                  "v": "名單",
                  "menu": true
                }
              }
            },
            {
              "t": "變數 [V] 改變 [N]",
              "cat": "data",
              "args": {
                "V": {
                  "v": "i",
                  "menu": true
                },
                "N": {
                  "num": "1"
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "faq": [
    {
      "q": "讀到的是「錯誤:JSON 資料不存在」？",
      "a": "- 資料還沒下載完：把讀取積木放在「當收到 JSON 資料時」底下\n- 網址錯誤，或網站暫時連不上\n- 用了「清除 JSON 資料」或「資料元素全部刪除」"
    },
    {
      "q": "讀到 `Error: SyntaxError…`？",
      "a": "放進 `[資料]` 空格的不是正確的 JSON 文字。常見原因是放錯一層：例如把「第 1 筆」的結果放進要清單的積木，或欄位名稱和資料不符。先用「說出」看看裡面長什麼樣子。"
    },
    {
      "q": "網站的資料為什麼讀不到？",
      "a": "很多網站有跨網域限制，或需要 API 金鑰。[[fetchJSON]] 失敗時會自動用中繼再試；如果還是讀不到，可能是網址需要金鑰，或網站不是回傳 JSON。"
    },
    {
      "q": "CSV 檔讀進來只有一筆？",
      "a": "目前程式分行的方式有問題，一般 CSV 檔常常整份放在第 1 筆。建議改用 Google 試算表插件，或先用 [[openexceltojsonurl]] 轉成 JSON。"
    },
    {
      "q": "修改資料會改到網路上的檔案嗎？",
      "a": "不會。修改的只是插件裡的這一份，重新整理頁面或重新下載就會回到原本的資料。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
