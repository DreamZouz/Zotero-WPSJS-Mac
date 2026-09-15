

function setZoteroPath() {
    const osInfo = detectOS();
    let settingsJson = getSettingsJson(osInfo);
    const fso = window.Application.FileDialog(3)
    fso.Title = "请选择zotero程序"

    if (fso.Show() == -1) {
        for (let i = 1; i <= fso.SelectedItems.Count; i++) {
            let selectZoteroAppPath = fso.SelectedItems.Item(i)
            // 验证路径
        if (!validateZoteroPath(selectZoteroAppPath, osInfo)) {
            alert("选择的路径无效，请选择正确的 Zotero 应用程序！");
           return; 
        }
            //alert(selectZoteroAppPath)
            let pathInput = document.getElementById('zoteroPath');
            pathInput.value = selectZoteroAppPath;
         
            settingsJson.zoteroPath[osInfo] = pathInput.value;
        

            setSettingsJson(settingsJson);

            alert("zotero路径修改成功！")
            return


        }
    }


}
function validateZoteroPath(path, osInfo) {
    try {
       
        let expectedSuffix;
        if (osInfo === "windows") {
            expectedSuffix = "zotero.exe"; // Windows 系统下最后一个部分应为 zotero.exe
        } else if (osInfo === "macos") {
            expectedSuffix = "Zotero.app"; // macOS 系统下最后一个部分应为 Zotero.app
        } else {
            throw new Error("不支持的操作系统：" + osInfo);
        }

        // 提取路径的最后一部分
        let lastPart;
        if (path.includes("\\")) { // Windows 路径分隔符
            lastPart = path.split("\\").pop();
        } else if (path.includes("/")) { // macOS 或 Linux 路径分隔符
            lastPart = path.split("/").pop();
        } else {
            return false; // 如果没有 / 或 \，返回 false
        }

        // 检查最后一部分是否符合
        return lastPart.toLowerCase() === expectedSuffix.toLowerCase();
    } catch (error) {
        console.error("路径验证失败:", error);
        return false;
    }
}

