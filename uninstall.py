#!/usr/bin/env python3
# uninstall.py - 独立卸载程序

import os
import platform
import shutil
import sys
import re
import stat
import time  # 导入时间模块


# 检测操作系统并设置路径

if platform.system() == 'Darwin':  # macOS
    ADDON_PATH = os.path.expanduser('~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons')
elif platform.system() == 'Linux':  # Linux
    ADDON_PATH = os.path.join(os.environ['HOME'], '.local/share/Kingsoft/wps/jsaddons')
else:  # Windows
    ADDON_PATH = os.path.join(os.environ['APPDATA'], 'kingsoft', 'wps', 'jsaddons')

XML_PATHS = {
    'publish': os.path.join(ADDON_PATH, 'publish.xml'),
}
PROXY_PATH = os.path.join(ADDON_PATH, 'proxy.py')

def del_rw(action, name, exc):
    """处理只读文件删除"""
    os.chmod(name, stat.S_IWRITE)
    os.remove(name)

def uninstall():
    print("正在停止代理服务器...")
  

    print("\n正在清理XML注册记录...")
    if not os.path.isdir(ADDON_PATH):
        print("未找到安装目录")
        return

    # 清理XML注册记录
    for xml_file in XML_PATHS.values():
        if not os.path.isfile(xml_file):
            continue
            
        print(f"清理注册文件: {xml_file}")
        try:
            with open(xml_file, 'r+') as f:
                content = f.read()
                # 使用正则表达式匹配并删除相关条目
                new_content = re.sub(r'\s*<jsplugin[^>]*wps-zotero[^>]*/>\s*', '', content)
                f.seek(0)
                f.truncate()
                f.write(new_content)
        except Exception as e:
            print(f"清理XML文件失败: {e}")

    print("\n正在移除插件文件...")
    # 删除插件目录
    for item in os.listdir(ADDON_PATH):
        if 'wps-zotero' in item.lower():
            full_path = os.path.join(ADDON_PATH, item)
            if os.path.isdir(full_path):
                print(f"正在删除目录: {full_path}")
                try:
                    shutil.rmtree(full_path, onerror=del_rw)
                except Exception as e:
                    print(f"删除目录失败: {e}")

    print("\n卸载完成！")

if __name__ == '__main__':
    print("WPS-Zotero 插件卸载程序")
    print("=" * 40)
    
    print("将在 5 秒后开始卸载程序...")
    time.sleep(5)  # 延迟 5 秒
    
    uninstall()
    
    # 额外清理可能残留的文件
    residual_files = [
        os.path.join(ADDON_PATH, 'wps-zotero_1.0.0'),
        os.path.join(ADDON_PATH, 'proxy.py')
    ]
    
    for file in residual_files:
        if os.path.exists(file):
            print(f"清理残留文件: {file}")
            try:
                if os.path.isdir(file):
                    shutil.rmtree(file, onerror=del_rw)
                else:
                    os.remove(file)
            except Exception as e:
                print(f"清理失败: {e}")