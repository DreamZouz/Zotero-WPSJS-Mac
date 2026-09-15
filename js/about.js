async function onbuttonclick(idStr)
{
    const osInfo = detectOS();
    switch(idStr)
    {
        
        case "updateZotero":{

            wps.TabPages.OpenWebUrl("https://gitee.com/wangrui5015/Zotero-WPSJS");
            
                break;
            }
            case "uninstallZotero":{
                const conValue=window.Application.confirm("您即将卸载此插件！是否继续？")
            
                if (!conValue) {
                    return; // 用户取消时直接退出
                }
                if(conValue){

                    if(osInfo=="windows"){
                        window.Application.ActiveDocument.Save()
                  
                       
                        window.Application.ActiveDocument.Saved= true
                        await  postRequestXHRAsync('http://127.0.0.1:21931/stopproxy', null)
                        
                        runServers("uninstallZoteroAddin",wps.Env.GetAppDataPath() + '/kingsoft/wps/jsaddons/winUninstall.exe','jsMaximizedFocus');
                         const tmpJson=window.Application.Env.GetTempPath()+"/settings.json"
                         if(window.Application.FileSystem.Exists(tmpJson)){
                            window.Application.FileSystem.Remove(tmpJson)
                         }
                        window.Application.Quit(-1)
                       
                        alert("卸载成功！")
                        return;
                    }else if(osInfo=="macos"){
                        window.Application.ActiveDocument.Save()
                        window.Application.ActiveDocument.Saved= true
                        await  postRequestXHRAsync('http://127.0.0.1:21931/stopproxy', null)
                        runServers("uninstallZoteroAdd",'open '+ wps.Env.GetHomePath() + '/.kingsoft/wps/jsaddons/macUninstall.app','jsMaximizedFocus');
                        const tmpJson=window.Application.Env.GetTempPath()+"/settings.json"
                        if(window.Application.FileSystem.Exists(tmpJson)){
                           window.Application.FileSystem.Remove(tmpJson)
                        }
                        window.Application.Quit(-1)
                     
                        alert("卸载成功！")
                        return;
                    }

                }
           
                }
                default:
   
    }
    return true;
}