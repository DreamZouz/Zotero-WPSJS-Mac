// Shouldn't be needing this if using the latest version of WPS
const WPS_Enum = {
    msoCTPDockPositionLeft: 0,
    msoCTPDockPositionRight: 2,
    msoPropertyTypeString: 4,
    wdAlignParagraphJustify: 3,
    wdAlignTabLeft: 0,
    wdCharacter: 1,
    wdCollapseEnd: 0,
    wdCollapseStart: 1,
    wdFieldAddin: 81,
    wdLineBreak: 6,
    wdParagraph: 4
};

function zc_alert(msg) {
    alert(`WPS-Zotero: ${msg}`);
};

/**
 * Callback for plugin loading.
**/
async function OnAddinLoad(ribbonUI) {
    if (typeof (wps.Enum) !== "object") {
        wps.Enum = WPS_Enum;
        zc_alert('You are using an old version of WPS, this plugin might not work properly!');
    }
    if (typeof (wps.ribbonUI) !== "object") {
        wps.ribbonUI = ribbonUI;
    }

    if (window.Application.JSIDE == null) {

        alert("Zotero加载项需要您授权\n请依次打开菜单栏的  工具--->宏安全性--->可靠发行商--->勾选 '信任对于wpsjs项目的访问',重启wps即可!")

    }



    //系统检测
    const osInfo = detectOS();
    console.log("系统信息：" + osInfo)
    let settingsJson = getSettingsJson(osInfo);
    const zoteroPathValue = settingsJson.zoteroPath[osInfo];
    console.log("配置文件" + settingsJson)
    runProxy(osInfo);
    if (osInfo == "macos") {
        const tmp = compareVersions(wps.Application.Build.split('.').map(Number))
        if (!tmp) {
            alert("你的wps版本无法运行插件，请至 https://www.wps.cn 更新到最新版本！！")
        }
    }
    if (settingsJson.zoteroSwitch) {
        runZotero(osInfo, zoteroPathValue);
    }

    if (settingsJson.zoteroSwitch) {
        runZotero(osInfo, zoteroPathValue);
    }
    if (settingsJson.citationPreview) {
        wps.ApiEvent.AddApiEventListener("WindowSelectionChange", () => {
            let unlinking = window.Application.PluginStorage.getItem("unlink")
            let footnotes = window.Application.PluginStorage.getItem("footnotes")
            if (unlinking || footnotes) {
                return
            }
            if (window.Application.Selection.Fields.Count == 0 && window.Application.ActiveDocument.Footnotes.Count == 0) {
                let cpId = window.Application.PluginStorage.getItem(window.Application.ActiveDocument.DocID + "");
                if (cpId) {
                    const res = Number(cpId)
                    window.Application.ActiveDocument.Fields.Item(res).Result.HighlightColorIndex = 0;
                }
                return
            }

            if (window.Application.Selection.Fields.Count >= 1) {

                const tl = window.Application.ActiveDocument.ActiveWindow.GetPoint(window.Application.Selection.Range)

                let myRange = window.Application.Selection.Fields.Item(1).Code.Text
                const hasCitation = myRange.includes('ADDIN ZOTERO_ITEM CSL_CITATION');
                if (hasCitation) {
                    if (!settingsJson.mouseFollow) {
                        citationPreviewUi(GetUrlPath() + "/ui/CitationPreview.html", "citationPreview","引注预览")
                   
                        return
                    }
                    const topFlag = window.Application.PluginStorage.getItem("topTo")
                    if(topFlag){
                        return
                    }
                    window.Application.ShowDialogEx(GetUrlPath() + "/ui/CitationPreviewMouse.html", "引注预览", 400 * window.devicePixelRatio, 380 * window.devicePixelRatio, false, false, false, true, true, false, true, (tl.ScreenPixelsLeft - 10) * window.devicePixelRatio, (tl.ScreenPixelsTop - 30) * window.devicePixelRatio)

                }

            }

        });



    }

    // Exit the proxy server when the application quits.
    wps.ApiEvent.AddApiEventListener("ApplicationQuit", () => {

        postRequestXHR('http://127.0.0.1:21931/stopproxy', null);


    });


    return true;
}

