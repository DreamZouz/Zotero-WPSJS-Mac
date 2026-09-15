

/**
 * 
 * @returns 返回系统标识
 */
function detectOS() {
    const osInfo = window.localStorage.getItem("osPlatform")
    if (osInfo) {

        return osInfo;
    }
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Windows") !== -1) {
        window.localStorage.setItem("osPlatform", "windows")
        return "windows";
    } else if (userAgent.indexOf("Linux") !== -1) {
        window.localStorage.setItem("osPlatform", "linux")
        return "linux";
    }

    window.localStorage.setItem("osPlatform", "macos")
    return "macos";
};



/**
 * 
 * @param {*} version mac wps版本号
 * @returns bool
 */
function compareVersions(version) {

   
    const nowVersion = version;
    const tmpVersion = [6, 15]
    if (nowVersion[0] > tmpVersion[0]) {
        return true;
    } else if (nowVersion[0] === tmpVersion[0]) {
        return nowVersion[1] >= tmpVersion[1]
    }
    return false;
}
/**
 * 
 * @param {*} url 网址
 * @param {*} taskpaneId 任务窗格id
 */
function handAi(url, taskpaneId) {

    let tsId = window.Application.PluginStorage.getItem(taskpaneId + "")
    if (!tsId) {
        let tskpane = window.Application.CreateTaskPane(url + "")
        let id = tskpane.ID
        window.Application.PluginStorage.setItem(taskpaneId + "", id)
        tskpane.Visible = true
    } else {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.Visible = !tskpane.Visible
    }

}
function citationPreviewUi(url, taskpaneId,title) {

    let tsId = window.Application.PluginStorage.getItem(taskpaneId + "")
    if (!tsId) {
        let tskpane = window.Application.CreateTaskPane(url + "",title)
        let id = tskpane.ID
         tskpane.MinWidth=450 * window.devicePixelRatio
        window.Application.PluginStorage.setItem(taskpaneId + "", id)
        tskpane.Visible = true
        return
    }
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.Visible = true
        tskpane.Navigate(url+"")
}