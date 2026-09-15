

/**
 * 
 * @param {*} osInfo 系统标识
 * @returns 无
 */
function runProxy(osInfo){
    const addonPath=getAddonPath(osInfo)
    if (osInfo== "windows") {
        
        runServers("runProxy", addonPath+'/proxy.exe', 'jsHide');
       
        return;
        
    } else if (osInfo== "linux") {
        runServers("runProxy", addonPath+'/runPY.sh', 'jsHide');
       
        return;
       
    }  

    runServers("runProxy", 'open -n '+addonPath+'/proxy.app', 'jsHide');
        return;
}
/**
 * 
 * @param {*} osInfo 系统标识
 * @param {*} zoteroPath zotero路径
 * @returns 无
 */
function runZotero(osInfo,zoteroPath) {
   //console.log(JSON.stringify(settingsJson)) 

   const zoteroPathValue=zoteroPath
  
   //console.log("zoteroPath.osInfo的值"+settingsJson.zoteroPath[osInfo])
   // 检查路径是否为空
   if (!zoteroPathValue || zoteroPathValue.trim() === "") {
    alert("启动zotero失败，zotero路径不可以为空！")
    return;
    }   
    if (osInfo == "macos") {
        runServers("runZotero", 'open '+zoteroPathValue,'jsMaximizedFocus');
        return;
    } 
        runServers("runZotero", zoteroPathValue+'', 'jsMaximizedFocus');
     
   return; 

}
/**
 * 首次获取样式管理器焦点
 */
function checkAndRunZotero() {
    const os=window.localStorage.getItem("osPlatform")
    if (os!=="windows") {
        return;
    }
    let settingsJson=getSettingsJson(os);
    const zoteroSwitchValue=settingsJson.zoteroPath[os];
   
        runZotero(os,zoteroSwitchValue);
    
}
async function bindCitationsToBookmarks() {
    try {

        const doc = Application.ActiveDocument;

        const zcb = getZoteroBiblField(doc)



   
        if (!zcb) {

            alert("文献列表不存在，请选择已插入文献的文档！！", "wps弹窗样式")

            return
        }
        zc_bind().import();
       
        await zc_bind().command('refresh');
        zc_clearRegistry();

        CreateBookmarksForSelectedParagraphs(zcb, doc)

        // 获取所有书签并排序
        const bookmarks = getSortedBookmarks(doc);
        if (bookmarks.length === 0) {
            return "未找到以 'ret_' 开头的书签！";
        }

        // 初始化数据结构
        const idToBookmarkMap = new Map();        // 文献ID → 书签索引
        const bookmarkIndexMap = new Map();       // 书签名称 → 书签索引
        const bookmarkRefCount = new Map();       // 书签索引 → 使用次数
        const bookmarkNamesByIndex = new Map();   // 书签索引 → 书签名称

        // 初始化书签映射
        bookmarks.forEach(bm => {
            const index = bm.index;
            bookmarkIndexMap.set(bm.name, index);
            bookmarkNamesByIndex.set(index, bm.name);
            bookmarkRefCount.set(index, 0);
        });

        let totalFieldsProcessed = 0;
        let fieldsWithBookmarks = 0;
        let conflicts = 0;
        let nextAvailableIndex = 1; // 下一个可用的书签索引

        // 按顺序收集所有Zotero域
        const zoteroFields = [];
        for (let i = 1; i <= doc.Fields.Count; i++) {
            const field = doc.Fields.Item(i);
            if (zc_isZoteroField(field)) {
                //console.log("zotero域代码"+i)
                zoteroFields.push({
                    field: field,
                    start: field.Result.Start
                });
            }
        }

        // 按位置正序排序（从文档开头开始）
        zoteroFields.sort((a, b) => a.start - b.start);

        // 处理收集到的Zotero域（按文档顺序）
        for (const fieldInfo of zoteroFields) {
            const field = fieldInfo.field;
            totalFieldsProcessed++;

            // 提取文献ID（保持顺序）
            const ids = extractItemIDs(field);
            if (ids.length === 0) {
                conflicts++;
                continue;
            }

            //  为所有新的ID分配书签索引
            let newIds = []; // 记录域中新增的文献ID
            for (const id of ids) {
                if (!idToBookmarkMap.has(id)) {
                    // 为新ID分配书签索引
                    idToBookmarkMap.set(id, nextAvailableIndex);
                    newIds.push(id);

                    // 占用书签索引，确保后续分配递增
                    if (nextAvailableIndex <= bookmarks.length) {
                        nextAvailableIndex++;
                    }
                }
            }

            //绑定书签
            let bookmarkIndexToUse = null;

            // 如果有新的ID，使用第一个新ID的书签
            if (newIds.length > 0) {
                bookmarkIndexToUse = idToBookmarkMap.get(newIds[0]);
            }
            // 如果没有新ID，使用第一个已有ID的书签
            else {
                bookmarkIndexToUse = idToBookmarkMap.get(ids[0]);
            }

            // 绑定书签到域
            if (bookmarkIndexToUse !== null && bookmarkNamesByIndex.has(bookmarkIndexToUse)) {
                const bookmarkName = bookmarkNamesByIndex.get(bookmarkIndexToUse);

                if (linkFieldToBookmark(field, bookmarkName)) {
                    fieldsWithBookmarks++;
                    bookmarkRefCount.set(bookmarkIndexToUse, bookmarkRefCount.get(bookmarkIndexToUse) + 1);
                    continue;
                }
            }

            // 如果无法绑定，尝试备用策略
            let fallbackSuccess = false;
            for (const id of ids) {
                if (idToBookmarkMap.has(id)) {
                    const index = idToBookmarkMap.get(id);
                    if (bookmarkNamesByIndex.has(index)) {
                        const fallbackBookmark = bookmarkNamesByIndex.get(index);
                        if (linkFieldToBookmark(field, fallbackBookmark)) {
                            fieldsWithBookmarks++;
                            bookmarkRefCount.set(index, bookmarkRefCount.get(index) + 1);
                            fallbackSuccess = true;
                            break;
                        }
                    }
                }
            }

            if (!fallbackSuccess) {
                conflicts++;
            }
        }

      
    } catch (e) {
        return `错误: ${e.message}\n堆栈: ${e.stack}`;
    }
}