/**
 * Callback for button clicking events.
**/
let zc_actionRunning = false;
async function OnAction(control) {
    if (zc_actionRunning) return false;
    zc_actionRunning = true;
    try {
    const eleId = control.Id
    switch (eleId) {
        case "btnAddEditCitation":

            checkAndRunZotero();//给予zotero焦点

            await zc_bind().command('addEditCitation');
            // IMPORTANT: Release references on the document objects!!!
            zc_clearRegistry();


            break;
        case "btnAddEditBib":
            //checkAndRunZotero()//给予zotero焦点
            await zc_bind().command('addEditBibliography');
            zc_clearRegistry();
            break;
        case "btnRefresh":
            //checkAndRunZotero()//给予zotero焦点
            zc_bind().import();
            // Must open a new client, since import will not register fields to zc_bind().
            await zc_bind().command('refresh');
            zc_clearRegistry();
            break;
        case "btnPref":
            //checkAndRunZotero()//给予zotero焦点
            await zc_bind().command('setDocPrefs');
            zc_clearRegistry();
            break;
       case "btnCitationHyperlinks":
            //checkAndRunZotero()//给予zotero焦点
          await bindCitationsToBookmarks()
            break;
        case "btnUnlink":
            //checkAndRunZotero()//给予zotero焦点
            await zc_bind().command('removeCodes');
            zc_clearRegistry();
            break;
        case "btnAddNote":
            //checkAndRunZotero()//给予zotero焦点
            await zc_bind().command('addNote');
            zc_clearRegistry();
            break;
        case "btnDonate":
            {
                window.Application.ShowDialog(GetUrlPath() + "/ui/Donate.html", "捐赠", 700 * window.devicePixelRatio, 640 * window.devicePixelRatio, true, true)
            }
            break;

        default:
    }
    return true;
    } finally {
        zc_actionRunning = false;
    }
}

function GetImage(control) {
    const eleId = control.Id
    switch (eleId) {
        case "btnAddEditCitation":
            return "images/addEditCitation.png";
        case "btnAddEditBib":
            return "images/addEditBib.png";
        case "btnRefresh":
            return "images/refresh.svg";
        case "btnPref":
            return "images/pref.png";
        case "btnAddNote":
            return "images/addNote.png";
        case "btnUnlink":
            return "images/unlink.svg";
       case "btnCitationHyperlinks":
            return "images/Hyperlinks.png";
        case "btnDonate":
            return "images/Donate.png";
        case "btnAbout":
            return "images/about.png";
        case "btnZoteroSet":
            return "images/zoteroSet.png";
        case "menu1":
            return "images/DeepSeek.png";
        case "yuanbaoItem":
            return "images/yuanbao.png";
        case "baiduaiItem":
            return "images/baiduai.png";
        case "deepseekItem":
            return "images/DeepSeek.png";
        case "chatGPTItem":
            return "images/chatgpt.png";
        case "zhipuItem":
            return "images/zhipu.png";
        case "tongyiItem":
            return "images/tongyi.svg";
        case "doubaoItem":
            return "images/doubao.png";
        case "kimiItem":
            return "images/kimi.png";
        case "menu2":
            return "images/Settings.png";
        default:
            break;
    }
    return "images/default.svg";
}



function dropDownOnAction(selectedId) {
    const eleId = selectedId.Id
    switch (eleId) {
        case "yuanbaoItem":
            handAi("https://yuanbao.tencent.com/", "yuanbao")
            break;
        case "baiduaiItem":
            handAi("https://chat.baidu.com/", "baiduai")
            break;
        case "deepseekItem":
            handAi("https://chat.deepseek.com/", "DeepSeek")
            break;
        case "chatGPTItem":
            handAi("https://chatgpt.com/", "ChatGPT")
            break;
        case "zhipuItem":
            handAi("https://chatglm.cn/", "zhipuqingyan")
            break;
        case "tongyiItem":
            handAi("https://tongyi.aliyun.com/qianwen/", "tongyi")
            break;
        case "doubaoItem":
            handAi("https://www.doubao.com/chat/", "doubao")
            break;
        case "kimiItem":
            handAi("https://kimi.moonshot.cn//", "Kimi")


        default:
    }
    return true;
}
function SettingsOnAction(selectedId) {
    const eleId = selectedId.Id
    switch (eleId) {
        case "btnAbout":
            window.Application.ShowDialog(GetUrlPath() + "/ui/About.html", "关于", 600 * window.devicePixelRatio, 480 * window.devicePixelRatio, false, true)
            break;
        case "btnZoteroSet":
            window.Application.ShowDialog(GetUrlPath() + "/ui/ZoteroSet.html", "Zotero设置", 500 * window.devicePixelRatio, 450 * window.devicePixelRatio, false, true)
            break;


        default:
    }
    return true;
}