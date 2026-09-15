

function GetUrlPath() {
    let e = document.location.toString()
    return -1 != (e = decodeURI(e)).indexOf("/") && (e = e.substring(0, e.lastIndexOf("/"))), e
}
/**
 * 通过wps提供的接口执行一段脚本
 * @param {*} param 需要执行的脚本
 */
function shellExecuteByOAAssist(param) {
    if (wps != null) {
        wps.OAAssist.ShellExecute(param)
    }


}
/**
 * 
 * @param {*} osInfo 系统信息
 * @returns 返回插件所在路径
 */
function getAddonPath(osInfo) {
    const winPath = wps.Env.GetAppDataPath() + `/kingsoft/wps/jsaddons/wps-zotero_1.0.0`;


    const linuxPath = wps.Env.GetHomePath() + `/.local/share/Kingsoft/wps/jsaddons/wps-zotero_1.0.0`;

    const macPath = wps.Env.GetHomePath() + `/.kingsoft/wps/jsaddons/wps-zotero_1.0.0`;
    if (osInfo == "windows") {


        return winPath;

    } else if (osInfo == "linux") {

        return linuxPath;
    }

    return macPath;
}
/**
 * 
 * @param {*} osInfo 系统信息
 * @returns 配置文件json对象
 */
function getSettingsJson(osInfo) {
    try {
   
   const jsonPath = getAddonPath(osInfo) + '/settings.json'
    //console.log("json路径“："+jsonPath)
    if (!window.Application.FileSystem.Exists(jsonPath)) {
        alert("配置文件不存在！")
        return null;
    }
   
    const tmpJson=window.Application.Env.GetTempPath()+"/settings.json"
    //console.log("开始读取配置文件，home路径为"+tmpJson)
    if(!window.Application.FileSystem.Exists(tmpJson)){
        
        const tmp = window.Application.FileSystem.ReadFile(jsonPath)
        window.Application.FileSystem.WriteFile(tmpJson, tmp);
        return;
    }
    try {
        const res=window.Application.FileSystem.ReadFile(tmpJson)
        const jsonObject = JSON.parse(res)
     
        return jsonObject;
 
    } catch (error) {
        console.error("解析json出错，请检查json数据格！", error);
        return null; 
    }
  
 

} catch (error) {
    console.error("读取配置文件失败！", error);
    return null; // 返回 null 表示发生错误
}
}
/**
 * 
 *
 * @param {*} updatedJsonString 需要更新的数据
 */
function setSettingsJson(updatedJsonString) {
    try {
        
        const jsonString =  JSON.stringify(updatedJsonString);
     //alert("更新数据为"+jsonString)
        // 写入文件
          const tmpJson=window.Application.Env.GetTempPath()+"/settings.json"
        console.log("json路径："+tmpJson)
         window.Application.FileSystem.WriteFile(tmpJson, jsonString);
       
    } catch (error) {
        console.error("写入配置文件错误！", error);
    }


}