function CreateBookmarksForSelectedParagraphs(field, doc) {
    const sel = field.Result.Duplicate;
    try {
        const bookmarks = doc.Bookmarks;
        const paragraphs = sel.Paragraphs;
        //let createdCount = 0;

        for (let i = 1; i <= paragraphs.Count; i++) {
            const para = paragraphs.Item(i);
            // 跳过空段落（仅包含段落标记）
            if (para.Range.Text.replace(/\r|\n/g, "").length === 0) continue;

            const bookmarkName = "ret_" + i;
            // 删除同名书签
            if (bookmarks.Exists(bookmarkName)) {
                bookmarks.Item(bookmarkName).Delete();
            }
            // 为当前段落创建书签（范围不包含段落标记）
            const range = para.Range;
            range.End = range.End - 1; // 排除段落标记
            bookmarks.Add(bookmarkName, range);
            //createdCount++;
        }
        //alert("已创建 " + createdCount + " 个书签！");
    } catch (e) {
        console.log(`创建书签失败: ${e.message}`);
    }
}
// 绑定域到书签
function linkFieldToBookmark(field, bookmarkName) {
    const doc = Application.ActiveDocument;
    const range = field.Result.Duplicate;

    try {
        // 检查书签是否存在
        doc.Bookmarks.Item(bookmarkName); // 如果书签不存在会抛出错误

        // 创建超链接到书签
        doc.Hyperlinks.Add(
            range,         // 锚点范围
            "",            // 地址（空）
            bookmarkName,  // 子地址（书签）
            "",            // 屏幕提示文本
            "",            // 要显示的文本（使用原有文本）
            range.Text     // 超链接的文本
        );

        return true;
    } catch (e) {
        console.log(`绑定书签失败: ${e.message}`);
        return false;
    }
}

// 获取排序后的书签列表
function getSortedBookmarks(doc) {
    const bookmarks = [];
    for (let i = 1; i <= doc.Bookmarks.Count; i++) {
        const bm = doc.Bookmarks.Item(i);
        if (bm.Name.startsWith("ret_")) {
            const match = bm.Name.match(/ret_(\d+)/);
            if (match) {
                const index = parseInt(match[1]);
                bookmarks.push({
                    name: bm.Name,
                    index: index,
                    range: bm.Range
                });
            }
        }
    }

    // 按索引排序
    return bookmarks.sort((a, b) => a.index - b.index);
}

function getZoteroBiblField(doc) {
    for (let i = doc.Fields.Count; i >= 0; i--) {
        const field = doc.Fields.Item(i);
        if (isZoteroBiblField(field)) {
            return field
        }
    }

    return false

}

// 判断是否为Zotero域
function isZoteroField(field) {
    try {
        const codeText = field.Code.Text;
        return codeText.includes("ADDIN ZOTERO_ITEM") &&
            codeText.includes("CSL_CITATION");
    } catch {
        return false;
    }
}
// 判断是否为Zotero 文献列表域

function isZoteroBiblField(field) {
    try {
        const codeText = field.Code.Text;
        return codeText.includes("ADDIN ZOTERO_BIBL")

    } catch {
        return false;
    }
}
// 提取域中的所有文献ID（保持顺序）
function extractItemIDs(field) {
    try {
        const codeText = field.Code.Text;
        const ids = [];

        // 先尝试精确匹配citationItems数组
        const citationItemsRegex = /"citationItems"\s*:\s*$$([^$$]*)\]/;
        const citationItemsMatch = codeText.match(citationItemsRegex);
        if (citationItemsMatch) {
            const itemsText = citationItemsMatch[1];
            const idRegex = /"id"\s*:\s*"?(\d+)"?/g;
            let idMatch;
            while ((idMatch = idRegex.exec(itemsText)) !== null) {
                const idValue = idMatch[1];
                if (!isNaN(idValue)) {
                    ids.push(parseInt(idValue));
                }
            }
        }

        // 如果没有找到，尝试更宽松的匹配
        if (ids.length === 0) {
            const directIdRegex = /"id"\s*:\s*"?(\d+)"?/g;
            let directMatch;
            while ((directMatch = directIdRegex.exec(codeText)) !== null) {
                const idValue = directMatch[1];
                if (!isNaN(idValue)) {
                    ids.push(parseInt(idValue));
                }
            }
        }

        // 去重但保持顺序
        const uniqueIds = [];
        ids.forEach(id => {
            if (!uniqueIds.includes(id)) uniqueIds.push(id);
        });

        return uniqueIds;
    } catch (e) {
        console.log(`提取ID失败: ${e.message}`);
        return [];
    }
}